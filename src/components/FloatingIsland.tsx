import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  getIslandGroundHeight,
  ISLAND_RADIUS,
  type AetherShard,
} from '../game/physics';
import {
  ISLAND_TREES,
  ISLAND_ROCKS,
  JUMP_PADS,
  FLOATING_SATELLITE_ISLETS,
  CENTRAL_CHART_BARS,
} from '../game/worldData';
import { getMeadowTextures, getStoneTextures } from '../game/textures';
import { CapitalMarketPOIs } from './CapitalMarketPOIs';

interface FloatingIslandProps {
  shards: AetherShard[];
  castShadows: boolean;
}

/**
 * Generates a custom sculpted top surface BufferGeometry for the main Floating Island
 * whose vertex Y elevations match `getIslandGroundHeight(x, z)` 1:1.
 */
function buildSculptedIslandTopGeometry(): THREE.BufferGeometry {
  const radialSegments = 48;
  const ringSegments = 22;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Center vertex
  const centerY = getIslandGroundHeight(0, 0);
  positions.push(0, centerY, 0);
  uvs.push(0.5, 0.5);

  for (let rIdx = 1; rIdx <= ringSegments; rIdx++) {
    const frac = rIdx / ringSegments;
    const radius = frac * ISLAND_RADIUS;
    for (let aIdx = 0; aIdx <= radialSegments; aIdx++) {
      const theta = (aIdx / radialSegments) * Math.PI * 2;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      const y = getIslandGroundHeight(x, z);
      positions.push(x, y, z);
      uvs.push(0.5 + (x / (ISLAND_RADIUS * 2)), 0.5 + (z / (ISLAND_RADIUS * 2)));
    }
  }

  // First ring triangles around center vertex (index 0)
  for (let aIdx = 0; aIdx < radialSegments; aIdx++) {
    const v1 = 1 + aIdx;
    const v2 = 1 + aIdx + 1;
    indices.push(0, v2, v1);
  }

  // Subsequent rings
  const ringStride = radialSegments + 1;
  for (let rIdx = 1; rIdx < ringSegments; rIdx++) {
    const rowStart = 1 + (rIdx - 1) * ringStride;
    const nextRowStart = rowStart + ringStride;
    for (let aIdx = 0; aIdx < radialSegments; aIdx++) {
      const a = rowStart + aIdx;
      const b = rowStart + aIdx + 1;
      const c = nextRowStart + aIdx;
      const d = nextRowStart + aIdx + 1;
      indices.push(a, d, c);
      indices.push(a, b, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function FloatingIsland({ shards, castShadows }: FloatingIslandProps) {
  const { gl } = useThree();
  const maxAniso = gl.capabilities.getMaxAnisotropy();

  const meadowTex = useMemo(() => getMeadowTextures(maxAniso), [maxAniso]);
  const stoneTex = useMemo(() => getStoneTextures(maxAniso), [maxAniso]);
  const topSurfaceGeo = useMemo(() => buildSculptedIslandTopGeometry(), []);

  // Refs for animated elements (zero React state updates in 60Hz loop)
  const chartTrendGroupRef = useRef<THREE.Group>(null);
  const monolithRingInnerRef = useRef<THREE.Mesh>(null);
  const monolithCoreRef = useRef<THREE.Mesh>(null);
  const chartBarRefs = useRef<Array<THREE.Group | null>>([]);
  const shardGroupRefs = useRef<Record<string, THREE.Group | null>>({});
  const satelliteGroupRefs = useRef<Record<string, THREE.Group | null>>({});
  const geyserRingRefs = useRef<Record<string, THREE.Mesh | null>>({});

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = state.clock.elapsedTime;

    // Animate Central Bullish Stock Chart Monument trend arrow, bars & breakout crest
    if (chartTrendGroupRef.current) {
      chartTrendGroupRef.current.position.y = Math.sin(t * 2.0) * 0.06;
    }
    if (monolithRingInnerRef.current) {
      monolithRingInnerRef.current.rotation.z -= dt * 0.95;
      monolithRingInnerRef.current.rotation.y += dt * 0.55;
    }
    if (monolithCoreRef.current) {
      monolithCoreRef.current.position.y = 4.25 + Math.sin(t * 2.4) * 0.14;
      monolithCoreRef.current.rotation.y += dt * 1.25;
    }
    for (let i = 0; i < CENTRAL_CHART_BARS.length; i++) {
      const barGrp = chartBarRefs.current[i];
      if (barGrp) {
        const pulse = 1 + Math.sin(t * 2.2 - i * 0.55) * 0.035;
        barGrp.scale.set(1, pulse, 1);
      }
    }

    // Animate collectible Aether Shards
    for (const shard of shards) {
      const grp = shardGroupRefs.current[shard.id];
      if (grp && !shard.collected) {
        grp.position.y = shard.y + Math.sin(t * 2.6 + shard.x) * 0.18;
        grp.rotation.y += dt * 1.8;
      }
    }

    // Animate floating satellite islets
    for (const sat of FLOATING_SATELLITE_ISLETS) {
      const grp = satelliteGroupRefs.current[sat.id];
      if (grp) {
        grp.position.y = sat.y + Math.sin(t * sat.bobSpeed + sat.bobOffset) * 0.55;
      }
    }

    // Animate Wind Geyser rings
    for (const pad of JUMP_PADS) {
      const ring = geyserRingRefs.current[pad.id];
      if (ring) {
        const cycle = (t * 1.4 + pad.x) % 1;
        ring.position.y = 0.15 + cycle * 1.8;
        const s = 0.65 + cycle * 0.55;
        ring.scale.set(s, s, 1);
      }
    }
  });

  // Stepping stones along the path from Spawn (0, 9.5) to Sunstone Monolith (0, -2) and Northern Bridge
  const steppingStones = useMemo(() => {
    const stones: Array<{ x: number; y: number; z: number; rx: number; rz: number; rot: number }> = [];
    const zCoords = [
      8.2, 6.6, 5.0, 3.4, 1.8,
      -6.2, -8.0, -9.8, -11.6, -13.4, -17.5, -19.5, -23.4, -25.2,
    ];
    zCoords.forEach((z, idx) => {
      const x = Math.sin(idx * 0.9) * 0.35;
      const y = getIslandGroundHeight(x, z);
      stones.push({
        x,
        y: y + 0.025,
        z,
        rx: 0.95 + (idx % 2) * 0.18,
        rz: 0.65 + (idx % 3) * 0.1,
        rot: (idx * 0.3) % 0.6 - 0.3,
      });
    });
    return stones;
  }, []);

  // Northern Sky-Bridge planks from z = -27.2 to z = -33.6
  const bridgeSegments = useMemo(() => {
    const segs: Array<{ z: number; y: number }> = [];
    for (let z = -27.2; z >= -33.6; z -= 1.06) {
      segs.push({ z, y: getIslandGroundHeight(0, z) });
    }
    return segs;
  }, []);

  return (
    <group name="aether-floating-island">
      {/* 1. MAIN FLOATING ISLAND TOP SCULPTED MEADOW */}
      <mesh
        geometry={topSurfaceGeo}
        receiveShadow={castShadows}
      >
        <meshStandardMaterial
          color="#ffffff"
          map={meadowTex.map}
          roughness={0.86}
          metalness={0.04}
        />
      </mesh>

      {/* Cliff Rim Grass Lip & Upper Stone Ledge Collar */}
      <mesh position={[0, -0.55, 0]} receiveShadow={castShadows}>
        <cylinderGeometry args={[ISLAND_RADIUS + 0.15, ISLAND_RADIUS - 0.8, 1.15, 32]} />
        <meshStandardMaterial color="#2f6e46" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Tapered Low-Poly Cliff Rock Underside (3-Tier Inverted Rock Formation) */}
      <group position={[0, -1.1, 0]}>
        <mesh position={[0, -3.2, 0]} castShadow={castShadows} receiveShadow={castShadows}>
          <cylinderGeometry args={[ISLAND_RADIUS - 0.7, 19.2, 6.4, 14]} />
          <meshStandardMaterial
            color="#ffffff"
            map={stoneTex.map}
            bumpMap={stoneTex.bumpMap}
            bumpScale={0.15}
            roughness={0.88}
            metalness={0.12}
          />
        </mesh>
        <mesh position={[0, -9.2, 0]} rotation={[0, 0.4, 0]}>
          <cylinderGeometry args={[18.8, 9.6, 6.5, 11]} />
          <meshStandardMaterial color="#4a525d" roughness={0.9} metalness={0.15} />
        </mesh>
        <mesh position={[0, -15.2, 0]} rotation={[0, 0.9, 0]}>
          <coneGeometry args={[9.6, 7.5, 9]} />
          <meshStandardMaterial color="#363d47" roughness={0.92} metalness={0.18} />
        </mesh>
        {/* Glowing Root Aether Crystal cluster hanging beneath the island */}
        <mesh position={[0, -19.2, 0]} rotation={[Math.PI, 0, 0]}>
          <octahedronGeometry args={[1.6, 0]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={1.6}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      </group>

      {/* 2. NORTHERN SKY BRIDGE & SHRINE SANCTUM ISLET */}
      {bridgeSegments.map((seg, i) => (
        <group key={`bridge-${i}`} position={[0, seg.y - 0.08, seg.z]}>
          {/* Stone Arch Slab */}
          <mesh receiveShadow={castShadows} castShadow={castShadows}>
            <boxGeometry args={[4.4, 0.28, 1.02]} />
            <meshStandardMaterial
              color="#d8dee9"
              map={stoneTex.map}
              roughness={0.75}
              metalness={0.15}
            />
          </mesh>
          {/* Left & Right Curb Stone Rails */}
          {i % 2 === 0 && (
            <>
              <mesh position={[-2.05, 0.35, 0]} castShadow={castShadows}>
                <boxGeometry args={[0.32, 0.55, 0.42]} />
                <meshStandardMaterial color="#94a3b8" roughness={0.65} metalness={0.2} />
              </mesh>
              <mesh position={[2.05, 0.35, 0]} castShadow={castShadows}>
                <boxGeometry args={[0.32, 0.55, 0.42]} />
                <meshStandardMaterial color="#94a3b8" roughness={0.65} metalness={0.2} />
              </mesh>
            </>
          )}
        </group>
      ))}

      {/* Northern Shrine Islet at (0, 1.2, -39) */}
      <group position={[0, 1.2, -39]}>
        <mesh position={[0, -0.35, 0]} receiveShadow={castShadows}>
          <cylinderGeometry args={[7.5, 6.8, 0.85, 24]} />
          <meshStandardMaterial
            color="#ffffff"
            map={meadowTex.map}
            roughness={0.8}
            metalness={0.05}
          />
        </mesh>
        {/* Raised Stone Dais */}
        <mesh position={[0, 0.22, 0]} receiveShadow={castShadows}>
          <cylinderGeometry args={[3.4, 3.8, 0.45, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            map={stoneTex.map}
            roughness={0.7}
            metalness={0.15}
          />
        </mesh>
        {/* Tapered Underside of Shrine Islet */}
        <mesh position={[0, -3.6, 0]} rotation={[Math.PI, 0.3, 0]}>
          <coneGeometry args={[6.8, 6.2, 10]} />
          <meshStandardMaterial color="#475569" roughness={0.9} metalness={0.15} />
        </mesh>

        {/* Composite 7-Part Ancient Sky-Gate Arch on Northern Shrine */}
        <group position={[0, 0.44, 0]}>
          {/* Left Pillar + Base */}
          <mesh position={[-2.2, 0.25, 0]} castShadow={castShadows}>
            <cylinderGeometry args={[0.55, 0.68, 0.5, 8]} />
            <meshStandardMaterial color="#64748b" roughness={0.8} metalness={0.2} />
          </mesh>
          <mesh position={[-2.2, 2.2, 0]} castShadow={castShadows}>
            <cylinderGeometry args={[0.38, 0.46, 3.8, 8]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.6} metalness={0.25} />
          </mesh>
          {/* Right Pillar + Base */}
          <mesh position={[2.2, 0.25, 0]} castShadow={castShadows}>
            <cylinderGeometry args={[0.55, 0.68, 0.5, 8]} />
            <meshStandardMaterial color="#64748b" roughness={0.8} metalness={0.2} />
          </mesh>
          <mesh position={[2.2, 2.2, 0]} castShadow={castShadows}>
            <cylinderGeometry args={[0.38, 0.46, 3.8, 8]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.6} metalness={0.25} />
          </mesh>
          {/* Lower Crossbeam */}
          <mesh position={[0, 3.5, 0]} castShadow={castShadows}>
            <boxGeometry args={[5.4, 0.36, 0.52]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.65} metalness={0.25} />
          </mesh>
          {/* Upper Swept Lintel */}
          <mesh position={[0, 4.15, 0]} castShadow={castShadows}>
            <boxGeometry args={[6.4, 0.44, 0.68]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.32} metalness={0.78} />
          </mesh>
          {/* Center Crest Gem */}
          <mesh position={[0, 3.82, 0]}>
            <octahedronGeometry args={[0.42, 0]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0ea5e9"
              emissiveIntensity={1.8}
              roughness={0.15}
              metalness={0.85}
            />
          </mesh>
        </group>
      </group>

      {/* 3. CENTRAL LANDMARK VISTA: BULLISH STOCK CHART MONUMENT AT (0, y, -2) */}
      <group
        name="central-bullish-chart-monument"
        position={[0, getIslandGroundHeight(0, -2), -2]}
      >
        {/* Stepped Circular Stone Plaza Base (offset >= 0.02 on Y to prevent Z-fighting) */}
        <mesh position={[0, 0.08, 0]} receiveShadow={castShadows}>
          <cylinderGeometry args={[4.4, 4.8, 0.2, 24]} />
          <meshStandardMaterial
            color="#ffffff"
            map={stoneTex.map}
            bumpMap={stoneTex.bumpMap}
            bumpScale={0.08}
            roughness={0.72}
            metalness={0.15}
          />
        </mesh>

        {/* Golden Engraved Compass Ring */}
        <mesh position={[0, 0.19, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.1, 3.35, 32]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.28} metalness={0.85} />
        </mesh>

        {/* Tiered Financial Monument Plinth & Brushed Gold Trim */}
        <mesh position={[0, 0.38, 0]} castShadow={castShadows} receiveShadow={castShadows}>
          <boxGeometry args={[4.4, 0.4, 1.55]} />
          <meshStandardMaterial color="#1e293b" roughness={0.76} metalness={0.22} />
        </mesh>
        <mesh position={[0, 0.61, 0]} castShadow={castShadows} receiveShadow={castShadows}>
          <boxGeometry args={[4.58, 0.08, 1.7]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.26} metalness={0.88} />
        </mesh>

        {/* Architectural Dark-Slate Chart Backdrop Frame & Reference Grid Lines */}
        <group position={[0, 2.1, -0.45]}>
          <mesh castShadow={castShadows} receiveShadow={castShadows}>
            <boxGeometry args={[4.25, 2.9, 0.1]} />
            <meshStandardMaterial color="#0f172a" roughness={0.68} metalness={0.28} />
          </mesh>
          {/* Left & Right Brass Frame Pillars */}
          <mesh position={[-2.16, 0, 0.04]} castShadow={castShadows}>
            <boxGeometry args={[0.14, 3.02, 0.2]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.42} metalness={0.65} />
          </mesh>
          <mesh position={[2.16, 0, 0.04]} castShadow={castShadows}>
            <boxGeometry args={[0.14, 3.02, 0.2]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.42} metalness={0.65} />
          </mesh>
          {/* Horizontal Bullish Grid Lines on Backdrop */}
          {[-0.85, -0.15, 0.55, 1.25].map((gy, idx) => (
            <mesh key={`grid-line-${idx}`} position={[0, gy, 0.06]}>
              <boxGeometry args={[4.05, 0.025, 0.02]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#0284c7"
                emissiveIntensity={0.55}
                roughness={0.3}
                metalness={0.7}
              />
            </mesh>
          ))}
        </group>

        {/* 5 Ascending 3D Bullish Stock Candlestick / Bar Columns (West to East Uptrend) */}
        {CENTRAL_CHART_BARS.map((bar, idx) => (
          <group
            key={bar.id}
            ref={(el) => {
              chartBarRefs.current[idx] = el;
            }}
            position={[bar.x, 0.65, 0]}
          >
            {/* Upper & Lower Golden Candlestick Wick */}
            <mesh position={[0, bar.wickHeight / 2, 0]} castShadow={castShadows}>
              <cylinderGeometry args={[0.045, 0.045, bar.wickHeight, 8]} />
              <meshStandardMaterial
                color="#fbbf24"
                emissive="#d97706"
                emissiveIntensity={0.35}
                roughness={0.24}
                metalness={0.88}
              />
            </mesh>
            {/* 3D Candlestick Column Body */}
            <mesh
              position={[0, bar.height / 2, 0]}
              castShadow={castShadows}
              receiveShadow={castShadows}
            >
              <boxGeometry args={[0.5, bar.height, 0.5]} />
              <meshStandardMaterial
                color={bar.color}
                emissive={bar.emissive}
                emissiveIntensity={0.42}
                roughness={0.32}
                metalness={0.45}
              />
            </mesh>
            {/* Glowing Bullish Crown Cap on Each Bar */}
            <mesh position={[0, bar.height + 0.035, 0]}>
              <boxGeometry args={[0.54, 0.07, 0.54]} />
              <meshStandardMaterial
                color="#fef08a"
                emissive="#10b981"
                emissiveIntensity={0.85}
                roughness={0.18}
                metalness={0.82}
              />
            </mesh>
          </group>
        ))}

        {/* Rising 3D Bullish Trendline & Upward Breakout Arrowhead */}
        <group ref={chartTrendGroupRef}>
          <group position={[0.05, 2.55, 0.36]} rotation={[0, 0, 0.56]}>
            {/* Ascending Golden-Emerald Trendline Beam */}
            <mesh castShadow={castShadows}>
              <boxGeometry args={[4.45, 0.14, 0.14]} />
              <meshStandardMaterial
                color="#fbbf24"
                emissive="#f59e0b"
                emissiveIntensity={1.1}
                roughness={0.2}
                metalness={0.9}
              />
            </mesh>
            {/* 3D Upward Breakout Arrowhead at the Bullish Apex */}
            <mesh position={[2.42, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow={castShadows}>
              <coneGeometry args={[0.34, 0.68, 4]} />
              <meshStandardMaterial
                color="#34d399"
                emissive="#10b981"
                emissiveIntensity={1.35}
                roughness={0.18}
                metalness={0.88}
              />
            </mesh>
          </group>
        </group>

        {/* Levitating Bullish Breakout Crest & Orbit Ring Above Highest Bar (x = 1.6) */}
        <mesh ref={monolithRingInnerRef} position={[1.6, 4.25, 0]}>
          <torusGeometry args={[0.52, 0.04, 12, 28]} />
          <meshStandardMaterial
            color="#34d399"
            emissive="#10b981"
            emissiveIntensity={1.1}
            roughness={0.2}
            metalness={0.85}
          />
        </mesh>
        <mesh ref={monolithCoreRef} position={[1.6, 4.25, 0]}>
          <octahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#f59e0b"
            emissiveIntensity={2.0}
            roughness={0.12}
            metalness={0.9}
          />
        </mesh>
      </group>

      {/* 4. SPAWN ARRIVAL PLAZA AT (0, y, 9.5) */}
      <group position={[0, getIslandGroundHeight(0, 9.5) + 0.02, 9.5]}>
        <mesh receiveShadow={castShadows}>
          <cylinderGeometry args={[2.3, 2.5, 0.08, 20]} />
          <meshStandardMaterial color="#cbd5e1" map={stoneTex.map} roughness={0.7} metalness={0.15} />
        </mesh>
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.65, 1.85, 24]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.85} roughness={0.3} metalness={0.6} />
        </mesh>
      </group>

      {/* Stepping Stones Trail */}
      {steppingStones.map((s, idx) => (
        <mesh
          key={`stone-${idx}`}
          position={[s.x, s.y, s.z]}
          rotation={[0, s.rot, 0]}
          receiveShadow={castShadows}
        >
          <cylinderGeometry args={[s.rx, s.rx * 1.08, 0.09, 7]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.78} metalness={0.12} />
        </mesh>
      ))}

      {/* 5. COMPOSITE 5-PART LOW-POLY TREES WITH CONTACT SHADOWS */}
      {ISLAND_TREES.map((tree) => (
        <group
          key={tree.id}
          position={[tree.x, tree.y, tree.z]}
          scale={[tree.scale, tree.scale, tree.scale]}
        >
          {/* Soft Contact Shadow Disc */}
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.25, 16]} />
            <meshBasicMaterial color="#09150e" transparent opacity={0.38} depthWrite={false} />
          </mesh>
          {/* 1. Flared Root Base */}
          <mesh position={[0, 0.25, 0]} castShadow={castShadows}>
            <cylinderGeometry args={[0.26, 0.44, 0.5, 7]} />
            <meshStandardMaterial color="#5c4033" roughness={0.9} metalness={0.05} />
          </mesh>
          {/* 2. Tapered Timber Trunk */}
          <mesh position={[0, 0.95, 0]} castShadow={castShadows}>
            <cylinderGeometry args={[0.18, 0.28, 1.4, 7]} />
            <meshStandardMaterial color="#6f4e37" roughness={0.86} metalness={0.05} />
          </mesh>
          {/* 3. Lower Foliage Canopy Tier */}
          <mesh position={[0, 2.0, 0]} castShadow={castShadows} receiveShadow={castShadows}>
            <coneGeometry args={[1.35, 1.65, 7]} />
            <meshStandardMaterial color={tree.tint} roughness={0.62} metalness={0.08} />
          </mesh>
          {/* 4. Middle Foliage Canopy Tier */}
          <mesh position={[0, 2.95, 0]} rotation={[0, 0.45, 0]} castShadow={castShadows} receiveShadow={castShadows}>
            <coneGeometry args={[1.05, 1.45, 7]} />
            <meshStandardMaterial
              color={tree.variant === 'blossom' ? '#74c69d' : tree.tint}
              roughness={0.55}
              metalness={0.1}
            />
          </mesh>
          {/* 5. Crown Spire Tier */}
          <mesh position={[0, 3.75, 0]} rotation={[0, 0.9, 0]} castShadow={castShadows}>
            <coneGeometry args={[0.68, 1.15, 7]} />
            <meshStandardMaterial
              color={tree.variant === 'blossom' ? '#95d5b2' : '#52b788'}
              roughness={0.48}
              metalness={0.12}
            />
          </mesh>
        </group>
      ))}

      {/* 6. COMPOSITE 3-4 PART BOULDER CLUSTERS WITH CRYSTAL VEINS */}
      {ISLAND_ROCKS.map((rock) => (
        <group
          key={rock.id}
          position={[rock.x, rock.y, rock.z]}
          rotation={[0, rock.rotationY, 0]}
          scale={[rock.scale, rock.scale, rock.scale]}
        >
          {/* Contact shadow disc */}
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.05, 14]} />
            <meshBasicMaterial color="#09150e" transparent opacity={0.35} depthWrite={false} />
          </mesh>
          {/* Primary Boulder Mass */}
          <mesh position={[0, 0.48, 0]} castShadow={castShadows} receiveShadow={castShadows}>
            <dodecahedronGeometry args={[0.72, 0]} />
            <meshStandardMaterial color="#64748b" roughness={0.85} metalness={0.15} />
          </mesh>
          {/* Secondary Shoulder Stone */}
          <mesh position={[0.48, 0.3, 0.25]} rotation={[0.3, 0.5, 0.2]} castShadow={castShadows}>
            <dodecahedronGeometry args={[0.45, 0]} />
            <meshStandardMaterial color="#475569" roughness={0.9} metalness={0.1} />
          </mesh>
          {/* Glowing Crystal Shard Accent */}
          {rock.hasCrystal && (
            <mesh position={[-0.18, 0.85, 0.12]} rotation={[0.25, 0.4, -0.3]}>
              <octahedronGeometry args={[0.28, 0]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#0284c7"
                emissiveIntensity={1.5}
                roughness={0.18}
                metalness={0.85}
              />
            </mesh>
          )}
        </group>
      ))}

      {/* 7. WIND GEYSER JUMP PADS */}
      {JUMP_PADS.map((pad) => {
        const y = getIslandGroundHeight(pad.x, pad.z);
        return (
          <group key={pad.id} position={[pad.x, y + 0.03, pad.z]}>
            <mesh receiveShadow={castShadows}>
              <cylinderGeometry args={[1.3, 1.5, 0.14, 18]} />
              <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.6} />
            </mesh>
            <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[1.05, 20]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#0ea5e9"
                emissiveIntensity={1.6}
                roughness={0.2}
                metalness={0.8}
              />
            </mesh>
            {/* Rising Wind Current Ring */}
            <mesh
              ref={(el) => {
                geyserRingRefs.current[pad.id] = el;
              }}
              position={[0, 0.5, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[0.85, 1.02, 24]} />
              <meshBasicMaterial color="#7dd3fc" transparent opacity={0.65} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}

      {/* 8. COLLECTIBLE AETHER SHARDS */}
      {shards.map((shard) => {
        if (shard.collected) return null;
        const groundY = getIslandGroundHeight(shard.x, shard.z);
        return (
          <group key={shard.id}>
            {/* Ground Contact Beacon Disc */}
            <mesh position={[shard.x, groundY + 0.025, shard.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.45, 0.72, 20]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.55} depthWrite={false} />
            </mesh>
            {/* Floating Composite Crystal Group */}
            <group
              ref={(el) => {
                shardGroupRefs.current[shard.id] = el;
              }}
              position={[shard.x, shard.y, shard.z]}
            >
              {/* Core Crystal Octahedron */}
              <mesh castShadow={castShadows}>
                <octahedronGeometry args={[0.42, 0]} />
                <meshStandardMaterial
                  color="#7dd3fc"
                  emissive="#0ea5e9"
                  emissiveIntensity={2.1}
                  roughness={0.12}
                  metalness={0.9}
                />
              </mesh>
              {/* Golden Orbiting Collar Ring */}
              <mesh rotation={[Math.PI / 3, 0, 0]}>
                <torusGeometry args={[0.58, 0.04, 8, 24]} />
                <meshStandardMaterial color="#fbbf24" roughness={0.25} metalness={0.88} />
              </mesh>
              {/* Top & Bottom Fin Caps */}
              <mesh position={[0, 0.55, 0]}>
                <coneGeometry args={[0.12, 0.24, 4]} />
                <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.2} />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* 9. DISTANT FLOATING SATELLITE ISLETS IN THE SKY */}
      {FLOATING_SATELLITE_ISLETS.map((sat) => (
        <group
          key={sat.id}
          ref={(el) => {
            satelliteGroupRefs.current[sat.id] = el;
          }}
          position={[sat.x, sat.y, sat.z]}
        >
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[sat.radius, sat.radius * 0.85, 0.9, 10]} />
            <meshStandardMaterial color="#3b8c5a" roughness={0.85} metalness={0.05} />
          </mesh>
          <mesh position={[0, -sat.depth * 0.5 - 0.3, 0]} rotation={[Math.PI, 0.4, 0]}>
            <coneGeometry args={[sat.radius * 0.85, sat.depth, 8]} />
            <meshStandardMaterial color="#475569" roughness={0.9} metalness={0.15} />
          </mesh>
          {sat.hasTree && (
            <group position={[0, 0.45, 0]} scale={[0.85, 0.85, 0.85]}>
              <mesh position={[0, 0.7, 0]}>
                <cylinderGeometry args={[0.16, 0.24, 1.2, 6]} />
                <meshStandardMaterial color="#6f4e37" roughness={0.88} />
              </mesh>
              <mesh position={[0, 1.7, 0]}>
                <coneGeometry args={[1.1, 1.8, 7]} />
                <meshStandardMaterial color="#40916c" roughness={0.6} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
}
