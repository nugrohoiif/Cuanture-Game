export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface MovementInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  jumpJustPressed: boolean;
  sprint: boolean;
  analogX?: number;
  analogY?: number;
}

export interface CircleObstacle {
  id: string;
  x: number;
  z: number;
  radius: number;
}

export interface AetherShard {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  collected: boolean;
}

export interface JumpPad {
  id: string;
  x: number;
  z: number;
  radius: number;
  boostVelocity: number;
}

export interface CapitalMarketPOI {
  id:
    | 'bursa-efek'
    | 'perusahaan-sekuritas'
    | 'pusat-reksa-dana'
    | 'financial-advisor-kiosk'
    | 'pusat-regulator'
    | 'kpei'
    | 'ksei'
    | 'indonesia-sipf';
  name: string;
  shortLabel: string;
  englishName: string;
  x: number;
  z: number;
  zoneRadius: number;
  themeColor: string;
  summary: string;
  educationalText: string;
}

export const CAPITAL_MARKET_POIS: CapitalMarketPOI[] = [
  {
    id: 'financial-advisor-kiosk',
    name: 'Financial Advisor Kiosk',
    shortLabel: 'Advisor Kiosk',
    englishName: 'Risk Profile Booth',
    x: 4.2,
    z: 6.8,
    zoneRadius: 4.0,
    themeColor: '#f59e0b',
    summary: 'Interactive consultation booth near the Arrival Plaza where investors assess their personal risk tolerance.',
    educationalText:
      'Kenali profil risiko investasimu (Konservatif, Moderat, atau Agresif) sebelum memilih instrumen pasar modal.',
  },
  {
    id: 'bursa-efek',
    name: 'Bursa Efek',
    shortLabel: 'Bursa Efek',
    englishName: 'Stock Exchange',
    x: -8.5,
    z: 1.0,
    zoneRadius: 5.2,
    themeColor: '#3b82f6',
    summary: 'Central marketplace where public company shares are listed and traded with live green & red price charts.',
    educationalText:
      'Saham adalah bukti kepemilikan suatu perusahaan. Di sini tempat saham diperjualbelikan.',
  },
  {
    id: 'perusahaan-sekuritas',
    name: 'Perusahaan Sekuritas',
    shortLabel: 'Sekuritas',
    englishName: 'Broker',
    x: 8.5,
    z: 1.0,
    zoneRadius: 5.2,
    themeColor: '#38bdf8',
    summary: 'Licensed brokerage intermediary connecting retail and institutional investors to the Stock Exchange.',
    educationalText:
      'Perusahaan sekuritas adalah perantara kamu untuk membeli saham di pasar modal.',
  },
  {
    id: 'pusat-reksa-dana',
    name: 'Pusat Reksa Dana',
    shortLabel: 'Reksa Dana',
    englishName: 'Mutual Fund Center',
    x: 0,
    z: -10.8,
    zoneRadius: 5.5,
    themeColor: '#22c55e',
    summary: 'Peaceful diversified investment sanctuary managed by professional fund managers for steady long-term growth.',
    educationalText:
      'Reksa dana adalah wadah yang menghimpun dana investor untuk diinvestasikan oleh Manajer Investasi.',
  },
  {
    id: 'pusat-regulator',
    name: 'Pusat Regulator',
    shortLabel: 'OJK & SRO',
    englishName: 'Regulator Center',
    x: -9.5,
    z: -8.5,
    zoneRadius: 5.2,
    themeColor: '#ef4444',
    summary: 'Authoritative Capital Market Citadel housing OJK (Otoritas Jasa Keuangan) and the 3 SROs (BEI, KPEI, KSEI).',
    educationalText:
      'Mengatur dan mengawasi seluruh kegiatan di sektor jasa keuangan.',
  },
  {
    id: 'kpei',
    name: 'KPEI — Kliring dan Penjaminan',
    shortLabel: 'KPEI',
    englishName: 'Clearing & Guarantee',
    x: -13.5,
    z: 8.2,
    zoneRadius: 4.8,
    themeColor: '#14b8a6',
    summary: 'Indonesian Clearing and Guarantee Corporation (PT Kliring Penjaminan Efek Indonesia) ensuring safe, accurate, and timely transaction settlement.',
    educationalText:
      'KPEI adalah lembaga kliring dan penjaminan yang memastikan transaksi bursa diselesaikan dengan tepat, aman, dan terjamin antara pihak pembeli dan penjual.',
  },
  {
    id: 'ksei',
    name: 'KSEI — Kustodian Sentral',
    shortLabel: 'KSEI',
    englishName: 'Central Securities Depository',
    x: 9.5,
    z: -8.5,
    zoneRadius: 4.8,
    themeColor: '#8b5cf6',
    summary:
      'PT Kustodian Sentral Efek Indonesia (KSEI) menjalankan fungsi kustodian sentral dan administrasi penyimpanan efek elektronik dalam infrastruktur pasar modal Indonesia.',
    educationalText:
      'PT Kustodian Sentral Efek Indonesia (KSEI) merupakan lembaga kustodian sentral yang mencatat dan menyimpan efek secara elektronik, berperan dalam penyelesaian transaksi efek, mengelola identitas tunggal investor (SID), serta menyediakan fasilitas AKSes KSEI untuk memantau kepemilikan efek.',
  },
  {
    id: 'indonesia-sipf',
    name: 'Indonesia SIPF — Dana Perlindungan Pemodal',
    shortLabel: 'SIPF',
    englishName: 'Investor Protection Fund',
    x: 13.5,
    z: 8.2,
    zoneRadius: 4.8,
    themeColor: '#eab308',
    summary:
      'PT Penyelenggara Program Perlindungan Investor Efek Indonesia (Indonesia SIPF) mengelola Dana Perlindungan Pemodal untuk melindungi aset investor yang dititipkan pada kustodian sesuai ketentuan yang berlaku.',
    educationalText:
      'Indonesia SIPF menyelenggarakan program Dana Perlindungan Pemodal (DPP) untuk memberikan perlindungan atas aset pemodal yang dititipkan pada kustodian sesuai ketentuan yang berlaku, namun tidak menjamin keuntungan investasi maupun mengganti kerugian akibat fluktuasi harga pasar.',
  },
];

