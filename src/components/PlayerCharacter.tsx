import { useRef, useMemo, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  stepPlayerPhysics,
  checkShardCollection,
  getIslandGroundHeight,
  getCapitalMarketPOIStatus,
  type PlayerPhysicsState,
  type AetherShard,
  type CapitalMarketPOI,
} from '../game/physics';
import { ISLAND_OBSTACLES, JUMP_PADS } from '../game/worldData';
import { gameInput } from '../game/input';
import { soundFX } from '../game/sound';

export interface TelemetrySnapshot {
  x: number;
  y: number;
  z: number;
  yaw?: number;
  speed: number;
  peakSpeed: number;
  stamina: number;
  isGrounded: boolean;
  respawnCount: number;
}

interface PlayerCharacterProps {
  gameState: 'title' | 'playing' | 'paused' | 'gameover';
  freeRoam: boolean;
  isInteractionModalOpen: boolean;
  playerStateRef: MutableRefObject<PlayerPhysicsState>;
  cameraYawRef: MutableRefObject<number>;
  shardsRef: MutableRefObject<AetherShard[]>;
  castShadows: boolean;
  onShardCollected: (updatedShards: AetherShard[], newlyCollectedIds: string[]) => void;
  onProximityChange: (poi: CapitalMarketPOI | null) => void;
  onTelemetryUpdate: (snapshot: TelemetrySnapshot) => void;
}

const PARTICLE_POOL_SIZE = 28;
const _dummyObj = new THREE.Object3D();

interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scale: number;
}

