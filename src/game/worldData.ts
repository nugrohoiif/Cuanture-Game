import {
  getIslandGroundHeight,
  CENTRAL_CHART_BARS,
  type StockChartMonumentBar,
  type AetherShard,
  type CircleObstacle,
  type JumpPad,
} from './physics.ts';

export { CENTRAL_CHART_BARS, type StockChartMonumentBar };

export interface TreePlacement {
  id: string;
  x: number;
  y: number;
  z: number;
  scale: number;
  variant: 'pine' | 'cypress' | 'blossom';
  tint: string;
}

export interface RockPlacement {
  id: string;
  x: number;
  y: number;
  z: number;
  scale: number;
  rotationY: number;
  hasCrystal: boolean;
}

export interface SatelliteIslet {
  id: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  depth: number;
  bobSpeed: number;
  bobOffset: number;
  hasTree: boolean;
}

const RAW_TREES: Array<{ x: number; z: number; scale: number; variant: 'pine' | 'cypress' | 'blossom'; tint: string }> = [
  { x: -17.8, z: 9.5, scale: 1.15, variant: 'pine', tint: '#2d6a4f' },
  { x: -15.2, z: 15.6, scale: 0.92, variant: 'cypress', tint: '#40916c' },
  { x: 15.2, z: 15.6, scale: 1.08, variant: 'pine', tint: '#1b4332' },
  { x: 18.0, z: 8.8, scale: 1.22, variant: 'blossom', tint: '#52b788' },
  { x: -20.1, z: -3.0, scale: 1.30, variant: 'pine', tint: '#2d6a4f' },
  { x: -18.1, z: -11.6, scale: 1.05, variant: 'blossom', tint: '#40916c' },
  { x: -12.0, z: -18.9, scale: 1.18, variant: 'cypress', tint: '#2d6a4f' },
  { x: 19.5, z: -3.9, scale: 1.25, variant: 'pine', tint: '#1b4332' },
  { x: 18.5, z: -11.5, scale: 0.95, variant: 'cypress', tint: '#40916c' },
  { x: 12.7, z: -18.9, scale: 1.12, variant: 'blossom', tint: '#52b788' },
  { x: 7.6, z: -22.6, scale: 0.98, variant: 'pine', tint: '#2d6a4f' },
  { x: -7.8, z: -22.6, scale: 1.04, variant: 'pine', tint: '#1b4332' },
  { x: -5.9, z: 19.3, scale: 0.90, variant: 'cypress', tint: '#40916c' },
  { x: 6.7, z: 18.5, scale: 1.05, variant: 'pine', tint: '#2d6a4f' },
  // Northern Shrine Islet trees
  { x: -4.2, z: -41.5, scale: 0.95, variant: 'blossom', tint: '#52b788' },
  { x: 4.2, z: -41.5, scale: 0.95, variant: 'blossom', tint: '#52b788' },
];

export const ISLAND_TREES: TreePlacement[] = RAW_TREES.map((t, idx) => ({
  id: `tree-${idx}`,
  x: t.x,
  y: getIslandGroundHeight(t.x, t.z),
  z: t.z,
  scale: t.scale,
  variant: t.variant,
  tint: t.tint,
}));

const RAW_ROCKS: Array<{ x: number; z: number; scale: number; rotationY: number; hasCrystal: boolean }> = [
  { x: -22.2, z: 6.7, scale: 1.35, rotationY: 2.1, hasCrystal: true },
  { x: 22.0, z: 8.3, scale: 1.25, rotationY: 0.9, hasCrystal: false },
  { x: -21.4, z: -13.4, scale: 1.40, rotationY: 1.2, hasCrystal: true },
  { x: 21.7, z: -12.8, scale: 1.30, rotationY: 2.8, hasCrystal: true },
  { x: -12.8, z: 20.1, scale: 1.15, rotationY: 0.5, hasCrystal: false },
  { x: 13.7, z: 18.9, scale: 1.20, rotationY: 1.9, hasCrystal: true },
  { x: -4.6, z: -24.6, scale: 0.95, rotationY: 0.3, hasCrystal: false },
  { x: 4.6, z: -24.6, scale: 0.95, rotationY: 2.4, hasCrystal: false },
];

export const ISLAND_ROCKS: RockPlacement[] = RAW_ROCKS.map((r, idx) => ({
  id: `rock-${idx}`,
  x: r.x,
  y: getIslandGroundHeight(r.x, r.z),
  z: r.z,
  scale: r.scale,
  rotationY: r.rotationY,
  hasCrystal: r.hasCrystal,
}));

