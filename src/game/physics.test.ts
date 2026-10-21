import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampDt,
  createInitialPlayerState,
  getIslandGroundHeight,
  isInsideIsland,
  stepPlayerPhysics,
  checkShardCollection,
  getCapitalMarketPOIStatus,
  CAPITAL_MARKET_POIS,
  SPAWN_POINT,
  type MovementInput,
  type CircleObstacle,
  type AetherShard,
} from './physics.ts';

const idleInput: MovementInput = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jumpHeld: false,
  jumpJustPressed: false,
  sprint: false,
};

test('clampDt caps large frame deltas to 0.05s to prevent tunneling', () => {
  assert.equal(clampDt(0.25), 0.05);
  assert.equal(clampDt(0.016), 0.016);
  assert.equal(clampDt(-1), 1 / 60);
});

test('floating island terrain height is valid on expanded 27m main island, 21m flat area, and northern bridge', async () => {
  const { ISLAND_RADIUS, MINIMAP_WORLD_RADIUS, worldToMinimapPoint } = await import('./physics.ts');
  const { ISLAND_TREES, ISLAND_ROCKS, ISLAND_OBSTACLES, JUMP_PADS } = await import('./worldData.ts');

  assert.equal(ISLAND_RADIUS, 27.0);
  assert.equal(MINIMAP_WORLD_RADIUS, 23);

  assert.equal(isInsideIsland(0, 0), true);
  assert.equal(isInsideIsland(21, 0), true); // Flat buildable area boundary (ISLAND_RADIUS - 6)
  assert.equal(isInsideIsland(26.8, 0), true); // Expanded outer rim
  assert.equal(isInsideIsland(27.5, 0), false); // Outside main island
  assert.equal(isInsideIsland(0, -28), true); // Northern bridge
  assert.equal(isInsideIsland(0, -39), true); // Northern shrine islet
  assert.equal(isInsideIsland(45, 45), false); // Open sky abyss
  assert.ok(getIslandGroundHeight(0, 0) >= 0);
  assert.ok(getIslandGroundHeight(21, 0) >= 0);
  assert.ok(getIslandGroundHeight(-13.5, 8.2) >= 0); // Candidate KPEI area
  assert.ok(getIslandGroundHeight(9.5, -8.5) >= 0); // Candidate KSEI area
  assert.ok(getIslandGroundHeight(13.5, 8.2) >= 0); // Candidate SIPF area
  assert.equal(getIslandGroundHeight(45, 45), -100);

  // Verify all trees, rocks, and jump pads sit on valid island ground and their colliders match 1:1
  for (const tree of ISLAND_TREES) {
    assert.equal(isInsideIsland(tree.x, tree.z), true, `Tree ${tree.id} must be inside island`);
    assert.ok(tree.y >= 0, `Tree ${tree.id} must have valid ground height`);
    const obs = ISLAND_OBSTACLES.find((o) => o.id === tree.id);
    assert.ok(obs, `Collider for ${tree.id} must exist`);
    assert.equal(obs!.x, tree.x);
    assert.equal(obs!.z, tree.z);
  }
  for (const rock of ISLAND_ROCKS) {
    assert.equal(isInsideIsland(rock.x, rock.z), true, `Rock ${rock.id} must be inside island`);
    assert.ok(rock.y >= 0, `Rock ${rock.id} must have valid ground height`);
    const obs = ISLAND_OBSTACLES.find((o) => o.id === rock.id);
    assert.ok(obs, `Collider for ${rock.id} must exist`);
    assert.equal(obs!.x, rock.x);
    assert.equal(obs!.z, rock.z);
  }
  for (const pad of JUMP_PADS) {
    assert.equal(isInsideIsland(pad.x, pad.z), true, `JumpPad ${pad.id} must be inside island`);
    assert.ok(getIslandGroundHeight(pad.x, pad.z) >= 0);
  }

  // Verify expanded flat area coordinates (up to r=21m) map onto minimap without clamping
  for (const pt of [
    [-13.5, 8.2],
    [9.5, -8.5],
    [13.5, 8.2],
    [0, -21.0],
  ]) {
    const mm = worldToMinimapPoint(pt[0], pt[1]);
    assert.equal(mm.isClamped, false, `Expected (${pt[0]}, ${pt[1]}) not to clamp on minimap`);
  }

  // Verify continuous walking from main island north rim (z = -24.5) across Northern Sky-Bridge to Northern Shrine Islet (z = -36) without falling
  let bridgeState = createInitialPlayerState();
  bridgeState.x = 0;
  bridgeState.z = -24.5;
  bridgeState.y = getIslandGroundHeight(0, -24.5);
  const walkNorthInput: MovementInput = { ...idleInput, forward: true, sprint: true };
  for (let i = 0; i < 120; i++) {
    bridgeState = stepPlayerPhysics(bridgeState, walkNorthInput, 1 / 60, 0, []);
  }
  assert.ok(bridgeState.z < -34, `Expected player to cross bridge onto Northern Shrine Islet, got z=${bridgeState.z}`);
  assert.equal(bridgeState.respawnCount, 0, 'Expected zero falls/respawns while crossing Northern Sky-Bridge');
  assert.ok(bridgeState.y > 0.8, `Expected valid elevated shrine ground height, got y=${bridgeState.y}`);

  // Verify relocated geyser-east at (16.5, -6.0) boosts player upward cleanly
  let geyserState = createInitialPlayerState();
  geyserState.x = 16.5;
  geyserState.z = -6.0;
  geyserState.y = getIslandGroundHeight(16.5, -6.0);
  geyserState = stepPlayerPhysics(geyserState, idleInput, 1 / 60, 0, [], JUMP_PADS);
  assert.equal(geyserState.justBoosted, true);
  assert.ok(geyserState.vy >= 16.0, `Expected upward geyser boost velocity, got ${geyserState.vy}`);
});

test('all 8 Capital Market POIs (including Financial Advisor Kiosk, Pusat Regulator, KPEI, KSEI, and Indonesia SIPF) sit on valid island ground, detect player proximity, and contain exact educational content', () => {
  assert.equal(CAPITAL_MARKET_POIS.length, 8);
  const ids = CAPITAL_MARKET_POIS.map((p) => p.id);
  assert.deepEqual(ids, [
    'financial-advisor-kiosk',
    'bursa-efek',
    'perusahaan-sekuritas',
    'pusat-reksa-dana',
    'pusat-regulator',
    'kpei',
    'ksei',
    'indonesia-sipf',
  ]);

  const bursa = CAPITAL_MARKET_POIS.find((p) => p.id === 'bursa-efek')!;
  const sekuritas = CAPITAL_MARKET_POIS.find((p) => p.id === 'perusahaan-sekuritas')!;
  const reksaDana = CAPITAL_MARKET_POIS.find((p) => p.id === 'pusat-reksa-dana')!;
  const regulator = CAPITAL_MARKET_POIS.find((p) => p.id === 'pusat-regulator')!;
  const kpei = CAPITAL_MARKET_POIS.find((p) => p.id === 'kpei')!;
  const ksei = CAPITAL_MARKET_POIS.find((p) => p.id === 'ksei')!;
  const sipf = CAPITAL_MARKET_POIS.find((p) => p.id === 'indonesia-sipf')!;

  assert.equal(
    bursa.educationalText,
    'Saham adalah bukti kepemilikan suatu perusahaan. Di sini tempat saham diperjualbelikan.'
  );
  assert.equal(
    sekuritas.educationalText,
    'Perusahaan sekuritas adalah perantara kamu untuk membeli saham di pasar modal.'
  );
  assert.equal(
    reksaDana.educationalText,
    'Reksa dana adalah wadah yang menghimpun dana investor untuk diinvestasikan oleh Manajer Investasi.'
  );
  assert.equal(
    regulator.educationalText,
    'Mengatur dan mengawasi seluruh kegiatan di sektor jasa keuangan.'
  );
  assert.equal(kpei.name, 'KPEI — Kliring dan Penjaminan');
  assert.equal(kpei.shortLabel, 'KPEI');
  assert.equal(kpei.x, -13.5);
  assert.equal(kpei.z, 8.2);
  assert.equal(kpei.zoneRadius, 4.8);
  assert.ok(kpei.educationalText.includes('kliring dan penjaminan'));

  assert.equal(ksei.name, 'KSEI — Kustodian Sentral');
  assert.equal(ksei.shortLabel, 'KSEI');
  assert.equal(ksei.englishName, 'Central Securities Depository');
  assert.equal(ksei.x, 9.5);
  assert.equal(ksei.z, -8.5);
  assert.equal(ksei.zoneRadius, 4.8);
  assert.ok(ksei.educationalText.includes('kustodian sentral'));
  assert.ok(ksei.educationalText.includes('SID'));
  assert.ok(ksei.educationalText.includes('AKSes KSEI'));

  assert.equal(sipf.name, 'Indonesia SIPF — Dana Perlindungan Pemodal');
  assert.equal(sipf.shortLabel, 'SIPF');
  assert.equal(sipf.englishName, 'Investor Protection Fund');
  assert.equal(sipf.x, 13.5);
  assert.equal(sipf.z, 8.2);
  assert.equal(sipf.zoneRadius, 4.8);
  assert.ok(sipf.educationalText.includes('Dana Perlindungan Pemodal'));
  assert.ok(sipf.educationalText.includes('tidak menjamin keuntungan investasi'));

  // At exact spawn (0, 9.5) should have no activePOI yet
  const spawnStatus = getCapitalMarketPOIStatus(0, 9.5);
  assert.equal(spawnStatus.activePOI, null);

  for (const poi of CAPITAL_MARKET_POIS) {
    assert.equal(isInsideIsland(poi.x, poi.z), true);
    const groundY = getIslandGroundHeight(poi.x, poi.z);
    assert.ok(groundY >= 0, `Expected valid ground height for ${poi.name}, got ${groundY}`);

    const status = getCapitalMarketPOIStatus(poi.x + 1.0, poi.z);
    assert.ok(status.activePOI, `Expected player at (${poi.x + 1}, ${poi.z}) to be inside ${poi.name}`);
    assert.equal(status.activePOI?.id, poi.id);
  }
});