export interface StockChartMonumentBar {
  id: string;
  x: number;
  height: number;
  wickHeight: number;
  color: string;
  emissive: string;
}

/**
 * 5-step ascending bullish stock chart bars for the Central Landmark Monument at (0, -2).
 * Shows an unmistakable upward market trend (higher highs and higher lows from West to East).
 */
export const CENTRAL_CHART_BARS: StockChartMonumentBar[] = [
  { id: 'chart-bar-1', x: -1.6, height: 1.05, wickHeight: 1.45, color: '#10b981', emissive: '#059669' },
  { id: 'chart-bar-2', x: -0.8, height: 1.55, wickHeight: 1.95, color: '#10b981', emissive: '#059669' },
  { id: 'chart-bar-3', x: 0.0, height: 1.35, wickHeight: 1.80, color: '#38bdf8', emissive: '#0284c7' },
  { id: 'chart-bar-4', x: 0.8, height: 2.20, wickHeight: 2.65, color: '#22c55e', emissive: '#16a34a' },
  { id: 'chart-bar-5', x: 1.6, height: 2.95, wickHeight: 3.45, color: '#34d399', emissive: '#10b981' },
];


export interface PlayerPhysicsState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  isGrounded: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  stamina: number;
  maxStamina: number;
  gaitPhase: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  peakSpeed: number;
  respawnCount: number;
  justJumped: boolean;
  justLanded: boolean;
  justBoosted: boolean;
  justRespawned: boolean;
}

export const ISLAND_RADIUS = 27.0;
export const PLAYER_RADIUS = 0.55;
export const GRAVITY = -26.0;
export const MOVE_SPEED = 7.8;
export const SPRINT_MULTIPLIER = 1.48;
export const JUMP_VELOCITY = 10.6;
export const SPAWN_POINT: Vec3 = { x: 0, y: 0.5, z: 9.5 };

export function clampDt(rawDt: number): number {
  if (!Number.isFinite(rawDt) || rawDt <= 0) return 1 / 60;
  return Math.min(rawDt, 0.05);
}