export function PlayerCharacter({
  gameState,
  freeRoam,
  isInteractionModalOpen,
  playerStateRef,
  cameraYawRef,
  shardsRef,
  castShadows,
  onShardCollected,
  onProximityChange,
  onTelemetryUpdate,
}: PlayerCharacterProps) {
  const rootGroupRef = useRef<THREE.Group>(null);
  const bodyScaleGroupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const cloakRef = useRef<THREE.Mesh>(null);
  const packCoreRef = useRef<THREE.Mesh>(null);
  const groundShadowRef = useRef<THREE.Mesh>(null);
  const particleMeshRef = useRef<THREE.InstancedMesh>(null);

  const lastTelemetryTimeRef = useRef(0);
  const particleCursorRef = useRef(0);
  const lastActivePOIIdRef = useRef<string | null>(null);

  // Pre-allocated zero-GC particle pool
  const particles = useMemo<PooledParticle[]>(
    () =>
      Array.from({ length: PARTICLE_POOL_SIZE }, () => ({
        active: false,
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 0.5,
        scale: 0.15,
      })),
    []
  );

  const spawnBurst = (x: number, y: number, z: number, count: number, upwardSpeed: number, spread: number) => {
    for (let i = 0; i < count; i++) {
      const idx = particleCursorRef.current % PARTICLE_POOL_SIZE;
      particleCursorRef.current += 1;
      const p = particles[idx];
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const spd = (0.4 + Math.random() * 0.6) * spread;
      p.active = true;
      p.x = x + (Math.random() - 0.5) * 0.3;
      p.y = y + 0.12;
      p.z = z + (Math.random() - 0.5) * 0.3;
      p.vx = Math.cos(angle) * spd;
      p.vy = upwardSpeed * (0.6 + Math.random() * 0.5);
      p.vz = Math.sin(angle) * spd;
      p.life = 0;
      p.maxLife = 0.35 + Math.random() * 0.25;
      p.scale = 0.14 + Math.random() * 0.12;
    }
  };

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const activePlay =
      (gameState === 'playing' || (gameState === 'gameover' && freeRoam)) &&
      !isInteractionModalOpen;

    if (!activePlay) {
      // Ensure horizontal velocity is zeroed while paused in Welcome Screen or an educational modal
      playerStateRef.current.vx = 0;
      playerStateRef.current.vz = 0;
    }

    if (activePlay) {
      const input = gameInput.sampleMovementInput();
      const nextState = stepPlayerPhysics(
        playerStateRef.current,
        input,
        dt,
        cameraYawRef.current,
        ISLAND_OBSTACLES,
        JUMP_PADS
      );
      playerStateRef.current = nextState;

      // Proximity detection for Capital Market buildings
      const { activePOI } = getCapitalMarketPOIStatus(nextState.x, nextState.z);
      const currentPOIId = activePOI?.id ?? null;
      if (currentPOIId !== lastActivePOIIdRef.current) {
        lastActivePOIIdRef.current = currentPOIId;
        onProximityChange(activePOI);
      }

      // Audio + Particle Juice on events
      if (nextState.justJumped) {
        soundFX.playJump();
        spawnBurst(nextState.x, nextState.y, nextState.z, 7, 2.2, 2.2);
      }
      if (nextState.justLanded) {
        soundFX.playLand();
        spawnBurst(nextState.x, nextState.y, nextState.z, 10, 1.5, 2.8);
      }
      if (nextState.justBoosted) {
        soundFX.playBoost();
        spawnBurst(nextState.x, nextState.y, nextState.z, 16, 4.8, 3.4);
      }

      // Check Aether Shard proximity
      const { updatedShards, newlyCollectedIds } = checkShardCollection(
        { x: nextState.x, y: nextState.y, z: nextState.z },
        shardsRef.current
      );
      if (newlyCollectedIds.length > 0) {
        shardsRef.current = updatedShards;
        const collectedTotal = updatedShards.filter((s) => s.collected).length;
        soundFX.playShardPickup(collectedTotal);
        spawnBurst(nextState.x, nextState.y + 0.9, nextState.z, 18, 3.6, 3.8);
        onShardCollected(updatedShards, newlyCollectedIds);
      }

      // Throttled HUD Telemetry (<= 10Hz)
      const now = state.clock.elapsedTime;
      if (now - lastTelemetryTimeRef.current >= 0.1) {
        lastTelemetryTimeRef.current = now;
        const horizSpeed = Math.hypot(nextState.vx, nextState.vz);
        onTelemetryUpdate({
          x: nextState.x,
          y: nextState.y,
          z: nextState.z,
          yaw: nextState.yaw,
          speed: horizSpeed,
          peakSpeed: nextState.peakSpeed,
          stamina: nextState.stamina,
          isGrounded: nextState.isGrounded,
          respawnCount: nextState.respawnCount,
        });
      }
    } else {
      // Also keep proximity state synced if teleported while paused/idle
      const psNow = playerStateRef.current;
      const { activePOI } = getCapitalMarketPOIStatus(psNow.x, psNow.z);
      const currentPOIId = activePOI?.id ?? null;
      if (currentPOIId !== lastActivePOIIdRef.current) {
        lastActivePOIIdRef.current = currentPOIId;
        onProximityChange(activePOI);
      }
    }

    // Apply transform to 3D character group
    const ps = playerStateRef.current;
    const horizSpeed = Math.hypot(ps.vx, ps.vz);
    const gaitBob = ps.isGrounded && horizSpeed > 0.2 ? Math.abs(Math.sin(ps.gaitPhase)) * 0.08 : 0;

    if (rootGroupRef.current) {
      rootGroupRef.current.position.set(ps.x, ps.y + gaitBob, ps.z);
      rootGroupRef.current.rotation.y = ps.yaw;
    }

    if (bodyScaleGroupRef.current) {
      bodyScaleGroupRef.current.scale.set(ps.scaleX, ps.scaleY, ps.scaleZ);
      // Slight forward lean proportional to speed
      const forwardLean = Math.min(0.22, horizSpeed * 0.018);
      bodyScaleGroupRef.current.rotation.x = forwardLean;
    }

    // Articulated limb swing synced to gaitPhase
    const swingAmp = Math.min(1, horizSpeed / 5.5) * 0.65;
    const swingAngle = ps.isGrounded ? Math.sin(ps.gaitPhase) * swingAmp : 0.35;

    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = swingAngle;
      rightLegRef.current.rotation.x = -swingAngle;
    }
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = -swingAngle * 0.85;
      rightArmRef.current.rotation.x = swingAngle * 0.85;
    }
    if (cloakRef.current) {
      cloakRef.current.rotation.x = 0.12 + Math.min(0.35, horizSpeed * 0.03) + (ps.isGrounded ? 0 : 0.2);
    }
    if (packCoreRef.current) {
      packCoreRef.current.rotation.y += dt * (2.0 + horizSpeed * 0.4);
    }

    // Ground Contact Shadow Disc stays flush on the terrain below the player
    if (groundShadowRef.current) {
      const groundY = getIslandGroundHeight(ps.x, ps.z);
      if (groundY > -50) {
        groundShadowRef.current.visible = true;
        const heightAboveGround = Math.max(0, ps.y - groundY);
        const shadowScale = Math.max(0.35, 1 - heightAboveGround * 0.08);
        groundShadowRef.current.position.set(ps.x, groundY + 0.025, ps.z);
        groundShadowRef.current.scale.set(shadowScale, shadowScale, 1);
      } else {
        groundShadowRef.current.visible = false;
      }
    }

    // Update Pooled Particles InstancedMesh
    if (particleMeshRef.current) {
      for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        const p = particles[i];
        if (p.active) {
          p.life += dt;
          if (p.life >= p.maxLife) {
            p.active = false;
            _dummyObj.position.set(0, -100, 0);
            _dummyObj.scale.set(0.001, 0.001, 0.001);
          } else {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.z += p.vz * dt;
            p.vy -= 6.5 * dt;
            const progress = p.life / p.maxLife;
            const s = p.scale * (1 - progress);
            _dummyObj.position.set(p.x, p.y, p.z);
            _dummyObj.scale.set(s, s, s);
          }
        } else {
          _dummyObj.position.set(0, -100, 0);
          _dummyObj.scale.set(0.001, 0.001, 0.001);
        }
        _dummyObj.updateMatrix();
        particleMeshRef.current.setMatrixAt(i, _dummyObj.matrix);
      }
      particleMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Soft Ground Contact Shadow Disc */}
      <mesh
        ref={groundShadowRef}
        position={[0, 0.03, 9.5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.68, 20]} />
        <meshBasicMaterial
          color="#09150e"
          transparent
          opacity={0.44}
          depthWrite={false}
        />
      </mesh>

      {/* Composite 3D CUANTURE Explorer Character (Adapted from Official Character Sheet) */}
      <group
        ref={rootGroupRef}
        name="player-character"
        position={[0, getIslandGroundHeight(0, 9.5), 9.5]}
        rotation={[0, Math.PI, 0]}
      >
        <group ref={bodyScaleGroupRef}>
          {/* 1. Articulated Left & Right Legs with Socks & Brown Explorer Boots */}
          <group ref={leftLegRef} position={[-0.15, 0.38, 0]}>
            {/* Upper Leg / Shorts Cuff */}
            <mesh position={[0, -0.06, 0]} castShadow={castShadows}>
              <cylinderGeometry args={[0.105, 0.095, 0.14, 12]} />
              <meshStandardMaterial color="#451a03" roughness={0.8} metalness={0.08} />
            </mesh>
            {/* Lower Leg & Cream Sock */}
            <mesh position={[0, -0.18, 0]} castShadow={castShadows}>
              <capsuleGeometry args={[0.075, 0.1, 6, 10]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.7} metalness={0.05} />
            </mesh>
            {/* Sturdy Brown Leather Boot */}
            <mesh position={[0, -0.29, 0.03]} castShadow={castShadows}>
              <boxGeometry args={[0.17, 0.14, 0.24]} />
              <meshStandardMaterial color="#5c2d16" roughness={0.65} metalness={0.15} />
            </mesh>
            {/* Boot Sole */}
            <mesh position={[0, -0.355, 0.03]}>
              <boxGeometry args={[0.18, 0.035, 0.25]} />
              <meshStandardMaterial color="#1c1917" roughness={0.9} />
            </mesh>
          </group>

          <group ref={rightLegRef} position={[0.15, 0.38, 0]}>
            {/* Upper Leg / Shorts Cuff */}
            <mesh position={[0, -0.06, 0]} castShadow={castShadows}>
              <cylinderGeometry args={[0.105, 0.095, 0.14, 12]} />
              <meshStandardMaterial color="#451a03" roughness={0.8} metalness={0.08} />
            </mesh>
            {/* Lower Leg & Cream Sock */}
            <mesh position={[0, -0.18, 0]} castShadow={castShadows}>
              <capsuleGeometry args={[0.075, 0.1, 6, 10]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.7} metalness={0.05} />
            </mesh>
            {/* Sturdy Brown Leather Boot */}
            <mesh position={[0, -0.29, 0.03]} castShadow={castShadows}>
              <boxGeometry args={[0.17, 0.14, 0.24]} />
              <meshStandardMaterial color="#5c2d16" roughness={0.65} metalness={0.15} />
            </mesh>
            {/* Boot Sole */}
            <mesh position={[0, -0.355, 0.03]}>
              <boxGeometry args={[0.18, 0.035, 0.25]} />
              <meshStandardMaterial color="#1c1917" roughness={0.9} />
            </mesh>
          </group>

          {/* 2. Dark Brown Cargo Shorts Pelvis Base */}
          <mesh position={[0, 0.48, 0]} castShadow={castShadows} receiveShadow={castShadows}>
            <cylinderGeometry args={[0.255, 0.265, 0.22, 16]} />
            <meshStandardMaterial color="#451a03" roughness={0.82} metalness={0.08} />
          </mesh>

          {/* 3. Explorer Leather Belt & Golden Buckle */}
          <group position={[0, 0.57, 0]}>
            <mesh castShadow={castShadows}>
              <cylinderGeometry args={[0.268, 0.268, 0.07, 16]} />
              <meshStandardMaterial color="#291509" roughness={0.5} metalness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.26]} castShadow={castShadows}>
              <boxGeometry args={[0.11, 0.075, 0.04]} />
              <meshStandardMaterial color="#fbbf24" roughness={0.25} metalness={0.85} />
            </mesh>
          </group>

          {/* 4. Cream Undershirt & Green CUANTURE Explorer Vest */}
          <group position={[0, 0.76, 0]}>
            {/* Inner Cream Shirt */}
            <mesh castShadow={castShadows} receiveShadow={castShadows}>
              <capsuleGeometry args={[0.24, 0.26, 8, 16]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.65} metalness={0.05} />
            </mesh>
            {/* Outer Green Explorer Vest */}
            <mesh position={[0, -0.01, -0.01]} castShadow={castShadows} receiveShadow={castShadows}>
              <cylinderGeometry args={[0.262, 0.272, 0.34, 16]} />
              <meshStandardMaterial color="#15803d" roughness={0.6} metalness={0.12} />
            </mesh>
            {/* Cream Front Shirt V-Opening Strip */}
            <mesh position={[0, 0.02, 0.255]}>
              <boxGeometry args={[0.09, 0.32, 0.03]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.65} />
            </mesh>
            {/* Explorer Vest Front Utility Pockets */}
            <mesh position={[-0.13, -0.05, 0.24]} castShadow={castShadows}>
              <boxGeometry args={[0.09, 0.1, 0.04]} />
              <meshStandardMaterial color="#166534" roughness={0.7} />
            </mesh>
            <mesh position={[0.13, -0.05, 0.24]} castShadow={castShadows}>
              <boxGeometry args={[0.09, 0.1, 0.04]} />
              <meshStandardMaterial color="#166534" roughness={0.7} />
            </mesh>
          </group>

          {/* 5. Signature Red Neck Scarf & Animated Scarf Tail */}
          <group position={[0, 0.96, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow={castShadows}>
              <torusGeometry args={[0.19, 0.055, 10, 20]} />
              <meshStandardMaterial color="#dc2626" roughness={0.55} metalness={0.08} />
            </mesh>
            {/* Front Scarf Knot */}
            <mesh position={[0, -0.05, 0.21]} rotation={[0.2, 0, 0]} castShadow={castShadows}>
              <coneGeometry args={[0.08, 0.14, 8]} />
              <meshStandardMaterial color="#ef4444" roughness={0.55} />
            </mesh>
          </group>
          <mesh
            ref={cloakRef}
            position={[0, 0.88, -0.18]}
            rotation={[0.18, 0, 0]}
            castShadow={castShadows}
          >
            <coneGeometry args={[0.16, 0.34, 8]} />
            <meshStandardMaterial color="#dc2626" roughness={0.6} metalness={0.08} />
          </mesh>

          {/* 6. Articulated Left & Right Arms (Rolled Cream Sleeves, Wristband & Hands) */}
          <group ref={leftArmRef} position={[-0.33, 0.86, 0]}>
            {/* Rolled Cream Shirt Sleeve */}
            <mesh position={[0, -0.05, 0]} castShadow={castShadows}>
              <cylinderGeometry args={[0.085, 0.08, 0.14, 10]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.65} />
            </mesh>
            {/* Forearm */}
            <mesh position={[0, -0.17, 0]} castShadow={castShadows}>
              <capsuleGeometry args={[0.068, 0.12, 6, 10]} />
              <meshStandardMaterial color="#fdba74" roughness={0.55} />
            </mesh>
            {/* Explorer Brown Wristband */}
            <mesh position={[0, -0.22, 0]}>
              <cylinderGeometry args={[0.074, 0.074, 0.045, 10]} />
              <meshStandardMaterial color="#78350f" roughness={0.6} />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.28, 0]} castShadow={castShadows}>
              <sphereGeometry args={[0.072, 10, 10]} />
              <meshStandardMaterial color="#fdba74" roughness={0.55} />
            </mesh>
          </group>

          <group ref={rightArmRef} position={[0.33, 0.86, 0]}>
            {/* Rolled Cream Shirt Sleeve */}
            <mesh position={[0, -0.05, 0]} castShadow={castShadows}>
              <cylinderGeometry args={[0.085, 0.08, 0.14, 10]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.65} />
            </mesh>
            {/* Forearm */}
            <mesh position={[0, -0.17, 0]} castShadow={castShadows}>
              <capsuleGeometry args={[0.068, 0.12, 6, 10]} />
              <meshStandardMaterial color="#fdba74" roughness={0.55} />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.28, 0]} castShadow={castShadows}>
              <sphereGeometry args={[0.072, 10, 10]} />
              <meshStandardMaterial color="#fdba74" roughness={0.55} />
            </mesh>
          </group>

          {/* 7. Brown Leather Explorer Backpack + Bedroll + Spinning Golden Cuan Compass */}
          <group position={[0, 0.77, -0.26]}>
            {/* Main Leather Pack */}
            <mesh castShadow={castShadows}>
              <boxGeometry args={[0.32, 0.34, 0.18]} />
              <meshStandardMaterial color="#78350f" roughness={0.6} metalness={0.18} />
            </mesh>
            {/* Top Flap */}
            <mesh position={[0, 0.14, 0.01]} castShadow={castShadows}>
              <boxGeometry args={[0.33, 0.08, 0.19]} />
              <meshStandardMaterial color="#5c2d16" roughness={0.55} metalness={0.2} />
            </mesh>
            {/* Top Rolled Bedroll */}
            <mesh position={[0, 0.22, 0]} rotation={[0, 0, Math.PI / 2]} castShadow={castShadows}>
              <cylinderGeometry args={[0.065, 0.065, 0.34, 12]} />
              <meshStandardMaterial color="#d97706" roughness={0.65} />
            </mesh>
            {/* Spinning Golden Cuan Emblem / Compass Core */}
            <mesh ref={packCoreRef} position={[0, -0.01, -0.11]}>
              <octahedronGeometry args={[0.1, 0]} />
              <meshStandardMaterial
                color="#fde047"
                emissive="#f59e0b"
                emissiveIntensity={1.4}
                roughness={0.2}
                metalness={0.85}
              />
            </mesh>
          </group>

          {/* 8. Expressive Chibi Explorer Head, Hair & Face */}
          <group position={[0, 1.24, 0]}>
            {/* Skin Head Sphere */}
            <mesh castShadow={castShadows}>
              <sphereGeometry args={[0.25, 18, 18]} />
              <meshStandardMaterial color="#fed7aa" roughness={0.5} metalness={0.05} />
            </mesh>
            {/* Left & Right Ears */}
            <mesh position={[-0.24, -0.01, 0]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial color="#fdba74" roughness={0.55} />
            </mesh>
            <mesh position={[0.24, -0.01, 0]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial color="#fdba74" roughness={0.55} />
            </mesh>
            {/* Dark Brown Fluffy Hair Back & Side Tufts */}
            <mesh position={[0, 0.04, -0.04]} castShadow={castShadows}>
              <sphereGeometry args={[0.255, 14, 14]} />
              <meshStandardMaterial color="#3b1d0e" roughness={0.75} />
            </mesh>
            <mesh position={[-0.18, 0.06, 0.12]} rotation={[0, 0, 0.3]}>
              <capsuleGeometry args={[0.05, 0.08, 4, 8]} />
              <meshStandardMaterial color="#3b1d0e" roughness={0.75} />
            </mesh>
            <mesh position={[0.18, 0.06, 0.12]} rotation={[0, 0, -0.3]}>
              <capsuleGeometry args={[0.05, 0.08, 4, 8]} />
              <meshStandardMaterial color="#3b1d0e" roughness={0.75} />
            </mesh>
            {/* Expressive Dark Eyes + Catchlights (Marks Forward +Z) */}
            <mesh position={[-0.085, 0.01, 0.225]}>
              <sphereGeometry args={[0.036, 10, 10]} />
              <meshStandardMaterial color="#1c1917" roughness={0.2} />
            </mesh>
            <mesh position={[0.085, 0.01, 0.225]}>
              <sphereGeometry args={[0.036, 10, 10]} />
              <meshStandardMaterial color="#1c1917" roughness={0.2} />
            </mesh>
            <mesh position={[-0.072, 0.024, 0.253]}>
              <sphereGeometry args={[0.012, 6, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.098, 0.024, 0.253]}>
              <sphereGeometry args={[0.012, 6, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Warm Rosy Cheeks */}
            <mesh position={[-0.14, -0.04, 0.2]}>
              <sphereGeometry args={[0.028, 8, 8]} />
              <meshStandardMaterial color="#fb7185" roughness={0.6} />
            </mesh>
            <mesh position={[0.14, -0.04, 0.2]}>
              <sphereGeometry args={[0.028, 8, 8]} />
              <meshStandardMaterial color="#fb7185" roughness={0.6} />
            </mesh>
            {/* Friendly Smile */}
            <mesh position={[0, -0.065, 0.235]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.07, 0.02, 0.02]} />
              <meshStandardMaterial color="#7c2d12" roughness={0.5} />
            </mesh>
          </group>

          {/* 9. Khaki Explorer Pith Helmet & Signature Sky-Blue Aviator Goggles */}
          <group position={[0, 1.4, 0]} rotation={[-0.06, 0, 0]}>
            {/* Wide Khaki Helmet Brim */}
            <mesh castShadow={castShadows}>
              <cylinderGeometry args={[0.42, 0.44, 0.045, 20]} />
              <meshStandardMaterial color="#d6c7a1" roughness={0.65} metalness={0.1} />
            </mesh>
            {/* Khaki Dome Crown */}
            <mesh position={[0, 0.02, 0]} castShadow={castShadows}>
              <sphereGeometry args={[0.27, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
              <meshStandardMaterial color="#e5d7b5" roughness={0.6} metalness={0.1} />
            </mesh>
            {/* Dark Brown Leather Hat Band */}
            <mesh position={[0, 0.055, 0]}>
              <cylinderGeometry args={[0.272, 0.278, 0.06, 18]} />
              <meshStandardMaterial color="#451a03" roughness={0.55} />
            </mesh>
            {/* Aviator Goggles Resting on Front of Helmet */}
            <group position={[0, 0.095, 0.24]} rotation={[0.15, 0, 0]}>
              {/* Left Goggle Frame & Glowing Cyan Lens */}
              <mesh position={[-0.085, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.068, 0.068, 0.04, 14]} />
                <meshStandardMaterial color="#78350f" roughness={0.35} metalness={0.7} />
              </mesh>
              <mesh position={[-0.085, 0, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.052, 0.052, 0.025, 14]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  emissive="#0ea5e9"
                  emissiveIntensity={1.1}
                  roughness={0.15}
                  metalness={0.85}
                />
              </mesh>
              {/* Right Goggle Frame & Glowing Cyan Lens */}
              <mesh position={[0.085, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.068, 0.068, 0.04, 14]} />
                <meshStandardMaterial color="#78350f" roughness={0.35} metalness={0.7} />
              </mesh>
              <mesh position={[0.085, 0, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.052, 0.052, 0.025, 14]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  emissive="#0ea5e9"
                  emissiveIntensity={1.1}
                  roughness={0.15}
                  metalness={0.85}
                />
              </mesh>
              {/* Center Goggle Bridge */}
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.06, 0.025, 0.03]} />
                <meshStandardMaterial color="#78350f" roughness={0.4} metalness={0.7} />
              </mesh>
            </group>
          </group>
        </group>
      </group>

      {/* Zero-GC Pooled Dust & Boost Particles */}
      <instancedMesh
        ref={particleMeshRef}
        args={[undefined, undefined, PARTICLE_POOL_SIZE]}
        frustumCulled={false}
      >
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#e0f2fe"
          emissive="#38bdf8"
          emissiveIntensity={0.65}
          roughness={0.4}
          transparent
          opacity={0.85}
        />
      </instancedMesh>
    </>
  );
}