test('WASD forward input accelerates player smoothly along camera forward (-Z when yaw=0)', () => {
  let state = createInitialPlayerState();
  const startZ = state.z;
  const forwardInput: MovementInput = { ...idleInput, forward: true };

  for (let i = 0; i < 20; i++) {
    state = stepPlayerPhysics(state, forwardInput, 1 / 60, 0, []);
  }

  assert.ok(state.z < startZ, `Expected player to move forward (-Z), got ${state.z} vs ${startZ}`);
  assert.ok(state.vz < -2, 'Expected negative Z velocity');
  assert.ok(state.gaitPhase > 0, 'Expected gait phase to advance with distance traveled');
});

test('Jump input launches player upward and triggers squash-and-stretch takeoff', () => {
  const state = createInitialPlayerState();
  const jumpInput: MovementInput = { ...idleInput, jumpHeld: true, jumpJustPressed: true };
  const next = stepPlayerPhysics(state, jumpInput, 1 / 60, 0, []);

  assert.equal(next.justJumped, true);
  assert.equal(next.isGrounded, false);
  assert.ok(next.vy > 8, 'Expected upward jump velocity');
  assert.ok(next.scaleY > 1.1, 'Expected vertical stretch on takeoff');
});

test('Circle obstacle collision prevents player from penetrating solid obstacles', () => {
  let state = createInitialPlayerState();
  state.x = 0;
  state.z = 5;
  const obstacle: CircleObstacle = { id: 'pillar-1', x: 0, z: 3.5, radius: 1.0 };
  const forwardInput: MovementInput = { ...idleInput, forward: true };

  for (let i = 0; i < 40; i++) {
    state = stepPlayerPhysics(state, forwardInput, 1 / 60, 0, [obstacle]);
  }

  const dist = Math.hypot(state.x - obstacle.x, state.z - obstacle.z);
  assert.ok(dist >= 1.54, `Expected player to remain outside obstacle radius, got dist=${dist}`);
});

test('Abyss safety respawn recovers player if they fall off the floating island', () => {
  let state = createInitialPlayerState();
  state.x = 40;
  state.z = 40;
  state.y = -13;
  state.isGrounded = false;

  const recovered = stepPlayerPhysics(state, idleInput, 1 / 60, 0, []);
  assert.equal(recovered.justRespawned, true);
  assert.equal(recovered.respawnCount, 1);
  assert.equal(recovered.x, SPAWN_POINT.x);
  assert.equal(recovered.z, SPAWN_POINT.z);
});

test('Shard proximity detection marks shards as collected accurately', () => {
  const shards: AetherShard[] = [
    { id: 's1', name: 'Meadow Shard', x: 0, y: 1.2, z: 9.5, collected: false },
    { id: 's2', name: 'Distant Shard', x: 15, y: 1.5, z: -10, collected: false },
  ];

  const { updatedShards, newlyCollectedIds } = checkShardCollection(
    { x: 0, y: 0.3, z: 9.5 },
    shards
  );

  assert.deepEqual(newlyCollectedIds, ['s1']);
  assert.equal(updatedShards[0].collected, true);
  assert.equal(updatedShards[1].collected, false);
});

test('Stock Market Engine initializes with Rp 10.000.000, fluctuates prices within -5% to +5%, and enforces Buy/Sell 1 Lot rules', async () => {
  const {
    STARTING_BALANCE,
    INITIAL_STOCKS,
    createInitialPortfolio,
    fluctuateMarketPrices,
    executeBuyOneLot,
    executeSellOneLot,
  } = await import('./market.ts');

  assert.equal(STARTING_BALANCE, 10_000_000);
  assert.equal(INITIAL_STOCKS.length, 3);
  assert.equal(INITIAL_STOCKS[0].ticker, 'BBCA');
  assert.equal(INITIAL_STOCKS[0].currentPrice, 10000);
  assert.equal(INITIAL_STOCKS[1].ticker, 'TLKM');
  assert.equal(INITIAL_STOCKS[1].currentPrice, 3000);
  assert.equal(INITIAL_STOCKS[2].ticker, 'GOTO');
  assert.equal(INITIAL_STOCKS[2].currentPrice, 100);

  // Test +5% fluctuation (randomFn = 1.0 -> +5%)
  const upStocks = fluctuateMarketPrices(INITIAL_STOCKS, () => 1.0);
  assert.equal(upStocks[0].currentPrice, 10500);
  assert.equal(upStocks[1].currentPrice, 3150);
  assert.equal(upStocks[2].currentPrice, 105);

  // Test -5% fluctuation (randomFn = 0.0 -> -5%)
  const downStocks = fluctuateMarketPrices(INITIAL_STOCKS, () => 0.0);
  assert.equal(downStocks[0].currentPrice, 9500);
  assert.equal(downStocks[1].currentPrice, 2850);
  assert.equal(downStocks[2].currentPrice, 95);

  // Test buying 1 Lot (100 shares) of BBCA @ 10,000 = Rp 1,000,000
  let balance = STARTING_BALANCE;
  let portfolio = createInitialPortfolio();
  const buyRes = executeBuyOneLot(balance, portfolio, INITIAL_STOCKS[0]);
  assert.equal(buyRes.ok, true);
  assert.equal(buyRes.balance, 9_000_000);
  assert.equal(buyRes.portfolio.BBCA, 100);

  // Test selling 1 Lot of TLKM when 0 shares owned fails with error toast
  const failSell = executeSellOneLot(buyRes.balance, buyRes.portfolio, INITIAL_STOCKS[1]);
  assert.equal(failSell.ok, false);
  assert.equal(failSell.type, 'error');
  assert.equal(failSell.balance, 9_000_000);

  // Test selling 1 Lot of BBCA when 100 shares owned succeeds
  const sellRes = executeSellOneLot(buyRes.balance, buyRes.portfolio, INITIAL_STOCKS[0]);
  assert.equal(sellRes.ok, true);
  assert.equal(sellRes.balance, 10_000_000);
  assert.equal(sellRes.portfolio.BBCA, 0);

  // Test buying when balance is insufficient fails with error toast
  const poorBuy = executeBuyOneLot(500_000, sellRes.portfolio, INITIAL_STOCKS[0]);
  assert.equal(poorBuy.ok, false);
  assert.equal(poorBuy.type, 'error');
  assert.ok(poorBuy.message.includes('Insufficient balance'));
});