export function dampValue(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export function normalizeAngle(angle: number): number {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  const diff = normalizeAngle(target - current);
  return normalizeAngle(current + diff * (1 - Math.exp(-lambda * dt)));
}

/**
 * Computes whether a world (x, z) point lies over the main floating island or northern sky-bridge islet.
 */
export function isInsideIsland(x: number, z: number): boolean {
  const distMain = Math.hypot(x, z);
  if (distMain <= ISLAND_RADIUS) return true;

  // Northern stone sky-bridge (x in [-2.6, 2.6], z in [-34, -26])
  if (Math.abs(x) <= 2.6 && z >= -34 && z <= -26) return true;

  // Northern Shrine Islet centered at (0, -39), radius 7.5
  const distNorth = Math.hypot(x, z + 39);
  if (distNorth <= 7.5) return true;

  return false;
}

/**
 * Returns the exact terrain elevation Y at world coordinates (x, z),
 * or -100 if the coordinates are over the open sky abyss.
 */
export function getIslandGroundHeight(x: number, z: number): number {
  if (!isInsideIsland(x, z)) {
    return -100;
  }

  // Northern Shrine Islet (centered at z = -39)
  const distNorth = Math.hypot(x, z + 39);
  if (distNorth <= 7.5) {
    const shrineStep = distNorth < 3.2 ? 0.45 : 0;
    return 1.2 + shrineStep + Math.cos(distNorth * 0.4) * 0.15;
  }

  // Northern Sky Bridge connecting main island north rim (z = -26.6) to z = -34
  if (Math.abs(x) <= 2.6 && z < -26.6 && z >= -34) {
    const t = (-z - 26.6) / (34 - 26.6);
    const arch = Math.sin(t * Math.PI) * 0.55;
    return 0.22 + t * 0.95 + arch;
  }

  const r = Math.hypot(x, z);
  // 6-meter outer rim slope belt: flat effective radius is ISLAND_RADIUS - 6 (21.0m)
  const rimFactor = r > ISLAND_RADIUS - 6
    ? Math.max(0, 1 - (r - (ISLAND_RADIUS - 6)) / 6)
    : 1;

  const wave =
    (Math.sin(x * 0.2) * Math.cos(z * 0.2) * 0.16 + Math.cos(r * 0.25) * 0.08) *
    rimFactor;

  // Central Sunstone Altar plateau centered at (0, -2), radius 4.8
  const distCenter = Math.hypot(x, z + 2);
  let altarHeight = 0;
  if (distCenter < 4.8) {
    const plateauBlend = Math.max(0, Math.min(1, (4.8 - distCenter) / 2.0));
    altarHeight = plateauBlend * 0.72;
  }

  return Math.max(0, wave + altarHeight + 0.15);
}

/**
 * Finds the Capital Market POI that the player is currently inside (or nearest to).
 *
 * When multiple POI zones overlap, selects the POI with the smallest horizontal
 * Euclidean distance among POIs whose `zoneRadius` contains `(x, z)`.
 * Tie-breaker: if two active zones have the exact same distance, the first POI
 * in `CAPITAL_MARKET_POIS` order is retained (`dist < activeDistance`).
 */
export function getCapitalMarketPOIStatus(x: number, z: number): {
  activePOI: CapitalMarketPOI | null;
  nearestPOI: CapitalMarketPOI;
  nearestDistance: number;
} {
  let nearestPOI = CAPITAL_MARKET_POIS[0];
  let nearestDistance = Infinity;
  let activePOI: CapitalMarketPOI | null = null;
  let activeDistance = Infinity;

  for (const poi of CAPITAL_MARKET_POIS) {
    const dist = Math.hypot(x - poi.x, z - poi.z);
    if (dist < nearestDistance) {
      nearestDistance = dist;
      nearestPOI = poi;
    }
    if (dist <= poi.zoneRadius && dist < activeDistance) {
      activeDistance = dist;
      activePOI = poi;
    }
  }

  return {
    activePOI,
    nearestPOI,
    nearestDistance,
  };
}

/**
 * Computes camera-relative desired horizontal direction (unit vector in XZ plane).
 */
export function computeMovementDirection(
  input: MovementInput,
  cameraYaw: number
): { dx: number; dz: number; active: boolean; magnitude: number } {
  const kbForward = (input.forward ? 1 : 0) - (input.backward ? 1 : 0);
  const kbRight = (input.right ? 1 : 0) - (input.left ? 1 : 0);

  const rawForward = kbForward !== 0 ? kbForward : (input.analogY ?? 0);
  const rawRight = kbRight !== 0 ? kbRight : (input.analogX ?? 0);

  const len = Math.hypot(rawForward, rawRight);
  if (len < 0.08) {
    return { dx: 0, dz: 0, active: false, magnitude: 0 };
  }

  const normF = rawForward / len;
  const normR = rawRight / len;
  const magnitude = Math.min(1, len);

  const sinY = Math.sin(cameraYaw);
  const cosY = Math.cos(cameraYaw);

  const dx = -sinY * normF + cosY * normR;
  const dz = -cosY * normF - sinY * normR;

  return { dx, dz, active: true, magnitude };
}

export function createInitialPlayerState(): PlayerPhysicsState {
  const groundY = getIslandGroundHeight(SPAWN_POINT.x, SPAWN_POINT.z);
  return {
    x: SPAWN_POINT.x,
    y: groundY,
    z: SPAWN_POINT.z,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: Math.PI, // Facing north (-Z) toward the Capital Market POIs & Sunstone Monolith
    isGrounded: true,
    coyoteTimer: 0.1,
    jumpBufferTimer: 0,
    stamina: 100,
    maxStamina: 100,
    gaitPhase: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    peakSpeed: 0,
    respawnCount: 0,
    justJumped: false,
    justLanded: false,
    justBoosted: false,
    justRespawned: false,
  };
}

export function stepPlayerPhysics(
  prev: PlayerPhysicsState,
  input: MovementInput,
  rawDt: number,
  cameraYaw: number,
  obstacles: CircleObstacle[],
  jumpPads: JumpPad[] = []
): PlayerPhysicsState {
  const dt = clampDt(rawDt);
  const next: PlayerPhysicsState = {
    ...prev,
    justJumped: false,
    justLanded: false,
    justBoosted: false,
    justRespawned: false,
  };

  // 1. Update timers
  if (next.isGrounded) {
    next.coyoteTimer = 0.10;
  } else {
    next.coyoteTimer = Math.max(0, next.coyoteTimer - dt);
  }

  if (input.jumpJustPressed) {
    next.jumpBufferTimer = 0.12;
  } else {
    next.jumpBufferTimer = Math.max(0, next.jumpBufferTimer - dt);
  }

  // 2. Movement direction & stamina
  const moveDir = computeMovementDirection(input, cameraYaw);
  const isSprinting = input.sprint && moveDir.active && next.stamina > 2;
  if (isSprinting) {
    next.stamina = Math.max(0, next.stamina - 28 * dt);
  } else {
    next.stamina = Math.min(next.maxStamina, next.stamina + 22 * dt);
  }

  const speedMultiplier = isSprinting ? SPRINT_MULTIPLIER : 1.0;
  const targetSpeed = moveDir.active ? MOVE_SPEED * speedMultiplier * moveDir.magnitude : 0;
  const targetVx = moveDir.dx * targetSpeed;
  const targetVz = moveDir.dz * targetSpeed;

  const accelLambda = next.isGrounded ? (moveDir.active ? 14 : 16) : 7;
  next.vx = dampValue(next.vx, targetVx, accelLambda, dt);
  next.vz = dampValue(next.vz, targetVz, accelLambda, dt);

  // Rotate character smoothly toward travel direction
  if (moveDir.active) {
    const desiredYaw = Math.atan2(moveDir.dx, moveDir.dz);
    next.yaw = dampAngle(next.yaw, desiredYaw, 15, dt);
  }

  // 3. Jump execution (Coyote time + Jump buffering + Variable jump cut)
  if (next.jumpBufferTimer > 0 && next.coyoteTimer > 0) {
    next.vy = JUMP_VELOCITY;
    next.isGrounded = false;
    next.coyoteTimer = 0;
    next.jumpBufferTimer = 0;
    next.justJumped = true;
    next.scaleX = 0.84;
    next.scaleY = 1.20;
    next.scaleZ = 0.84;
  } else if (!input.jumpHeld && next.vy > 2.5 && !next.justBoosted) {
    next.vy *= Math.pow(0.45, dt * 12);
  }

  // 4. Gravity & Vertical integration
  if (!next.isGrounded) {
    next.vy += GRAVITY * dt;
  }

  // 5. Horizontal movement & Obstacle collision resolution
  let candidateX = next.x + next.vx * dt;
  let candidateZ = next.z + next.vz * dt;

  for (const obs of obstacles) {
    const dx = candidateX - obs.x;
    const dz = candidateZ - obs.z;
    const minDist = PLAYER_RADIUS + obs.radius;
    const distSq = dx * dx + dz * dz;
    if (distSq < minDist * minDist && distSq > 1e-6) {
      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const nz = dz / dist;
      const overlap = minDist - dist;
      candidateX += nx * overlap;
      candidateZ += nz * overlap;
      const vn = next.vx * nx + next.vz * nz;
      if (vn < 0) {
        next.vx -= vn * nx;
        next.vz -= vn * nz;
      }
    }
  }

  next.x = candidateX;
  next.z = candidateZ;
  next.y += next.vy * dt;

  // 6. Ground height check & landing
  const groundY = getIslandGroundHeight(next.x, next.z);
  if (groundY > -50) {
    if (next.y <= groundY && next.vy <= 0.5) {
      const impactVy = next.vy;
      next.y = groundY;
      next.vy = 0;
      if (!next.isGrounded) {
        next.isGrounded = true;
        if (impactVy < -4.0) {
          next.justLanded = true;
          next.scaleX = 1.22;
          next.scaleY = 0.78;
          next.scaleZ = 1.22;
        }
      }
    } else if (next.isGrounded && next.y - groundY < 0.35 && next.vy <= 0) {
      next.y = groundY;
      next.vy = 0;
    } else if (next.y > groundY + 0.08) {
      next.isGrounded = false;
    }
  } else {
    next.isGrounded = false;
  }

  // 7. Wind Geyser Jump Pads check
  for (const pad of jumpPads) {
    const distPad = Math.hypot(next.x - pad.x, next.z - pad.z);
    if (
      distPad <= pad.radius &&
      Math.abs(next.y - getIslandGroundHeight(pad.x, pad.z)) < 1.2 &&
      next.vy <= pad.boostVelocity * 0.7
    ) {
      next.vy = pad.boostVelocity;
      next.isGrounded = false;
      next.coyoteTimer = 0;
      next.justBoosted = true;
      next.scaleX = 0.80;
      next.scaleY = 1.28;
      next.scaleZ = 0.80;
    }
  }

  // 8. Abyss safety respawn if player falls below -12
  if (next.y < -12) {
    const spawnGroundY = getIslandGroundHeight(SPAWN_POINT.x, SPAWN_POINT.z);
    next.x = SPAWN_POINT.x;
    next.y = spawnGroundY + 1.5;
    next.z = SPAWN_POINT.z;
    next.vx = 0;
    next.vy = 0;
    next.vz = 0;
    next.yaw = Math.PI;
    next.isGrounded = false;
    next.respawnCount += 1;
    next.justRespawned = true;
  }

  // 9. Gait cycle synced to horizontal distance traveled + squash-and-stretch recovery
  const horizSpeed = Math.hypot(next.vx, next.vz);
  if (horizSpeed > next.peakSpeed) {
    next.peakSpeed = horizSpeed;
  }
  if (next.isGrounded && horizSpeed > 0.15) {
    next.gaitPhase = (next.gaitPhase + horizSpeed * dt * 2.6) % (Math.PI * 2);
  }

  next.scaleX = dampValue(next.scaleX, 1, 14, dt);
  next.scaleY = dampValue(next.scaleY, 1, 14, dt);
  next.scaleZ = dampValue(next.scaleZ, 1, 14, dt);

  return next;
}

export function checkShardCollection(
  playerPos: Vec3,
  shards: AetherShard[],
  collectRadius = 1.65
): { updatedShards: AetherShard[]; newlyCollectedIds: string[] } {
  const newlyCollectedIds: string[] = [];
  const updatedShards = shards.map((shard) => {
    if (shard.collected) return shard;
    const dx = playerPos.x - shard.x;
    const dy = playerPos.y + 0.9 - shard.y;
    const dz = playerPos.z - shard.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist <= collectRadius) {
      newlyCollectedIds.push(shard.id);
      return { ...shard, collected: true };
    }
    return shard;
  });

  return { updatedShards, newlyCollectedIds };
}