export const ISLAND_OBSTACLES: CircleObstacle[] = [
  // Central Bullish Stock Chart Monument pedestal & bars at (0, -2)
  { id: 'monolith-left', x: -1.65, z: -2.0, radius: 0.78 },
  { id: 'monolith-right', x: 1.65, z: -2.0, radius: 0.82 },
  { id: 'monolith-core', x: 0, z: -2.0, radius: 0.92 },
  // Capital Market POI 1: Bursa Efek (Stock Exchange) solid building core
  { id: 'poi-bursa-efek-core', x: -9.1, z: 0.6, radius: 1.75 },
  // Capital Market POI 2: Perusahaan Sekuritas (Broker) glass building core
  { id: 'poi-broker-core', x: 9.1, z: 0.6, radius: 1.65 },
  // Capital Market POI 3: Pusat Reksa Dana (Mutual Fund Center) central gazebo pedestal
  { id: 'poi-mutual-fund-pedestal', x: 0, z: -10.8, radius: 0.75 },
  // Capital Market POI 4: Financial Advisor Kiosk booth desk near spawn
  { id: 'poi-advisor-kiosk', x: 4.2, z: 6.8, radius: 1.05 },
  // Capital Market POI 5: Pusat Regulator (OJK & SRO) grand building core
  { id: 'poi-regulator-core', x: -9.5, z: -8.5, radius: 1.85 },
  // Capital Market POI 6: KPEI (Clearing & Guarantee) building core
  { id: 'poi-kpei-core', x: -13.5, z: 8.2, radius: 1.65 },
  // Capital Market POI 7: KSEI (Central Securities Depository) building core
  { id: 'poi-ksei-core', x: 9.5, z: -8.5, radius: 1.65 },
  // Capital Market POI 8: Indonesia SIPF (Investor Protection Fund) building core
  { id: 'poi-sipf-core', x: 13.5, z: 8.2, radius: 1.65 },
  // Northern Shrine Torii Pillars
  { id: 'shrine-left', x: -2.2, z: -39.0, radius: 0.65 },
  { id: 'shrine-right', x: 2.2, z: -39.0, radius: 0.65 },
  // Tree trunks
  ...ISLAND_TREES.map((t) => ({
    id: t.id,
    x: t.x,
    z: t.z,
    radius: 0.55 * t.scale,
  })),
  // Boulders
  ...ISLAND_ROCKS.map((r) => ({
    id: r.id,
    x: r.x,
    z: r.z,
    radius: 0.85 * r.scale,
  })),
];

export const JUMP_PADS: JumpPad[] = [
  { id: 'geyser-east', x: 16.5, z: -6.0, radius: 1.6, boostVelocity: 16.5 },
  { id: 'geyser-west', x: -16.5, z: -6.0, radius: 1.6, boostVelocity: 16.5 },
  { id: 'geyser-north', x: 0, z: -21.5, radius: 1.6, boostVelocity: 15.0 },
];

export function createInitialShards(): AetherShard[] {
  const raw: Array<{ id: string; name: string; x: number; z: number; heightOffset: number }> = [
    { id: 'shard-plaza', name: 'Arrival Plaza Shard', x: 0, z: 6.2, heightOffset: 1.05 },
    { id: 'shard-bursa', name: 'Bursa Efek Plaza Shard', x: -6.2, z: 2.2, heightOffset: 1.15 },
    { id: 'shard-sekuritas', name: 'Perusahaan Sekuritas Shard', x: 6.2, z: 2.2, heightOffset: 1.15 },
    { id: 'shard-reksadana', name: 'Pusat Reksa Dana Gazebo Shard', x: 0, z: -8.2, heightOffset: 1.15 },
    { id: 'shard-altar', name: 'Sunstone Altar Shard', x: 0, z: -0.65, heightOffset: 1.25 },
    { id: 'shard-south-grove', name: 'Emerald Meadow Shard', x: -7.5, z: 11.5, heightOffset: 1.2 },
    { id: 'shard-bridge', name: 'Sky-Bridge Span Shard', x: 0, z: -28.0, heightOffset: 1.4 },
    { id: 'shard-sanctum', name: 'Northern Shrine Crown', x: 0, z: -39.0, heightOffset: 1.6 },
  ];

  return raw.map((item) => ({
    id: item.id,
    name: item.name,
    x: item.x,
    y: getIslandGroundHeight(item.x, item.z) + item.heightOffset,
    z: item.z,
    collected: false,
  }));
}

export const FLOATING_SATELLITE_ISLETS: SatelliteIslet[] = [
  { id: 'sat-1', x: -34, y: 4.5, z: -12, radius: 4.5, depth: 6.5, bobSpeed: 0.7, bobOffset: 0.2, hasTree: true },
  { id: 'sat-2', x: 35, y: 6.2, z: -16, radius: 5.2, depth: 7.8, bobSpeed: 0.55, bobOffset: 1.5, hasTree: true },
  { id: 'sat-3', x: -28, y: -2.5, z: 24, radius: 3.6, depth: 5.0, bobSpeed: 0.85, bobOffset: 2.7, hasTree: false },
  { id: 'sat-4', x: 30, y: 2.8, z: 22, radius: 4.0, depth: 6.0, bobSpeed: 0.65, bobOffset: 4.1, hasTree: true },
  { id: 'sat-5', x: -18, y: 7.5, z: -48, radius: 3.8, depth: 5.8, bobSpeed: 0.75, bobOffset: 3.3, hasTree: false },
  { id: 'sat-6', x: 22, y: 5.0, z: -45, radius: 4.4, depth: 6.4, bobSpeed: 0.6, bobOffset: 5.0, hasTree: true },
];