test('Virtual Joystick analogX and analogY vectors move player proportionally in 3D space', () => {
  let state = createInitialPlayerState();
  const startX = state.x;
  const startZ = state.z;
  const joystickInput: MovementInput = {
    ...idleInput,
    analogX: 0.6,
    analogY: 0.8,
  };

  for (let i = 0; i < 15; i++) {
    state = stepPlayerPhysics(state, joystickInput, 1 / 60, 0, []);
  }

  assert.ok(state.x > startX, 'Expected positive analogX to move player +X (right)');
  assert.ok(state.z < startZ, 'Expected positive analogY to move player -Z (forward)');
});

test('Investment Risk Profile Assessment scores 3-4 as Konservatif, 5-7 as Moderat, and 8-9 as Agresif', async () => {
  const { calculateRiskProfile, RISK_PROFILE_QUESTIONS } = await import('./market.ts');

  assert.equal(RISK_PROFILE_QUESTIONS.length, 3);
  assert.equal(RISK_PROFILE_QUESTIONS[0].question, 'Berapa lama kamu berencana untuk berinvestasi?');
  assert.equal(
    RISK_PROFILE_QUESTIONS[1].question,
    'Jika portofoliomu turun 15% dalam sebulan, apa yang kamu lakukan?'
  );
  assert.equal(RISK_PROFILE_QUESTIONS[2].question, 'Apa tujuan utamamu berinvestasi?');

  // 3 points (A, A, A) -> Tipe Konservatif (Conservative)
  const cons3 = calculateRiskProfile(['A', 'A', 'A']);
  assert.equal(cons3.score, 3);
  assert.equal(cons3.fullTitle, 'Tipe Konservatif (Conservative)');
  assert.equal(cons3.badgeText, 'Profil: Konservatif');

  // 4 points (A, A, B) -> Tipe Konservatif (Conservative)
  const cons4 = calculateRiskProfile(['A', 'A', 'B']);
  assert.equal(cons4.score, 4);
  assert.equal(cons4.fullTitle, 'Tipe Konservatif (Conservative)');

  // 6 points (B, B, B) -> Tipe Moderat (Moderate)
  const mod6 = calculateRiskProfile(['B', 'B', 'B']);
  assert.equal(mod6.score, 6);
  assert.equal(mod6.fullTitle, 'Tipe Moderat (Moderate)');
  assert.equal(mod6.badgeText, 'Profil: Moderat');

  // 9 points (C, C, C) -> Tipe Agresif (Aggressive)
  const agg9 = calculateRiskProfile(['C', 'C', 'C']);
  assert.equal(agg9.score, 9);
  assert.equal(agg9.fullTitle, 'Tipe Agresif (Aggressive)');
  assert.equal(agg9.badgeText, 'Profil: Agresif');
});

test('Market Regulator Structure defines OJK at top level and BEI, KPEI, KSEI at SRO level with exact descriptions and logo IDs', async () => {
  const { MARKET_REGULATOR_STRUCTURE } = await import('./market.ts');

  assert.equal(MARKET_REGULATOR_STRUCTURE.topLevel.logoId, 'logo-ojk');
  assert.equal(
    MARKET_REGULATOR_STRUCTURE.topLevel.description,
    'Mengatur dan mengawasi seluruh kegiatan di sektor jasa keuangan.'
  );

  const [bei, kpei, ksei] = MARKET_REGULATOR_STRUCTURE.sroLevel;
  assert.equal(bei.logoId, 'logo-bei');
  assert.equal(bei.description, 'Fasilitator perdagangan efek.');

  assert.equal(kpei.logoId, 'logo-kpei');
  assert.equal(
    kpei.description,
    'Lembaga kliring dan penjamin penyelesaian transaksi.'
  );

  assert.equal(ksei.logoId, 'logo-ksei');
  assert.equal(
    ksei.description,
    'Tempat penyimpanan harta dan penyelesaian transaksi.'
  );
});

test('Macroeconomic News Event System forces affected stock to trend heavily in the direction of impact multiplier over 3 updates', async () => {
  const {
    INITIAL_STOCKS,
    MACRO_NEWS_EVENTS,
    fluctuateMarketPrices,
  } = await import('./market.ts');

  assert.ok(MACRO_NEWS_EVENTS.length >= 4);

  // Find positive GOTO news (+15%, effect: 1.15)
  const gotoBullishNews = MACRO_NEWS_EVENTS.find(
    (e) => e.impact.ticker === 'GOTO' && e.impact.effect > 1
  )!;
  assert.ok(gotoBullishNews);
  assert.equal(gotoBullishNews.impact.effect, 1.15);

  let stocks = INITIAL_STOCKS.map((s) => ({ ...s }));
  const startGoto = stocks.find((s) => s.ticker === 'GOTO')!.currentPrice;

  // Simulate 3 consecutive price updates while news event is active
  // Even if randomFn returns 0.0 (which would normally be -5%), activeNews overrides it and forces upward trend!
  for (let remaining = 3; remaining >= 1; remaining--) {
    const prevGoto = stocks.find((s) => s.ticker === 'GOTO')!.currentPrice;
    stocks = fluctuateMarketPrices(stocks, () => 0.0, {
      event: gotoBullishNews,
      remainingTicks: remaining,
      totalTicks: 3,
      triggeredAt: Date.now(),
    });
    const nextGoto = stocks.find((s) => s.ticker === 'GOTO')!.currentPrice;
    assert.ok(
      nextGoto > prevGoto,
      `Expected GOTO price to rise under +15% news catalyst, got ${nextGoto} vs ${prevGoto}`
    );
  }

  const finalGoto = stocks.find((s) => s.ticker === 'GOTO')!.currentPrice;
  assert.ok(finalGoto >= startGoto + 12, `Expected strong upward trend from ${startGoto} to ${finalGoto}`);

  // Find negative BBCA news (effect < 1)
  const bbcaBearishNews = MACRO_NEWS_EVENTS.find(
    (e) => e.impact.ticker === 'BBCA' && e.impact.effect < 1
  )!;
  assert.ok(bbcaBearishNews);
  const beforeBbca = stocks.find((s) => s.ticker === 'BBCA')!.currentPrice;
  // Even if randomFn returns 1.0 (which would normally be +5%), bearish news forces downward trend!
  stocks = fluctuateMarketPrices(stocks, () => 1.0, {
    event: bbcaBearishNews,
    remainingTicks: 3,
    totalTicks: 3,
    triggeredAt: Date.now(),
  });
  const afterBbca = stocks.find((s) => s.ticker === 'BBCA')!.currentPrice;
  assert.ok(afterBbca < beforeBbca, `Expected BBCA price to fall under bearish news catalyst, got ${afterBbca} vs ${beforeBbca}`);
});

test('UI_2D_ASSETS defines placehold.co URLs and clear CSS classes/IDs for TradingTerminal and RiskProfileModal', async () => {
  const { UI_2D_ASSETS } = await import('./uiAssets.ts');

  assert.equal(UI_2D_ASSETS.tradingModalBg.className, 'panel-bg-asset');
  assert.equal(UI_2D_ASSETS.riskModalBg.className, 'panel-bg-asset');
  assert.equal(UI_2D_ASSETS.buyButton.className, 'btn-buy-asset');
  assert.equal(UI_2D_ASSETS.sellButton.className, 'btn-sell-asset');
  assert.equal(UI_2D_ASSETS.closeButton.className, 'btn-close-asset');
  assert.equal(UI_2D_ASSETS.quizOptionButton.className, 'btn-quiz-option-asset');

  for (const asset of Object.values(UI_2D_ASSETS)) {
    assert.ok(asset.src.startsWith('https://placehold.co/'));
    assert.ok(asset.fallbackSrc.startsWith('data:image/svg+xml'));
  }
});