export const MIN_CAMERA_DISTANCE = 5.0;
export const MAX_CAMERA_DISTANCE = 22.0;
export const MIN_CAMERA_PITCH = 0.18; // ~10 deg above horizontal (prevents ground clipping)
export const MAX_CAMERA_PITCH = 1.15; // ~66 deg elevation (prevents camera flip / gimbal lock)

/**
 * Computes the desired camera position and lookAt target for the smooth follow camera.
 * Supports free horizontal yaw, clamped vertical pitch, and clamped zoom distance while
 * maintaining full backward compatibility when cameraPitch/cameraDistance are omitted.
 */
export function computeFollowCameraTarget(
  ps: Pick<PlayerPhysicsState, 'x' | 'y' | 'z' | 'vx' | 'vz'>,
  cameraMode: 'follow' | 'orbit' = 'follow',
  cameraYaw = 0,
  cameraPitch?: number,
  cameraDistance?: number
): {
  cameraPosition: Vec3;
  lookAtTarget: Vec3;
} {
  let distanceBehind: number;
  let heightOffset: number;

  if (cameraPitch !== undefined || cameraDistance !== undefined) {
    const defaultPitch = cameraMode === 'orbit' ? 0.55 : 0.45;
    const defaultDist = cameraMode === 'orbit' ? 16.0 : 10.9;
    const clampedPitch = Math.max(
      MIN_CAMERA_PITCH,
      Math.min(MAX_CAMERA_PITCH, cameraPitch ?? defaultPitch)
    );
    const clampedDist = Math.max(
      MIN_CAMERA_DISTANCE,
      Math.min(MAX_CAMERA_DISTANCE, cameraDistance ?? defaultDist)
    );
    distanceBehind = clampedDist * Math.cos(clampedPitch);
    heightOffset = clampedDist * Math.sin(clampedPitch);
  } else {
    // Default preset offsets when called without custom pitch/distance
    distanceBehind = cameraMode === 'orbit' ? 13.8 : 9.8;
    heightOffset = cameraMode === 'orbit' ? 8.4 : 4.8;
  }

  const forwardLookBias = cameraMode === 'orbit' ? 2.4 : 1.8;

  const sinYaw = Math.sin(cameraYaw);
  const cosYaw = Math.cos(cameraYaw);

  const camX = ps.x + sinYaw * distanceBehind;
  const camZ = ps.z + cosYaw * distanceBehind;
  const groundAtCam = getIslandGroundHeight(camX, camZ);
  const minSafeY = Math.max(ps.y + 1.8, groundAtCam + 1.25);

  const cameraPosition: Vec3 = {
    x: camX,
    y: Math.max(minSafeY, ps.y + heightOffset),
    z: camZ,
  };

  // Look slightly ahead of the player's position and velocity Along the current camera viewing direction
  const lookAtTarget: Vec3 = {
    x: ps.x - sinYaw * forwardLookBias + ps.vx * 0.14,
    y: ps.y + 1.55,
    z: ps.z - cosYaw * forwardLookBias + ps.vz * 0.14,
  };

  return { cameraPosition, lookAtTarget };
}

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface GameSettings {
  cameraSensitivity: number;
  zoomSpeed: number;
  audioVolume: number;
  graphicsQuality: GraphicsQuality;
}