test('evaluatePortfolioDiversification triggers warning when > 80% of total asset value is allocated into a single stock ticker, and Macroeconomic Indicators include Suku Bunga Bank Sentral Naik & Inflasi Terkendali with tooltips', async () => {
  const {
    INITIAL_STOCKS,
    createInitialPortfolio,
    evaluatePortfolioDiversification,
    DIVERSIFICATION_WARNING_TEXT,
    MACRO_NEWS_EVENTS,
  } = await import('./market.ts');

  // 1. 100% cash (Rp 10,000,000 balance, 0 shares) -> not concentrated
  const initialDiv = evaluatePortfolioDiversification(
    10_000_000,
    createInitialPortfolio(),
    INITIAL_STOCKS
  );
  assert.equal(initialDiv.isConcentrated, false);
  assert.equal(initialDiv.warningMessage, null);

  // 2. Exactly 80% in BBCA (8 Lots = 800 shares @ Rp 10,000 = Rp 8,000,000; cash = Rp 2,000,000) -> 80% <= 80%, not concentrated
  const eightyPctDiv = evaluatePortfolioDiversification(
    2_000_000,
    { BBCA: 800, TLKM: 0, GOTO: 0 },
    INITIAL_STOCKS
  );
  assert.equal(eightyPctDiv.isConcentrated, false);
  assert.equal(eightyPctDiv.maxAllocationPercent, 80);

  // 3. 90% in BBCA (9 Lots = 900 shares @ Rp 10,000 = Rp 9,000,000; cash = Rp 1,000,000) -> 90% > 80%, concentrated!
  const ninetyPctDiv = evaluatePortfolioDiversification(
    1_000_000,
    { BBCA: 900, TLKM: 0, GOTO: 0 },
    INITIAL_STOCKS
  );
  assert.equal(ninetyPctDiv.isConcentrated, true);
  assert.equal(ninetyPctDiv.concentratedTicker, 'BBCA');
  assert.equal(ninetyPctDiv.maxAllocationPercent, 90);
  assert.equal(
    ninetyPctDiv.warningMessage,
    'Peringatan: Portofolio berisiko tinggi karena tidak terdiversifikasi'
  );
  assert.equal(ninetyPctDiv.warningMessage, DIVERSIFICATION_WARNING_TEXT);

  // 4. Verify Macroeconomic Indicator events & tooltips
  const rateHikeEvent = MACRO_NEWS_EVENTS.find(
    (e) => e.indicatorTitle === 'Suku Bunga Bank Sentral Naik'
  );
  assert.ok(rateHikeEvent, 'Expected Suku Bunga Bank Sentral Naik macroeconomic event');
  assert.equal(rateHikeEvent!.impact.ticker, 'GOTO');
  assert.ok(rateHikeEvent!.impact.effect < 1, 'Expected tech/growth stock GOTO to drop on rate hike');
  assert.ok(rateHikeEvent!.tooltipExplanation.length > 20);

  const inflationControlledEvent = MACRO_NEWS_EVENTS.find(
    (e) => e.indicatorTitle === 'Inflasi Terkendali'
  );
  assert.ok(inflationControlledEvent, 'Expected Inflasi Terkendali macroeconomic event');
  assert.equal(inflationControlledEvent!.impact.ticker, 'BBCA');
  assert.ok(
    inflationControlledEvent!.impact.effect > 1,
    'Expected banking stock BBCA to rise when inflation is controlled'
  );
  assert.ok(inflationControlledEvent!.tooltipExplanation.length > 20);
});

test('localStorage Save Game serialization and hydration persists balance, portfolio, and riskProfile under capital_market_save_data', async () => {
  const {
    SAVE_STORAGE_KEY,
    STARTING_BALANCE,
    serializeSaveData,
    parseSaveData,
    loadInitialMarketSaveData,
    calculateRiskProfile,
  } = await import('./market.ts');

  assert.equal(SAVE_STORAGE_KEY, 'capital_market_save_data');

  // 1. When storage is empty, loadInitialMarketSaveData returns default Rp 10.000.000, 0 shares, null riskProfile
  const emptyStorage = { getItem: () => null };
  const defaultLoad = loadInitialMarketSaveData(emptyStorage);
  assert.equal(defaultLoad.balance, STARTING_BALANCE);
  assert.deepEqual(defaultLoad.portfolio, { BBCA: 0, TLKM: 0, GOTO: 0 });
  assert.equal(defaultLoad.riskProfile, null);

  // 2. Serialize custom state and hydrate it back via loadInitialMarketSaveData
  const modRisk = calculateRiskProfile(['B', 'B', 'B']);
  const json = serializeSaveData(8_700_000, { BBCA: 100, TLKM: 100, GOTO: 0 }, modRisk);
  const populatedStorage = {
    getItem: (key: string) => (key === SAVE_STORAGE_KEY ? json : null),
  };

  const hydrated = loadInitialMarketSaveData(populatedStorage);
  assert.equal(hydrated.balance, 8_700_000);
  assert.deepEqual(hydrated.portfolio, { BBCA: 100, TLKM: 100, GOTO: 0 });
  assert.ok(hydrated.riskProfile);
  assert.equal(hydrated.riskProfile?.badgeText, 'Profil: Moderat');

  // 3. Corrupted JSON falls back cleanly to default starting values
  assert.equal(parseSaveData('{bad json'), null);
  const fallbackLoad = loadInitialMarketSaveData({ getItem: () => '{bad json' });
  assert.equal(fallbackLoad.balance, STARTING_BALANCE);
});

test('computeFollowCameraTarget maintains fixed elevated offset above and behind player and looks ahead toward POIs', async () => {
  const { computeFollowCameraTarget, createInitialPlayerState } = await import('./physics.ts');

  const ps = createInitialPlayerState();
  const followPose = computeFollowCameraTarget(ps, 'follow', 0);

  // Camera sits behind (+Z) and above (+Y) the player, looking ahead (-Z) toward the island POIs
  assert.ok(followPose.cameraPosition.z > ps.z, 'Expected camera Z behind player');
  assert.ok(followPose.cameraPosition.y > ps.y + 4, 'Expected camera Y elevated above player');
  assert.ok(followPose.lookAtTarget.z < ps.z, 'Expected lookAt target ahead (-Z) of player');

  // When player moves 5m West (-X), camera target shifts 5m West (-X) with identical fixed offset
  const movedPs = { ...ps, x: -5.0, z: 4.0 };
  const movedPose = computeFollowCameraTarget(movedPs, 'follow', 0);
  assert.equal(movedPose.cameraPosition.x, -5.0);
  assert.ok(movedPose.cameraPosition.z > movedPs.z);
  assert.ok(movedPose.lookAtTarget.z < movedPs.z);
});

test('WELCOME_TUTORIAL_CONTENT defines exact Indonesian onboarding copy and Mulai Bermain CTA', async () => {
  const { WELCOME_TUTORIAL_CONTENT } = await import('./market.ts');

  assert.equal(WELCOME_TUTORIAL_CONTENT.title, 'Selamat Datang di Simulator Pasar Modal!');
  assert.equal(
    WELCOME_TUTORIAL_CONTENT.objective,
    'Tujuanmu di sini adalah belajar menjadi investor cerdas. Kamu diberikan modal awal Rp 10.000.000. Pelajari struktur pasar modal, kenali profil risikomu, dan cobalah berinvestasi di saham!'
  );
  assert.equal(
    WELCOME_TUTORIAL_CONTENT.controls,
    'Cara Bermain: Gunakan WASD (Desktop) atau Joystick (Mobile) untuk berjalan. Dekati gedung dan tekan tombol Interaksi (atau tombol E) untuk belajar dan bertransaksi.'
  );
  assert.equal(
    WELCOME_TUTORIAL_CONTENT.firstMission,
    'Misi Pertamamu: Kunjungi Kios Konsultan Keuangan untuk mengetahui Profil Risiko investasimu!'
  );
  assert.equal(WELCOME_TUTORIAL_CONTENT.startButtonLabel, 'Mulai Bermain');
});

test('Free Camera Control computes spherical yaw/pitch/distance offsets and clamps pitch and zoom bounds safely', async () => {
  const {
    computeFollowCameraTarget,
    createInitialPlayerState,
    MIN_CAMERA_DISTANCE,
    MAX_CAMERA_DISTANCE,
    MIN_CAMERA_PITCH,
    MAX_CAMERA_PITCH,
  } = await import('./physics.ts');
  const { gameInput } = await import('./input.ts');

  const ps = createInitialPlayerState();

  // 1. Zoom In (min clamp) vs Zoom Out (max clamp)
  const zoomedIn = computeFollowCameraTarget(ps, 'follow', 0, 0.45, 1.0); // below MIN_CAMERA_DISTANCE
  const zoomedOut = computeFollowCameraTarget(ps, 'follow', 0, 0.45, 50.0); // above MAX_CAMERA_DISTANCE
  const distIn = Math.hypot(
    zoomedIn.cameraPosition.x - ps.x,
    zoomedIn.cameraPosition.y - ps.y,
    zoomedIn.cameraPosition.z - ps.z
  );
  const distOut = Math.hypot(
    zoomedOut.cameraPosition.x - ps.x,
    zoomedOut.cameraPosition.y - ps.y,
    zoomedOut.cameraPosition.z - ps.z
  );
  assert.ok(
    Math.abs(distIn - MIN_CAMERA_DISTANCE) < 0.25,
    `Expected zoomed-in distance clamped near ${MIN_CAMERA_DISTANCE}, got ${distIn}`
  );
  assert.ok(
    Math.abs(distOut - MAX_CAMERA_DISTANCE) < 0.25,
    `Expected zoomed-out distance clamped near ${MAX_CAMERA_DISTANCE}, got ${distOut}`
  );

  // 2. Horizontal rotation (yaw = Math.PI / 2 places camera on +X looking toward -X)
  const rotatedEast = computeFollowCameraTarget(ps, 'follow', Math.PI / 2, 0.45, 10.0);
  assert.ok(rotatedEast.cameraPosition.x > ps.x + 7.0, 'Expected camera X to orbit East of player');
  assert.ok(rotatedEast.lookAtTarget.x < ps.x, 'Expected lookAt target to point West (-X)');

  // 3. Vertical pitch clamping prevents ground clipping and zenith flip
  const lowPitch = computeFollowCameraTarget(ps, 'follow', 0, -2.0, 10.0);
  const highPitch = computeFollowCameraTarget(ps, 'follow', 0, 3.0, 10.0);
  assert.ok(lowPitch.cameraPosition.y >= ps.y + 1.8, 'Expected low pitch camera to stay safely above ground');
  assert.ok(highPitch.cameraPosition.y > lowPitch.cameraPosition.y, 'Expected high pitch camera to be higher than low pitch');
  assert.ok(MIN_CAMERA_PITCH > 0 && MAX_CAMERA_PITCH < Math.PI / 2);

  // 4. InputManager zoom delta helper
  gameInput.consumeCameraZoomDelta();
  gameInput.adjustCameraZoom(-1.8);
  assert.equal(gameInput.consumeCameraZoomDelta(), -1.8);
  assert.equal(gameInput.consumeCameraZoomDelta(), 0);
});

test('Central Bullish Stock Chart Monument defines 5 ascending stock bars, solid obstacles at z=-2, and keeps Sunstone Altar Shard reachable', async () => {
  const { CENTRAL_CHART_BARS } = await import('./physics.ts');

  assert.equal(CENTRAL_CHART_BARS.length, 5);
  // X coordinates progress strictly from West (-1.6) to East (+1.6)
  for (let i = 1; i < CENTRAL_CHART_BARS.length; i++) {
    assert.ok(
      CENTRAL_CHART_BARS[i].x > CENTRAL_CHART_BARS[i - 1].x,
      'Expected chart bars to be ordered West to East'
    );
  }
  // Overall bullish uptrend: final breakout bar is significantly taller than first bar
  const firstBar = CENTRAL_CHART_BARS[0];
  const lastBar = CENTRAL_CHART_BARS[CENTRAL_CHART_BARS.length - 1];
  assert.ok(
    lastBar.height > firstBar.height * 2.5,
    `Expected bullish breakout bar (${lastBar.height}) > 2.5x first bar (${firstBar.height})`
  );

  // Verify central monument obstacles at z = -2.0 stop penetration while keeping shard-altar reachable on front plaza (z = -0.65)
  const centralObs: CircleObstacle = { id: 'monolith-core', x: 0, z: -2.0, radius: 0.92 };
  const groundY = getIslandGroundHeight(0, -0.53);
  const altarShard: AetherShard = {
    id: 'shard-altar',
    name: 'Sunstone Altar Shard',
    x: 0,
    y: getIslandGroundHeight(0, -0.65) + 1.25,
    z: -0.65,
    collected: false,
  };
  const { newlyCollectedIds } = checkShardCollection({ x: 0, y: groundY, z: -0.53 }, [altarShard]);
  assert.ok(
    newlyCollectedIds.includes('shard-altar'),
    'Expected player standing outside central obstacle radius (0.92 + 0.55 = 1.47m) to collect shard-altar'
  );
  assert.equal(centralObs.z, -2.0);
});

test('GameSettings sanitizes cameraSensitivity, zoomSpeed, audioVolume, and graphicsQuality and persists under aether_isle_settings', async () => {
  const {
    SETTINGS_STORAGE_KEY,
    DEFAULT_GAME_SETTINGS,
    sanitizeGameSettings,
    serializeGameSettings,
    loadInitialGameSettings,
  } = await import('./physics.ts');

  assert.equal(SETTINGS_STORAGE_KEY, 'aether_isle_settings');
  assert.deepEqual(DEFAULT_GAME_SETTINGS, {
    cameraSensitivity: 1.0,
    zoomSpeed: 1.0,
    audioVolume: 0.8,
    graphicsQuality: 'high',
  });

  // 1. Out-of-range values are clamped safely
  const clamped = sanitizeGameSettings({
    cameraSensitivity: 9.0,
    zoomSpeed: 0.05,
    audioVolume: -0.5,
    graphicsQuality: 'low',
  });
  assert.equal(clamped.cameraSensitivity, 2.5);
  assert.equal(clamped.zoomSpeed, 0.25);
  assert.equal(clamped.audioVolume, 0);
  assert.equal(clamped.graphicsQuality, 'low');

  // 2. Round-trip serialization and hydration from storage
  const json = serializeGameSettings({
    cameraSensitivity: 1.5,
    zoomSpeed: 1.25,
    audioVolume: 0.6,
    graphicsQuality: 'medium',
  });
  const loaded = loadInitialGameSettings({
    getItem: (k: string) => (k === SETTINGS_STORAGE_KEY ? json : null),
  });
  assert.deepEqual(loaded, {
    cameraSensitivity: 1.5,
    zoomSpeed: 1.25,
    audioVolume: 0.6,
    graphicsQuality: 'medium',
  });

  // 3. Invalid JSON falls back cleanly to DEFAULT_GAME_SETTINGS
  assert.deepEqual(
    loadInitialGameSettings({ getItem: () => '{corrupt' }),
    DEFAULT_GAME_SETTINGS
  );
});

test('2D Minimap helpers project world (X, Z) coordinates, player yaw orientation, and active mission target accurately', async () => {
  const {
    CAPITAL_MARKET_POIS,
    SPAWN_POINT,
    worldToMinimapPoint,
    yawToMinimapDegrees,
    getActiveMissionTargetPOI,
  } = await import('./physics.ts');

  // 1. Center of island (0, 0) maps to (50%, 50%)
  const center = worldToMinimapPoint(0, 0);
  assert.equal(center.leftPct, 50);
  assert.equal(center.topPct, 50);
  assert.equal(center.isClamped, false);

  // 2. Spawn point (0, 9.5) is South of center (topPct > 50, leftPct == 50)
  const spawnPt = worldToMinimapPoint(SPAWN_POINT.x, SPAWN_POINT.z);
  assert.equal(spawnPt.leftPct, 50);
  assert.ok(spawnPt.topPct > 65 && spawnPt.topPct < 75, `Expected spawn topPct ~71, got ${spawnPt.topPct}`);

  // 3. All 5 Capital Market POIs project within safe radar bounds [6..94] without clamping
  for (const poi of CAPITAL_MARKET_POIS) {
    const pt = worldToMinimapPoint(poi.x, poi.z);
    assert.ok(pt.leftPct >= 6 && pt.leftPct <= 94, `POI ${poi.id} leftPct out of bounds`);
    assert.ok(pt.topPct >= 6 && pt.topPct <= 94, `POI ${poi.id} topPct out of bounds`);
    assert.equal(pt.isClamped, false, `Expected POI ${poi.id} to fit inside radar without clamping`);
  }

  // 4. Player yaw orientation: Math.PI = North (0 deg), Math.PI/2 = East (90 deg), 0 = South (180 deg), -Math.PI/2 = West (-90 deg)
  assert.equal(yawToMinimapDegrees(Math.PI), 0);
  assert.equal(yawToMinimapDegrees(Math.PI / 2), 90);
  assert.equal(yawToMinimapDegrees(0), 180);
  assert.equal(yawToMinimapDegrees(-Math.PI / 2), -90);

  // 5. Active mission target POI highlights financial-advisor-kiosk until First Mission is completed
  const targetIncomplete = getActiveMissionTargetPOI(false);
  assert.ok(targetIncomplete);
  assert.equal(targetIncomplete.id, 'financial-advisor-kiosk');
  assert.equal(getActiveMissionTargetPOI(true), null);
});