export const SETTINGS_STORAGE_KEY = 'aether_isle_settings';

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  cameraSensitivity: 1.0,
  zoomSpeed: 1.0,
  audioVolume: 0.8,
  graphicsQuality: 'high',
};

export function sanitizeGameSettings(
  raw?: Partial<GameSettings> | null
): GameSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_GAME_SETTINGS };
  }

  const sens =
    typeof raw.cameraSensitivity === 'number' && Number.isFinite(raw.cameraSensitivity)
      ? Math.max(0.25, Math.min(2.5, Math.round(raw.cameraSensitivity * 100) / 100))
      : DEFAULT_GAME_SETTINGS.cameraSensitivity;

  const zoom =
    typeof raw.zoomSpeed === 'number' && Number.isFinite(raw.zoomSpeed)
      ? Math.max(0.25, Math.min(2.5, Math.round(raw.zoomSpeed * 100) / 100))
      : DEFAULT_GAME_SETTINGS.zoomSpeed;

  const vol =
    typeof raw.audioVolume === 'number' && Number.isFinite(raw.audioVolume)
      ? Math.max(0, Math.min(1, Math.round(raw.audioVolume * 100) / 100))
      : DEFAULT_GAME_SETTINGS.audioVolume;

  const quality: GraphicsQuality =
    raw.graphicsQuality === 'low' ||
    raw.graphicsQuality === 'medium' ||
    raw.graphicsQuality === 'high'
      ? raw.graphicsQuality
      : DEFAULT_GAME_SETTINGS.graphicsQuality;

  return {
    cameraSensitivity: sens,
    zoomSpeed: zoom,
    audioVolume: vol,
    graphicsQuality: quality,
  };
}