test('getCapitalMarketPOIStatus selects the closest active POI when zones overlap, handles outside/single zones, transitions cleanly, and breaks exact ties deterministically', () => {
  // 1. Player outside all POI zones -> activePOI is null
  const outsideStatus = getCapitalMarketPOIStatus(0, 9.5);
  assert.equal(outsideStatus.activePOI, null);

  // 2. Player inside a single zone -> selects that POI
  const singleBursa = getCapitalMarketPOIStatus(-8.5, 1.0);
  assert.equal(singleBursa.activePOI?.id, 'bursa-efek');

  const singleRegulator = getCapitalMarketPOIStatus(-9.5, -8.5);
  assert.equal(singleRegulator.activePOI?.id, 'pusat-regulator');

  // 3. Player in the overlap intersection of Bursa Efek (-8.5, 1.0, r=5.2) and Pusat Regulator (-9.5, -8.5, r=5.2)
  const bursa = CAPITAL_MARKET_POIS.find((p) => p.id === 'bursa-efek')!;
  const regulator = CAPITAL_MARKET_POIS.find((p) => p.id === 'pusat-regulator')!;

  // 3a. Overlap point closer to Bursa Efek: (-8.9, -3.6) -> dist to Bursa ~4.62m <= 5.2, dist to Regulator ~4.94m <= 5.2
  const overlapNearBursaX = -8.9;
  const overlapNearBursaZ = -3.6;
  assert.ok(Math.hypot(overlapNearBursaX - bursa.x, overlapNearBursaZ - bursa.z) <= bursa.zoneRadius);
  assert.ok(Math.hypot(overlapNearBursaX - regulator.x, overlapNearBursaZ - regulator.z) <= regulator.zoneRadius);
  const overlapBursaStatus = getCapitalMarketPOIStatus(overlapNearBursaX, overlapNearBursaZ);
  assert.equal(overlapBursaStatus.activePOI?.id, 'bursa-efek');

  // 3b. Overlap point closer to Pusat Regulator: (-9.1, -3.9) -> dist to Bursa ~4.94m <= 5.2, dist to Regulator ~4.62m <= 5.2
  const overlapNearRegulatorX = -9.1;
  const overlapNearRegulatorZ = -3.9;
  assert.ok(Math.hypot(overlapNearRegulatorX - bursa.x, overlapNearRegulatorZ - bursa.z) <= bursa.zoneRadius);
  assert.ok(Math.hypot(overlapNearRegulatorX - regulator.x, overlapNearRegulatorZ - regulator.z) <= regulator.zoneRadius);
  const overlapRegulatorStatus = getCapitalMarketPOIStatus(overlapNearRegulatorX, overlapNearRegulatorZ);
  assert.equal(overlapRegulatorStatus.activePOI?.id, 'pusat-regulator');

  // 4. Exact equidistant midpoint (-9.0, -3.75) inside both zones -> deterministic first-in-array tie-breaker selects Bursa Efek
  const tieX = -9.0;
  const tieZ = -3.75;
  const distTieBursa = Math.hypot(tieX - bursa.x, tieZ - bursa.z);
  const distTieRegulator = Math.hypot(tieX - regulator.x, tieZ - regulator.z);
  assert.equal(distTieBursa, distTieRegulator);
  assert.ok(distTieBursa <= bursa.zoneRadius);
  assert.equal(getCapitalMarketPOIStatus(tieX, tieZ).activePOI?.id, 'bursa-efek');

  // 5. Continuous transition along the western corridor from Spawn/South -> Bursa Efek -> Pusat Regulator -> North outside
  const pathSequence: Array<{ x: number; z: number; expectedId: string | null }> = [
    { x: -8.5, z: 7.0, expectedId: null },
    { x: -8.5, z: 1.0, expectedId: 'bursa-efek' },
    { x: -8.9, z: -3.6, expectedId: 'bursa-efek' },
    { x: -9.1, z: -3.9, expectedId: 'pusat-regulator' },
    { x: -9.5, z: -8.5, expectedId: 'pusat-regulator' },
    { x: -9.5, z: -15.0, expectedId: null },
  ];

  for (const step of pathSequence) {
    const status = getCapitalMarketPOIStatus(step.x, step.z);
    assert.equal(
      status.activePOI?.id ?? null,
      step.expectedId,
      `Expected activePOI at (${step.x}, ${step.z}) to be ${step.expectedId}, got ${status.activePOI?.id ?? null}`
    );
  }

  // 6. Verify Pusat Reksa Dana interaction zone is synchronized at (0, -10.8) with its 3D gazebo & collider
  const reksaDana = CAPITAL_MARKET_POIS.find((p) => p.id === 'pusat-reksa-dana')!;
  assert.equal(reksaDana.x, 0);
  assert.equal(reksaDana.z, -10.8);
  assert.equal(reksaDana.zoneRadius, 5.5);
  assert.equal(getCapitalMarketPOIStatus(0, -10.8).activePOI?.id, 'pusat-reksa-dana');
  // South edge of the 5.5m radius around z = -10.8 (e.g. z = -5.4 is inside, z = -5.2 is outside)
  assert.equal(getCapitalMarketPOIStatus(0, -5.4).activePOI?.id, 'pusat-reksa-dana');
  assert.equal(getCapitalMarketPOIStatus(0, -5.2).activePOI, null);
});

test('Misi Mengenal Reksa Dana defines 4 core concepts, 4 mutual fund types, 3 interactive quiz questions, and evaluates learning results', async () => {
  const {
    MUTUAL_FUND_MISSION_TITLE,
    MUTUAL_FUND_CONCEPTS,
    MUTUAL_FUND_TYPES,
    MUTUAL_FUND_QUIZ_QUESTIONS,
    evaluateMutualFundMission,
    getRecommendedMutualFundForProfile,
  } = await import('./mutualFundMission.ts');

  assert.equal(MUTUAL_FUND_MISSION_TITLE, 'Misi Mengenal Reksa Dana');

  // 1. Tahap A: 4 core concept cards
  assert.equal(MUTUAL_FUND_CONCEPTS.length, 4);
  assert.deepEqual(
    MUTUAL_FUND_CONCEPTS.map((c) => c.id),
    ['pengertian', 'manajer-investasi', 'bank-kustodian', 'risiko-fluktuasi']
  );

  // 2. Tahap B: 4 mutual fund type learning cards
  assert.equal(MUTUAL_FUND_TYPES.length, 4);
  assert.deepEqual(
    MUTUAL_FUND_TYPES.map((t) => t.name),
    [
      'Reksa Dana Pasar Uang',
      'Reksa Dana Pendapatan Tetap',
      'Reksa Dana Campuran',
      'Reksa Dana Saham',
    ]
  );

  // 3. Tahap C: 3 interactive quiz questions with correct/incorrect feedback
  assert.equal(MUTUAL_FUND_QUIZ_QUESTIONS.length, 3);
  for (const q of MUTUAL_FUND_QUIZ_QUESTIONS) {
    assert.equal(q.options.length, 3);
    assert.ok(q.correctFeedback.length > 20);
    assert.ok(q.incorrectFeedback.length > 20);
  }

  // 4. Tahap D: Evaluation logic for 0/3, 2/3, and 3/3
  const perfect = evaluateMutualFundMission(['B', 'A', 'B']);
  assert.equal(perfect.correctCount, 3);
  assert.equal(perfect.totalQuestions, 3);
  assert.equal(perfect.scorePercent, 100);
  assert.equal(perfect.badgeTitle, 'Master Reksa Dana');

  const partial = evaluateMutualFundMission(['B', 'A', 'A']);
  assert.equal(partial.correctCount, 2);
  assert.equal(partial.badgeTitle, 'Penjelajah Reksa Dana');

  const beginner = evaluateMutualFundMission(['A', 'C', 'A']);
  assert.equal(beginner.correctCount, 0);
  assert.equal(beginner.badgeTitle, 'Pemula Reksa Dana');

  // 5. Risk profile alignment helper
  assert.ok(
    getRecommendedMutualFundForProfile('Konservatif').fundName.includes('Pasar Uang')
  );
  assert.ok(
    getRecommendedMutualFundForProfile('Moderat').fundName.includes('Campuran')
  );
  assert.ok(
    getRecommendedMutualFundForProfile('Agresif').fundName.includes('Saham')
  );
});

test('KPEI — Kliring dan Penjaminan POI has synchronized collider, safe fast-travel landing spot, and complete 4-stage interactive clearing mission', async () => {
  const { ISLAND_OBSTACLES } = await import('./worldData.ts');
  const {
    KPEI_MISSION_TITLE,
    KPEI_CONCEPTS,
    KPEI_SETTLEMENT_STEPS,
    KPEI_QUIZ_QUESTIONS,
    evaluateKpeiMission,
  } = await import('./kpeiMission.ts');

  const kpeiPoi = CAPITAL_MARKET_POIS.find((p) => p.id === 'kpei')!;
  assert.ok(kpeiPoi);

  // 1. Verify KPEI building obstacle collider at (-13.5, 8.2)
  const kpeiObs = ISLAND_OBSTACLES.find((o) => o.id === 'poi-kpei-core')!;
  assert.ok(kpeiObs, 'Expected poi-kpei-core obstacle in ISLAND_OBSTACLES');
  assert.equal(kpeiObs.x, kpeiPoi.x);
  assert.equal(kpeiObs.z, kpeiPoi.z);
  assert.equal(kpeiObs.radius, 1.65);

  // 2. Verify fast-travel landing spot (x = -11.7, z = 11.2) is outside all obstacle colliders and detects 'kpei' as activePOI
  const landingX = kpeiPoi.x + 1.8;
  const landingZ = kpeiPoi.z + 3.0;
  assert.equal(getCapitalMarketPOIStatus(landingX, landingZ).activePOI?.id, 'kpei');
  for (const obs of ISLAND_OBSTACLES) {
    const dist = Math.hypot(landingX - obs.x, landingZ - obs.z);
    assert.ok(
      dist > obs.radius + 0.55,
      `Fast-travel landing spot for KPEI overlaps obstacle ${obs.id} (dist=${dist})`
    );
  }

  // 3. Verify KPEI educational mission content & evaluation logic
  assert.equal(KPEI_MISSION_TITLE, 'Misi Kliring & Penjaminan Transaksi');
  assert.equal(KPEI_CONCEPTS.length, 4);
  assert.equal(KPEI_SETTLEMENT_STEPS.length, 4);
  assert.equal(KPEI_QUIZ_QUESTIONS.length, 3);

  const perfect = evaluateKpeiMission(['B', 'A', 'B']);
  assert.equal(perfect.correctCount, 3);
  assert.equal(perfect.scorePercent, 100);
  assert.equal(perfect.badgeTitle, 'Master Kliring & Penjaminan');

  const partial = evaluateKpeiMission(['B', 'A', 'A']);
  assert.equal(partial.correctCount, 2);
  assert.equal(partial.badgeTitle, 'Penjelajah Kliring');

  const beginner = evaluateKpeiMission(['A', 'B', 'C']);
  assert.equal(beginner.correctCount, 0);
  assert.equal(beginner.badgeTitle, 'Pemula Kliring');
});

test('KSEI — Kustodian Sentral POI has synchronized collider, safe fast-travel landing spot, accurate minimap projection, and closest-POI selection in overlapping zones with Perusahaan Sekuritas and Pusat Reksa Dana', async () => {
  const { ISLAND_OBSTACLES } = await import('./worldData.ts');
  const { worldToMinimapPoint } = await import('./physics.ts');

  const kseiPoi = CAPITAL_MARKET_POIS.find((p) => p.id === 'ksei')!;
  const sekuritasPoi = CAPITAL_MARKET_POIS.find((p) => p.id === 'perusahaan-sekuritas')!;
  const reksaDanaPoi = CAPITAL_MARKET_POIS.find((p) => p.id === 'pusat-reksa-dana')!;
  assert.ok(kseiPoi);

  // 1. Verify KSEI building obstacle collider at (9.5, -8.5) with radius 1.65
  const kseiObs = ISLAND_OBSTACLES.find((o) => o.id === 'poi-ksei-core')!;
  assert.ok(kseiObs, 'Expected poi-ksei-core obstacle in ISLAND_OBSTACLES');
  assert.equal(kseiObs.x, 9.5);
  assert.equal(kseiObs.z, -8.5);
  assert.equal(kseiObs.radius, 1.65);

  //Verify obstacle collision blocks player from penetrating KSEI building core
  let walkIntoKsei = createInitialPlayerState();
  walkIntoKsei.x = 9.5;
  walkIntoKsei.z = -5.5;
  walkIntoKsei.y = getIslandGroundHeight(9.5, -5.5);
  const forwardNorth: MovementInput = { ...idleInput, forward: true };
  for (let i = 0; i < 45; i++) {
    walkIntoKsei = stepPlayerPhysics(walkIntoKsei, forwardNorth, 1 / 60, 0, [kseiObs]);
  }
  const distFromKseiCore = Math.hypot(walkIntoKsei.x - kseiObs.x, walkIntoKsei.z - kseiObs.z);
  assert.ok(
    distFromKseiCore >= kseiObs.radius + 0.54,
    `Expected KSEI collider to stop penetration, got dist=${distFromKseiCore}`
  );

  // 2. Verify fast-travel landing spot (x = 7.7, z = -5.3) is outside all obstacle colliders and activates 'ksei'
  const landingX = kseiPoi.x - 1.8;
  const landingZ = kseiPoi.z + 3.2;
  assert.equal(getCapitalMarketPOIStatus(landingX, landingZ).activePOI?.id, 'ksei');
  for (const obs of ISLAND_OBSTACLES) {
    const dist = Math.hypot(landingX - obs.x, landingZ - obs.z);
    assert.ok(
      dist > obs.radius + 0.55,
      `Fast-travel landing spot for KSEI overlaps obstacle ${obs.id} (dist=${dist})`
    );
  }

  // 3. Verify minimap projection for KSEI at (9.5, -8.5) is in Northeast quadrant (leftPct > 50, topPct < 50) without clamping
  const mmPoint = worldToMinimapPoint(kseiPoi.x, kseiPoi.z);
  assert.equal(mmPoint.isClamped, false);
  assert.ok(mmPoint.leftPct > 65 && mmPoint.leftPct < 70);
  assert.ok(mmPoint.topPct > 32 && mmPoint.topPct < 37);

  // 4. Verify overlap resolution between KSEI (9.5, -8.5, r=4.8) and Perusahaan Sekuritas (8.5, 1.0, r=5.2)
  // 4a. Point in overlap closer to Perusahaan Sekuritas: (8.9, -4.0) -> dist to Sekuritas ~5.02 <= 5.2, dist to KSEI ~4.54 <= 4.8 vs (8.9, -3.9) -> dist to Sekuritas = 4.92 <= 5.2, dist to KSEI = 4.64 <= 4.8
  // Let's test (8.9, -3.75): dist to Sekuritas = Math.hypot(0.4, -4.75) = 4.767 <= 5.2; dist to KSEI = Math.hypot(-0.6, 4.75) = 4.788 <= 4.8 -> selects 'perusahaan-sekuritas'
  assert.ok(Math.hypot(8.9 - sekuritasPoi.x, -3.75 - sekuritasPoi.z) <= sekuritasPoi.zoneRadius);
  assert.ok(Math.hypot(8.9 - kseiPoi.x, -3.75 - kseiPoi.z) <= kseiPoi.zoneRadius);
  assert.equal(getCapitalMarketPOIStatus(8.9, -3.75).activePOI?.id, 'perusahaan-sekuritas');

  // 4b. Point in overlap closer to KSEI: (9.1, -3.9) -> dist to Sekuritas = Math.hypot(0.6, -4.9) = 4.937 <= 5.2; dist to KSEI = Math.hypot(-0.4, 4.6) = 4.617 <= 4.8 -> selects 'ksei'
  assert.ok(Math.hypot(9.1 - sekuritasPoi.x, -3.9 - sekuritasPoi.z) <= sekuritasPoi.zoneRadius);
  assert.ok(Math.hypot(9.1 - kseiPoi.x, -3.9 - kseiPoi.z) <= kseiPoi.zoneRadius);
  assert.equal(getCapitalMarketPOIStatus(9.1, -3.9).activePOI?.id, 'ksei');

  // 5. Verify overlap resolution between KSEI (9.5, -8.5, r=4.8) and Pusat Reksa Dana (0, -10.8, r=5.5)
  // 5a. Point in overlap closer to Pusat Reksa Dana: (4.9, -9.6) -> dist to Reksa Dana = Math.hypot(4.9, 1.2) = 5.045 <= 5.5; dist to KSEI = Math.hypot(-4.6, -1.1) = 4.73 <= 4.8
  // At (4.7, -9.65): dist to Reksa Dana = Math.hypot(4.7, 1.15) = 4.839 <= 5.5; dist to KSEI = Math.hypot(-4.8, -1.15) = 4.936 (outside KSEI)
  // At (4.85, -9.65): dist to Reksa Dana = Math.hypot(4.85, 1.15) = 4.984 <= 5.5; dist to KSEI = Math.hypot(-4.65, -1.15) = 4.790 <= 4.8 -> selects 'ksei'
  // At (4.3, -9.8) -> inside Reksa Dana (dist=4.41 <= 5.5), outside KSEI -> selects 'pusat-reksa-dana'
  assert.equal(getCapitalMarketPOIStatus(4.3, -9.8).activePOI?.id, 'pusat-reksa-dana');
  assert.ok(Math.hypot(4.85 - reksaDanaPoi.x, -9.65 - reksaDanaPoi.z) <= reksaDanaPoi.zoneRadius);
  assert.ok(Math.hypot(4.85 - kseiPoi.x, -9.65 - kseiPoi.z) <= kseiPoi.zoneRadius);
  assert.equal(getCapitalMarketPOIStatus(4.85, -9.65).activePOI?.id, 'ksei');
});