export function serializeGameSettings(settings: GameSettings): string {
  return JSON.stringify(sanitizeGameSettings(settings));
}

export function loadInitialGameSettings(
  storage?: Pick<Storage, 'getItem'> | null
): GameSettings {
  if (!storage) {
    return { ...DEFAULT_GAME_SETTINGS };
  }
  try {
    const raw = storage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_GAME_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return sanitizeGameSettings(parsed);
  } catch {
    return { ...DEFAULT_GAME_SETTINGS };
  }
}

export const MINIMAP_WORLD_RADIUS = 23;

export interface MinimapPoint {
  leftPct: number;
  topPct: number;
  isClamped: boolean;
}

/**
 * Maps 3D world coordinates (x, z) onto 2D minimap percentage coordinates [0..100].
 * World -Z is North (topPct < 50), +Z is South (topPct > 50),
 * World -X is West (leftPct < 50), +X is East (leftPct > 50).
 */
export function worldToMinimapPoint(
  x: number,
  z: number,
  worldRadius: number = MINIMAP_WORLD_RADIUS
): MinimapPoint {
  const safeRadius = Math.max(1, worldRadius);
  const scale = 42; // 42% radius leaves an 8% margin inside the circular radar rim
  const rawLeft = 50 + (x / safeRadius) * scale;
  const rawTop = 50 + (z / safeRadius) * scale;

  const leftPct = Math.max(6, Math.min(94, Math.round(rawLeft * 100) / 100));
  const topPct = Math.max(6, Math.min(94, Math.round(rawTop * 100) / 100));
  const isClamped = leftPct !== Math.round(rawLeft * 100) / 100 || topPct !== Math.round(rawTop * 100) / 100;

  return { leftPct, topPct, isClamped };
}

/**
 * Converts player physics yaw (radians, where Math.PI = facing North/-Z and 0 = facing South/+Z)
 * into CSS clockwise degrees where 0 deg points North (up on the 2D minimap).
 */
export function yawToMinimapDegrees(yaw: number): number {
  if (!Number.isFinite(yaw)) return 0;
  const dx = Math.sin(yaw);
  const dz = Math.cos(yaw);
  const deg = Math.atan2(dx, -dz) * (180 / Math.PI);
  return Math.round(deg * 10) / 10;
}

/**
 * Returns the active mission target POI for the 2D minimap based on First Mission state.
 */
export function getActiveMissionTargetPOI(
  isFirstMissionComplete: boolean
): CapitalMarketPOI | null {
  if (!isFirstMissionComplete) {
    return (
      CAPITAL_MARKET_POIS.find((poi) => poi.id === 'financial-advisor-kiosk') ?? null
    );
  }
  return null;
}