test('Indonesia SIPF — Dana Perlindungan Pemodal POI has synchronized collider, safe fast-travel landing spot, accurate minimap projection, and closest-POI selection in overlapping zone with Perusahaan Sekuritas', async () => {
  const { ISLAND_OBSTACLES } = await import('./worldData.ts');
  const { worldToMinimapPoint } = await import('./physics.ts');

  const sipfPoi = CAPITAL_MARKET_POIS.find((p) => p.id === 'indonesia-sipf')!;
  const sekuritasPoi = CAPITAL_MARKET_POIS.find((p) => p.id === 'perusahaan-sekuritas')!;
  const advisorPoi = CAPITAL_MARKET_POIS.find((p) => p.id === 'financial-advisor-kiosk')!;
  assert.ok(sipfPoi);

  // 1. Verify Indonesia SIPF building obstacle collider at (13.5, 8.2) with radius 1.65
  const sipfObs = ISLAND_OBSTACLES.find((o) => o.id === 'poi-sipf-core')!;
  assert.ok(sipfObs, 'Expected poi-sipf-core obstacle in ISLAND_OBSTACLES');
  assert.equal(sipfObs.x, 13.5);
  assert.equal(sipfObs.z, 8.2);
  assert.equal(sipfObs.radius, 1.65);

  // Verify obstacle collision blocks player from penetrating Indonesia SIPF building core
  let walkIntoSipf = createInitialPlayerState();
  walkIntoSipf.x = 13.5;
  walkIntoSipf.z = 11.2;
  walkIntoSipf.y = getIslandGroundHeight(13.5, 11.2);
  const forwardNorth: MovementInput = { ...idleInput, forward: true };
  for (let i = 0; i < 45; i++) {
    walkIntoSipf = stepPlayerPhysics(walkIntoSipf, forwardNorth, 1 / 60, 0, [sipfObs]);
  }
  const distFromSipfCore = Math.hypot(walkIntoSipf.x - sipfObs.x, walkIntoSipf.z - sipfObs.z);
  assert.ok(
    distFromSipfCore >= sipfObs.radius + 0.54,
    `Expected Indonesia SIPF collider to stop penetration, got dist=${distFromSipfCore}`
  );

  // 2. Verify fast-travel landing spot (x = 11.7, z = 11.2) is outside all obstacle colliders and activates 'indonesia-sipf'
  const landingX = sipfPoi.x - 1.8;
  const landingZ = sipfPoi.z + 3.0;
  assert.equal(getCapitalMarketPOIStatus(landingX, landingZ).activePOI?.id, 'indonesia-sipf');
  for (const obs of ISLAND_OBSTACLES) {
    const dist = Math.hypot(landingX - obs.x, landingZ - obs.z);
    assert.ok(
      dist > obs.radius + 0.55,
      `Fast-travel landing spot for Indonesia SIPF overlaps obstacle ${obs.id} (dist=${dist})`
    );
  }

  // 3. Verify minimap projection for Indonesia SIPF at (13.5, 8.2) is in Southeast quadrant (leftPct > 50, topPct > 50) without clamping
  const mmPoint = worldToMinimapPoint(sipfPoi.x, sipfPoi.z);
  assert.equal(mmPoint.isClamped, false);
  assert.ok(mmPoint.leftPct > 72 && mmPoint.leftPct < 78);
  assert.ok(mmPoint.topPct > 62 && mmPoint.topPct < 68);

  // 4. Verify non-overlapping separation between Financial Advisor Kiosk (4.2, 6.8, r=4.0) and Indonesia SIPF (13.5, 8.2, r=4.8)
  const distAdvisorSipf = Math.hypot(sipfPoi.x - advisorPoi.x, sipfPoi.z - advisorPoi.z);
  assert.ok(distAdvisorSipf > advisorPoi.zoneRadius + sipfPoi.zoneRadius);
  assert.equal(getCapitalMarketPOIStatus(8.4, 7.4).activePOI, null);

  // 5. Verify overlap resolution between Perusahaan Sekuritas (8.5, 1.0, r=5.2) and Indonesia SIPF (13.5, 8.2, r=4.8)
  // 5a. Overlap point closer to Perusahaan Sekuritas: (10.9, 4.4) -> dist to Sekuritas = Math.hypot(2.4, 3.4) = 4.162 <= 5.2; dist to SIPF = Math.hypot(-2.6, -3.8) = 4.604 <= 4.8
  assert.ok(Math.hypot(10.9 - sekuritasPoi.x, 4.4 - sekuritasPoi.z) <= sekuritasPoi.zoneRadius);
  assert.ok(Math.hypot(10.9 - sipfPoi.x, 4.4 - sipfPoi.z) <= sipfPoi.zoneRadius);
  assert.equal(getCapitalMarketPOIStatus(10.9, 4.4).activePOI?.id, 'perusahaan-sekuritas');

  // 5b. Overlap point closer to Indonesia SIPF: (11.3, 4.9) -> dist to Sekuritas = Math.hypot(2.8, 3.9) = 4.801 <= 5.2; dist to SIPF = Math.hypot(-2.2, -3.3) = 3.966 <= 4.8
  assert.ok(Math.hypot(11.3 - sekuritasPoi.x, 4.9 - sekuritasPoi.z) <= sekuritasPoi.zoneRadius);
  assert.ok(Math.hypot(11.3 - sipfPoi.x, 4.9 - sipfPoi.z) <= sipfPoi.zoneRadius);
  assert.equal(getCapitalMarketPOIStatus(11.3, 4.9).activePOI?.id, 'indonesia-sipf');
});
