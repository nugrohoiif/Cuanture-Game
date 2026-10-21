import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getIslandGroundHeight, type CapitalMarketPOI } from '../game/physics';

interface CapitalMarketPOIsProps {
  castShadows: boolean;
  activePOIId: CapitalMarketPOI['id'] | null;
  isModalOpen: boolean;
}

/**
 * Generates a crisp procedural 3D signboard CanvasTexture for a Capital Market POI.
 */
function createPOISignTexture(
  title: string,
  subtitle: string,
  accentHex: string,
  bgHex = '#091322'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 144;
  const ctx = canvas.getContext('2d')!;

  // Background plaque
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer border frame
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  // Title text (constrained to inner plaque width so long titles never clip)
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 40px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title.toUpperCase(), canvas.width / 2, 54, canvas.width - 44);

  // Subtitle text
  ctx.fillStyle = accentHex;
  ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(subtitle.toUpperCase(), canvas.width / 2, 102, canvas.width - 44);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a glowing floating 3D 'Press E to Interact' billboard texture.
 */
function createInteractPromptTexture(accentHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // High-contrast dark slate plaque
  ctx.fillStyle = '#091426';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Glowing golden-amber + accent double border
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Key badge [E]
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(42, 34, 60, 60);
  ctx.fillStyle = '#091426';
  ctx.font = '900 38px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('E', 72, 66);

  // Prompt label
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 36px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Press E to Interact', 292, 65);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const CANDLESTICK_BARS: Array<{
  x: number;
  baseY: number;
  height: number;
  wickHeight: number;
  isBullish: boolean;
}> = [
  { x: -1.08, baseY: -0.22, height: 0.44, wickHeight: 0.72, isBullish: true },
  { x: -0.72, baseY: -0.05, height: 0.52, wickHeight: 0.80, isBullish: true },
  { x: -0.36, baseY: 0.02, height: 0.38, wickHeight: 0.66, isBullish: false },
  { x: 0.0, baseY: -0.10, height: 0.34, wickHeight: 0.62, isBullish: false },
  { x: 0.36, baseY: 0.06, height: 0.56, wickHeight: 0.85, isBullish: true },
  { x: 0.72, baseY: 0.14, height: 0.32, wickHeight: 0.58, isBullish: false },
  { x: 1.08, baseY: 0.26, height: 0.68, wickHeight: 0.98, isBullish: true },
];

export function CapitalMarketPOIs({
  castShadows,
  activePOIId,
  isModalOpen,
}: CapitalMarketPOIsProps) {
  const bursaY = getIslandGroundHeight(-8.5, 1.0);
  const brokerY = getIslandGroundHeight(8.5, 1.0);
  const reksaDanaY = getIslandGroundHeight(0, -10.8);
  const advisorKioskY = getIslandGroundHeight(4.2, 6.8);
  const regulatorY = getIslandGroundHeight(-9.5, -8.5);
  const kpeiY = getIslandGroundHeight(-13.5, 8.2);
  const kseiY = getIslandGroundHeight(9.5, -8.5);
  const sipfY = getIslandGroundHeight(13.5, 8.2);

  const bursaSignTex = useMemo(
    () => createPOISignTexture('Bursa Efek', 'Stock Exchange', '#22c55e', '#0a1936'),
    []
  );
  const brokerSignTex = useMemo(
    () => createPOISignTexture('Perusahaan Sekuritas', 'Securities Broker', '#38bdf8', '#081c2e'),
    []
  );
  const reksaSignTex = useMemo(
    () => createPOISignTexture('Pusat Reksa Dana', 'Mutual Fund Center', '#4ade80', '#0a2618'),
    []
  );
  const advisorSignTex = useMemo(
    () => createPOISignTexture('Financial Advisor Kiosk', 'Risk Profile Assessment', '#fbbf24', '#261707'),
    []
  );
  const regulatorSignTex = useMemo(
    () => createPOISignTexture('OJK & SRO', 'Pusat Regulator Pasar Modal', '#fbbf24', '#450a0a'),
    []
  );
  const kpeiSignTex = useMemo(
    () => createPOISignTexture('KPEI', 'Kliring & Penjaminan', '#2dd4bf', '#082524'),
    []
  );
  const kseiSignTex = useMemo(
    () => createPOISignTexture('KSEI — KUSTODIAN SENTRAL', 'Central Securities Depository', '#fef3c7', '#1e1038'),
    []
  );
  const sipfSignTex = useMemo(
    () => createPOISignTexture('INDONESIA SIPF', 'Dana Perlindungan Pemodal', '#fde047', '#0c243c'),
    []
  );

  const bursaPromptTex = useMemo(() => createInteractPromptTexture('#3b82f6'), []);
  const brokerPromptTex = useMemo(() => createInteractPromptTexture('#38bdf8'), []);
  const reksaPromptTex = useMemo(() => createInteractPromptTexture('#22c55e'), []);
  const advisorPromptTex = useMemo(() => createInteractPromptTexture('#f59e0b'), []);
  const regulatorPromptTex = useMemo(() => createInteractPromptTexture('#ef4444'), []);
  const kpeiPromptTex = useMemo(() => createInteractPromptTexture('#14b8a6'), []);
  const kseiPromptTex = useMemo(() => createInteractPromptTexture('#8b5cf6'), []);
  const sipfPromptTex = useMemo(() => createInteractPromptTexture('#eab308'), []);

  // Refs for subtle living animations on the POIs + floating 3D interaction prompts
  const candlestickRefs = useRef<Array<THREE.Mesh | null>>([]);
  const brokerOrbRef = useRef<THREE.Group>(null);
  const gazeboCrystalRef = useRef<THREE.Mesh>(null);
  const advisorHoloRef = useRef<THREE.Group>(null);
  const regulatorCrestRef = useRef<THREE.Group>(null);
  const regulatorFloatingTextRef = useRef<THREE.Group>(null);
  const kpeiRingsRef = useRef<THREE.Group>(null);
  const kseiCrystalRef = useRef<THREE.Group>(null);
  const sipfShieldRef = useRef<THREE.Group>(null);
  const bursaPromptRef = useRef<THREE.Group>(null);
  const brokerPromptRef = useRef<THREE.Group>(null);
  const reksaPromptRef = useRef<THREE.Group>(null);
  const advisorPromptRef = useRef<THREE.Group>(null);
  const regulatorPromptRef = useRef<THREE.Group>(null);
  const kpeiPromptRef = useRef<THREE.Group>(null);
  const kseiPromptRef = useRef<THREE.Group>(null);
  const sipfPromptRef = useRef<THREE.Group>(null);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = state.clock.elapsedTime;

    // 1. Subtle live pulse on Bursa Efek green & red chart bars
    candlestickRefs.current.forEach((mesh, idx) => {
      if (!mesh) return;
      const pulse = 1 + Math.sin(t * 2.8 + idx * 0.9) * 0.12;
      mesh.scale.y = pulse;
    });

    // 2. Rotate Perusahaan Sekuritas rooftop glass orbital beacon
    if (brokerOrbRef.current) {
      brokerOrbRef.current.rotation.y += dt * 0.85;
    }

    // 3. Gently bob & rotate Pusat Reksa Dana gazebo growth crystal
    if (gazeboCrystalRef.current) {
      gazeboCrystalRef.current.rotation.y += dt * 0.9;
      gazeboCrystalRef.current.position.y = 1.42 + Math.sin(t * 2.0) * 0.12;
    }

    // 4. Rotate Financial Advisor Kiosk risk-compass hologram
    if (advisorHoloRef.current) {
      advisorHoloRef.current.rotation.y += dt * 1.1;
      advisorHoloRef.current.position.y = 1.55 + Math.sin(t * 2.5) * 0.07;
    }

    // 5. Rotate Pusat Regulator sovereign golden crest & gently bob floating 'OJK & SRO' 3D text
    if (regulatorCrestRef.current) {
      regulatorCrestRef.current.rotation.y += dt * 0.75;
    }
    if (regulatorFloatingTextRef.current) {
      regulatorFloatingTextRef.current.position.y = 5.45 + Math.sin(t * 2.2) * 0.10;
    }

    // 6. Rotate KPEI interlocking clearing & settlement guarantee rings
    if (kpeiRingsRef.current) {
      kpeiRingsRef.current.rotation.y += dt * 0.9;
    }

    // 7. Rotate & gently levitate KSEI electronic securities depository data crystal
    if (kseiCrystalRef.current) {
      kseiCrystalRef.current.rotation.y += dt * 0.95;
      kseiCrystalRef.current.position.y = 5.18 + Math.sin(t * 2.3) * 0.08;
    }

    // 8. Rotate & gently bob Indonesia SIPF golden investor protection shield crest
    if (sipfShieldRef.current) {
      sipfShieldRef.current.rotation.y += dt * 0.85;
      sipfShieldRef.current.position.y = 5.18 + Math.sin(t * 2.1) * 0.08;
    }

    // 9. Floating 3D 'Press E to Interact' prompt bobbing animation above active building
    const floatOffset = Math.sin(t * 3.6) * 0.14;
    if (bursaPromptRef.current) {
      bursaPromptRef.current.position.y = 5.75 + floatOffset;
    }
    if (brokerPromptRef.current) {
      brokerPromptRef.current.position.y = 6.05 + floatOffset;
    }
    if (reksaPromptRef.current) {
      reksaPromptRef.current.position.y = 5.65 + floatOffset;
    }
    if (advisorPromptRef.current) {
      advisorPromptRef.current.position.y = 4.25 + floatOffset;
    }
    if (regulatorPromptRef.current) {
      regulatorPromptRef.current.position.y = 6.65 + floatOffset;
    }
    if (kpeiPromptRef.current) {
      kpeiPromptRef.current.position.y = 6.45 + floatOffset;
    }
    if (kseiPromptRef.current) {
      kseiPromptRef.current.position.y = 6.12 + floatOffset;
    }
    if (sipfPromptRef.current) {
      sipfPromptRef.current.position.y = 6.12 + floatOffset;
    }
  });

  // Branch stepping stones from main path to Bursa Efek (-8.5, 1.0), Perusahaan Sekuritas (8.5, 1.0), KPEI (-13.5, 8.2), KSEI (9.5, -8.5), and Indonesia SIPF (13.5, 8.2)
  const branchStones = useMemo(() => {
    const list: Array<{ x: number; y: number; z: number }> = [];
    const xSteps = [-3.0, -4.4, -5.8, 3.0, 4.4, 5.8];
    xSteps.forEach((x) => {
      const z = 2.6 - Math.abs(x) * 0.18;
      list.push({ x, y: getIslandGroundHeight(x, z) + 0.025, z });
    });
    // Southwest branch stepping stones leading from Arrival Plaza toward KPEI (-13.5, 8.2)
    const kpeiSteps: Array<[number, number]> = [
      [-3.2, 7.6],
      [-5.6, 7.9],
      [-8.0, 8.2],
      [-10.2, 8.5],
    ];
    kpeiSteps.forEach(([x, z]) => {
      list.push({ x, y: getIslandGroundHeight(x, z) + 0.025, z });
    });
    // Northeast branch stepping stones leading toward KSEI (9.5, -8.5)
    const kseiSteps: Array<[number, number]> = [
      [3.2, -5.2],
      [5.0, -5.8],
      [6.8, -6.3],
    ];
    kseiSteps.forEach(([x, z]) => {
      list.push({ x, y: getIslandGroundHeight(x, z) + 0.025, z });
    });
    // Southeast branch stepping stones leading from Arrival Plaza / Advisor Kiosk toward Indonesia SIPF (13.5, 8.2)
    const sipfSteps: Array<[number, number]> = [
      [6.6, 7.8],
      [8.5, 8.1],
      [10.3, 8.4],
    ];
    sipfSteps.forEach(([x, z]) => {
      list.push({ x, y: getIslandGroundHeight(x, z) + 0.025, z });
    });
    return list;
  }, []);

  const isBursaActive = activePOIId === 'bursa-efek';
  const isBrokerActive = activePOIId === 'perusahaan-sekuritas';
  const isReksaActive = activePOIId === 'pusat-reksa-dana';
  const isAdvisorActive = activePOIId === 'financial-advisor-kiosk';
  const isRegulatorActive = activePOIId === 'pusat-regulator';
  const isKpeiActive = activePOIId === 'kpei';
  const isKseiActive = activePOIId === 'ksei';
  const isSipfActive = activePOIId === 'indonesia-sipf';

  return (
    <group name="capital-market-pois">
      {/* Branch Stepping Stones to Bursa Efek & Perusahaan Sekuritas */}
      {branchStones.map((st, i) => (
        <mesh key={`poi-stone-${i}`} position={[st.x, st.y, st.z]} receiveShadow={castShadows}>
          <cylinderGeometry args={[0.72, 0.78, 0.08, 7]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.78} metalness={0.12} />
        </mesh>
      ))}

      {/* =====================================================================
          POI 5: PUSAT REGULATOR (REGULATOR CENTER — OJK & SRO)
          A grand, authoritative monumental marble, crimson-garnet, and sovereign
          gold citadel crowned with a rotunda dome and floating 'OJK & SRO' 3D text.
      ===================================================================== */}
      <group
        name="poi-pusat-regulator"
        position={[-9.5, regulatorY, -8.5]}
        rotation={[0, 0.52, 0]}
      >
        {/* Circular Ground Zone Indicator Ring */}
        <mesh position={[0, 0.025, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.8, isRegulatorActive ? 4.3 : 4.1, 36]} />
          <meshBasicMaterial
            color={isRegulatorActive ? '#fbbf24' : '#ef4444'}
            transparent
            opacity={isRegulatorActive ? 0.92 : 0.58}
            depthWrite={false}
          />
        </mesh>

        {/* 1. Monumental Stepped Marble & Garnet Podium Foundation */}
        <mesh position={[0, 0.18, 0]} receiveShadow={castShadows} castShadow={castShadows}>
          <boxGeometry args={[5.2, 0.36, 4.2]} />
          <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.22} />
        </mesh>
        <mesh position={[0, 0.44, 0.12]} receiveShadow={castShadows} castShadow={castShadows}>
          <boxGeometry args={[4.7, 0.22, 3.7]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.55} metalness={0.32} />
        </mesh>

        {/* 2. Authoritative Sovereign Hall & Crimson-Gold Facade */}
        <mesh position={[0, 2.15, -0.3]} castShadow={castShadows} receiveShadow={castShadows}>
          <boxGeometry args={[4.2, 3.2, 2.5]} />
          <meshStandardMaterial color="#991b1b" roughness={0.48} metalness={0.3} />
        </mesh>
        {/* Marble Corner Bastions */}
        <mesh position={[-2.0, 2.15, -0.3]} castShadow={castShadows}>
          <boxGeometry args={[0.45, 3.35, 2.65]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.45} metalness={0.2} />
        </mesh>
        <mesh position={[2.0, 2.15, -0.3]} castShadow={castShadows}>
          <boxGeometry args={[0.45, 3.35, 2.65]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.45} metalness={0.2} />
        </mesh>

        {/* 3. Six Classical Fluted Marble Portico Columns */}
        {[-1.65, -0.99, -0.33, 0.33, 0.99, 1.65].map((colX, idx) => (
          <mesh
            key={`regulator-col-${idx}`}
            position={[colX, 1.95, 1.25]}
            castShadow={castShadows}
          >
            <cylinderGeometry args={[0.15, 0.18, 2.85, 12]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} metalness={0.25} />
          </mesh>
        ))}

        {/* Sovereign Pediment Entablature & Golden Frieze */}
        <mesh position={[0, 3.52, 0.1]} castShadow={castShadows}>
          <boxGeometry args={[4.75, 0.42, 3.5]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.4} metalness={0.28} />
        </mesh>
        <mesh position={[0, 3.76, 1.86]}>
          <boxGeometry args={[4.78, 0.1, 0.08]} />
          <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.8} roughness={0.22} metalness={0.9} />
        </mesh>

        {/* 4. Sovereign Rotunda Drum & Golden Dome Crown */}
        <mesh position={[0, 4.05, -0.15]} castShadow={castShadows}>
          <cylinderGeometry args={[1.45, 1.6, 0.65, 20]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.45} metalness={0.35} />
        </mesh>
        <mesh position={[0, 4.45, -0.15]} castShadow={castShadows}>
          <sphereGeometry args={[1.32, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.24} metalness={0.85} />
        </mesh>

        {/* Rotating Golden Scales-of-Governance Crest */}
        <group ref={regulatorCrestRef} position={[0, 2.35, 1.38]}>
          <mesh>
            <torusGeometry args={[0.48, 0.05, 10, 28]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1.5} roughness={0.2} metalness={0.9} />
          </mesh>
          <mesh>
            <octahedronGeometry args={[0.26, 0]} />
            <meshStandardMaterial color="#fef08a" emissive="#fbbf24" emissiveIntensity={2.0} />
          </mesh>
        </group>

        {/* 5. Permanent Floating 3D Text Above Building Saying 'OJK & SRO' */}
        <group ref={regulatorFloatingTextRef} position={[0, 5.45, 0.35]}>
          <mesh>
            <boxGeometry args={[3.8, 1.02, 0.14]} />
            <meshBasicMaterial map={regulatorSignTex} />
          </mesh>
        </group>

        {/* 6. Floating 3D 'Press E to Interact' Prompt When Player Approaches */}
        {isRegulatorActive && !isModalOpen && (
          <group ref={regulatorPromptRef} position={[0, 6.65, 0.35]}>
            <mesh>
              <boxGeometry args={[3.3, 0.82, 0.12]} />
              <meshBasicMaterial map={regulatorPromptTex} />
            </mesh>
          </group>
        )}
      </group>

      {/* =====================================================================
          POI 0: FINANCIAL ADVISOR KIOSK (NEAR PLAYER SPAWN)
          A welcoming consultation booth & desk near the Arrival Plaza where
          players take the 3-question Investment Risk Profile Assessment.
      ===================================================================== */}
      <group
        name="poi-financial-advisor-kiosk"
        position={[4.2, advisorKioskY, 6.8]}
        rotation={[0, -0.58, 0]}
      >
        {/* Circular Ground Zone Indicator Ring */}
        <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.3, isAdvisorActive ? 2.75 : 2.55, 28]} />
          <meshBasicMaterial
            color={isAdvisorActive ? '#fbbf24' : '#f59e0b'}
            transparent
            opacity={isAdvisorActive ? 0.92 : 0.55}
            depthWrite={false}
          />
        </mesh>

        {/* 1. Circular Kiosk Platform Base */}
        <mesh position={[0, 0.08, 0]} receiveShadow={castShadows} castShadow={castShadows}>
          <cylinderGeometry args={[1.85, 2.0, 0.16, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.25} />
        </mesh>
        <mesh position={[0, 0.17, 0]} receiveShadow={castShadows}>
          <cylinderGeometry args={[1.6, 1.65, 0.05, 16]} />
          <meshStandardMaterial color="#78350f" roughness={0.65} metalness={0.15} />
        </mesh>

        {/* 2. Consultation Desk / Reception Booth Counter */}
        <mesh position={[0, 0.66, 0.25]} castShadow={castShadows} receiveShadow={castShadows}>
          <boxGeometry args={[1.95, 0.92, 0.85]} />
          <meshStandardMaterial color="#92400e" roughness={0.6} metalness={0.18} />
        </mesh>
        {/* Polished Amber-Gold Countertop */}
        <mesh position={[0, 1.15, 0.25]} castShadow={castShadows}>
          <boxGeometry args={[2.12, 0.1, 0.98]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.65} />
        </mesh>
        {/* Front Glowing Emblem Plaque on Desk */}
        <mesh position={[0, 0.68, 0.69]}>
          <boxGeometry args={[1.35, 0.46, 0.04]} />
          <meshStandardMaterial color="#0f172a" emissive="#f59e0b" emissiveIntensity={0.45} />
        </mesh>

        {/* 3. Interactive Risk Assessment Hologram & Terminal Screen on Desk */}
        <group ref={advisorHoloRef} position={[0, 1.55, 0.25]}>
          <mesh>
            <octahedronGeometry args={[0.24, 0]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#f59e0b"
              emissiveIntensity={2.0}
              roughness={0.15}
              metalness={0.85}
            />
          </mesh>
          <mesh rotation={[Math.PI / 3, 0, 0]}>
            <torusGeometry args={[0.38, 0.035, 8, 24]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={1.5} />
          </mesh>
        </group>

        {/* 4. Four Brass Kiosk Canopy Support Pillars & Striped Gold Canopy Roof */}
        {[
          [-1.15, -0.75],
          [1.15, -0.75],
          [-1.15, 0.75],
          [1.15, 0.75],
        ].map(([px, pz], idx) => (
          <mesh key={`kiosk-post-${idx}`} position={[px, 1.45, pz]} castShadow={castShadows}>
            <cylinderGeometry args={[0.07, 0.08, 2.55, 10]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.35} metalness={0.75} />
          </mesh>
        ))}

        {/* Kiosk Awning Roof */}
        <mesh position={[0, 2.85, 0]} rotation={[0, Math.PI / 4, 0]} castShadow={castShadows}>
          <coneGeometry args={[2.1, 0.82, 4]} />
          <meshStandardMaterial color="#d97706" roughness={0.45} metalness={0.3} />
        </mesh>

        {/* 5. Rooftop Signboard: FINANCIAL ADVISOR KIOSK */}
        <mesh position={[0, 3.45, 0.35]}>
          <boxGeometry args={[2.85, 0.78, 0.12]} />
          <meshBasicMaterial map={advisorSignTex} />
        </mesh>

        {/* 6. Floating 3D 'Press E to Interact' Prompt Above Kiosk */}
        {isAdvisorActive && !isModalOpen && (
          <group ref={advisorPromptRef} position={[0, 4.25, 0.35]}>
            <mesh>
              <boxGeometry args={[2.75, 0.68, 0.1]} />
              <meshBasicMaterial map={advisorPromptTex} />
            </mesh>
          </group>
        )}
      </group>

      {/* =====================================================================
          POI 1: BURSA EFEK (STOCK EXCHANGE)
          A deep royal-blue neo-classical building with a glowing green & red
          candlestick and trendline chart mounted on its front facade.
      ===================================================================== */}
      <group
        name="poi-bursa-efek"
        position={[-8.5, bursaY, 1.0]}
        rotation={[0, 0.46, 0]}
      >
        {/* Circular Ground Zone Indicator Ring (offset >= 0.02 on Y) */}
        <mesh position={[0, 0.025, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.6, isBursaActive ? 4.05 : 3.9, 32]} />
          <meshBasicMaterial
            color={isBursaActive ? '#fbbf24' : '#3b82f6'}
            transparent
            opacity={isBursaActive ? 0.9 : 0.55}
            depthWrite={false}
          />
        </mesh>

        {/* 1. Stepped Stone & Cobalt Plinth Foundation */}
        <mesh position={[0, 0.16, 0]} receiveShadow={castShadows} castShadow={castShadows}>
          <boxGeometry args={[4.8, 0.32, 3.9]} />
          <meshStandardMaterial color="#1e293b" roughness={0.75} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.38, 0.1]} receiveShadow={castShadows} castShadow={castShadows}>
          <boxGeometry args={[4.3, 0.18, 3.5]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.6} metalness={0.3} />
        </mesh>

        {/* 2. Primary Silhouette: Deep Royal Blue Stock Exchange Hall */}
        <mesh position={[0, 2.1, -0.35]} castShadow={castShadows} receiveShadow={castShadows}>
          <boxGeometry args={[3.9, 3.3, 2.4]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.48} metalness={0.35} />
        </mesh>

        {/* Royal Blue Side Pilasters */}
        <mesh position={[-1.85, 2.1, -0.35]} castShadow={castShadows}>
          <boxGeometry args={[0.38, 3.4, 2.55]} />
          <meshStandardMaterial color="#1e40af" roughness={0.55} metalness={0.4} />
        </mesh>
        <mesh position={[1.85, 2.1, -0.35]} castShadow={castShadows}>
          <boxGeometry args={[0.38, 3.4, 2.55]} />
          <meshStandardMaterial color="#1e40af" roughness={0.55} metalness={0.4} />
        </mesh>

        {/* 3. Secondary Read: 4 Classical Portico Columns + Blue Canopy Roof */}
        {[-1.35, -0.45, 0.45, 1.35].map((colX, idx) => (
          <mesh
            key={`bursa-col-${idx}`}
            position={[colX, 1.85, 1.15]}
            castShadow={castShadows}
          >
            <cylinderGeometry args={[0.16, 0.19, 2.8, 12]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.5} metalness={0.25} />
          </mesh>
        ))}

        {/* Portico Entablature & Blue Pediment Roof */}
        <mesh position={[0, 3.45, 0.05]} castShadow={castShadows}>
          <boxGeometry args={[4.4, 0.45, 3.4]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.42} metalness={0.45} />
        </mesh>
        <mesh position={[0, 3.82, 0.05]} castShadow={castShadows}>
          <boxGeometry args={[3.8, 0.32, 2.9]} />
          <meshStandardMaterial color="#2563eb" roughness={0.35} metalness={0.55} />
        </mesh>
        {/* Golden Roof Trim */}
        <mesh position={[0, 3.68, 1.76]}>
          <boxGeometry args={[4.42, 0.08, 0.06]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.25} metalness={0.85} />
        </mesh>

        {/* 4. ACCENT DETAIL: GLOWING GREEN & RED MARKET CHART ON FACADE */}
        <group position={[0, 2.25, 1.36]}>
          {/* Dark Obsidian Chart Display Backing Frame */}
          <mesh>
            <boxGeometry args={[3.15, 1.52, 0.14]} />
            <meshStandardMaterial color="#09111e" roughness={0.25} metalness={0.75} />
          </mesh>
          {/* Blue-Gold Display Bezel */}
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[3.28, 1.64, 0.1]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.8} />
          </mesh>

          {/* Horizontal Chart Grid Lines */}
          {[-0.45, 0, 0.45].map((gy, i) => (
            <mesh key={`grid-${i}`} position={[0, gy, 0.08]}>
              <boxGeometry args={[2.85, 0.02, 0.02]} />
              <meshBasicMaterial color="#1e3a8a" />
            </mesh>
          ))}

          {/* Glowing Green (Bullish) and Red (Bearish) 3D Candlestick Bars + Wicks */}
          {CANDLESTICK_BARS.map((bar, idx) => {
            const colorHex = bar.isBullish ? '#22c55e' : '#ef4444';
            const emissiveHex = bar.isBullish ? '#16a34a' : '#dc2626';
            return (
              <group key={`candle-${idx}`} position={[bar.x, bar.baseY, 0.11]}>
                {/* High-Low Wick */}
                <mesh>
                  <boxGeometry args={[0.04, bar.wickHeight, 0.03]} />
                  <meshStandardMaterial
                    color={colorHex}
                    emissive={emissiveHex}
                    emissiveIntensity={1.6}
                  />
                </mesh>
                {/* Solid Glowing Candlestick Body */}
                <mesh
                  ref={(el) => {
                    candlestickRefs.current[idx] = el;
                  }}
                >
                  <boxGeometry args={[0.21, bar.height, 0.08]} />
                  <meshStandardMaterial
                    color={colorHex}
                    emissive={emissiveHex}
                    emissiveIntensity={2.2}
                    roughness={0.18}
                    metalness={0.5}
                  />
                </mesh>
              </group>
            );
          })}

          {/* Glowing Green Uptrend & Red Pullback Line Segments */}
          <mesh position={[-0.82, -0.05, 0.16]} rotation={[0, 0, 0.48]}>
            <boxGeometry args={[0.72, 0.055, 0.04]} />
            <meshStandardMaterial color="#4ade80" emissive="#22c55e" emissiveIntensity={2.4} />
          </mesh>
          <mesh position={[-0.18, -0.04, 0.16]} rotation={[0, 0, -0.38]}>
            <boxGeometry args={[0.68, 0.055, 0.04]} />
            <meshStandardMaterial color="#f87171" emissive="#ef4444" emissiveIntensity={2.4} />
          </mesh>
          <mesh position={[0.62, 0.22, 0.16]} rotation={[0, 0, 0.55]}>
            <boxGeometry args={[1.05, 0.06, 0.04]} />
            <meshStandardMaterial color="#4ade80" emissive="#22c55e" emissiveIntensity={2.5} />
          </mesh>
        </group>

        {/* 5. Rooftop Signboard: BURSA EFEK · STOCK EXCHANGE */}
        <mesh position={[0, 4.55, 0.35]}>
          <boxGeometry args={[3.7, 1.02, 0.14]} />
          <meshBasicMaterial map={bursaSignTex} />
        </mesh>

        {/* 6. Floating 3D Interaction Text Above Building when Player is in Proximity */}
        {isBursaActive && !isModalOpen && (
          <group ref={bursaPromptRef} position={[0, 5.75, 0.35]}>
            <mesh>
              <boxGeometry args={[3.3, 0.82, 0.12]} />
              <meshBasicMaterial map={bursaPromptTex} />
            </mesh>
          </group>
        )}
      </group>

      {/* =====================================================================
          POI 2: PERUSAHAAN SEKURITAS (BROKER)
          A sleek modern architectural glass-like tower with reflective/transmissive
          sky-cyan glass curtain walls, brushed metallic mullions, and sky-fins.
      ===================================================================== */}
      <group
        name="poi-perusahaan-sekuritas"
        position={[8.5, brokerY, 1.0]}
        rotation={[0, -0.46, 0]}
      >
        {/* Circular Ground Zone Indicator Ring */}
        <mesh position={[0, 0.025, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.6, isBrokerActive ? 4.05 : 3.9, 32]} />
          <meshBasicMaterial
            color={isBrokerActive ? '#fbbf24' : '#38bdf8'}
            transparent
            opacity={isBrokerActive ? 0.9 : 0.55}
            depthWrite={false}
          />
        </mesh>

        {/* 1. Modern Polished Architectural Podium */}
        <mesh position={[0, 0.15, 0]} receiveShadow={castShadows} castShadow={castShadows}>
          <boxGeometry args={[4.5, 0.3, 3.8]} />
          <meshStandardMaterial color="#334155" roughness={0.45} metalness={0.5} />
        </mesh>
        {/* Glowing Cyan Podium Edge Strip */}
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[4.1, 0.06, 3.4]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.5} />
        </mesh>

        {/* 2. Interior Illuminated Tower Core & Floor Plates (visible through the glass facade) */}
        <mesh position={[-0.25, 2.35, -0.15]}>
          <boxGeometry args={[1.95, 3.9, 1.55]} />
          <meshStandardMaterial
            color="#e0f2fe"
            emissive="#0284c7"
            emissiveIntensity={0.75}
            roughness={0.3}
          />
        </mesh>
        {[1.1, 1.9, 2.7, 3.5].map((flY, i) => (
          <mesh key={`broker-floor-${i}`} position={[-0.25, flY, -0.15]}>
            <boxGeometry args={[2.55, 0.08, 2.15]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.75} />
          </mesh>
        ))}

        {/* 3. Primary Silhouette: Main Glass Curtain-Wall Tower + Offset Glass Atrium Wing */}
        <mesh position={[-0.25, 2.4, -0.15]} castShadow={castShadows}>
          <boxGeometry args={[2.7, 4.2, 2.3]} />
          <meshPhysicalMaterial
            color="#7dd3fc"
            emissive="#0369a1"
            emissiveIntensity={0.32}
            roughness={0.08}
            metalness={0.18}
            transmission={0.62}
            thickness={0.8}
            ior={1.52}
            reflectivity={0.95}
            transparent
            opacity={0.78}
          />
        </mesh>

        {/* Offset Secondary Glass Wing */}
        <mesh position={[1.15, 1.85, 0.25]} castShadow={castShadows}>
          <boxGeometry args={[1.55, 3.1, 1.85]} />
          <meshPhysicalMaterial
            color="#bae6fd"
            emissive="#0284c7"
            emissiveIntensity={0.38}
            roughness={0.06}
            metalness={0.22}
            transmission={0.65}
            transparent
            opacity={0.82}
          />
        </mesh>

        {/* 4. Secondary Read: Brushed Aluminum Structural Mullion Fins */}
        {[-1.58, -0.7, 0.18, 1.05, 1.9].map((finX, idx) => (
          <mesh
            key={`mullion-${idx}`}
            position={[finX, 2.1, 1.08]}
            castShadow={castShadows}
          >
            <boxGeometry args={[0.09, 3.6, 0.14]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.22} metalness={0.88} />
          </mesh>
        ))}

        {/* Cantilevered Glass & Brushed Steel Entrance Canopy */}
        <mesh position={[0.2, 1.25, 1.48]} castShadow={castShadows}>
          <boxGeometry args={[2.6, 0.1, 0.85]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            emissive="#0ea5e9"
            emissiveIntensity={0.6}
            roughness={0.1}
            metalness={0.4}
            transparent
            opacity={0.88}
          />
        </mesh>

        {/* 5. Accent Detail: Rooftop Rotating Glass & Gold Orbital FinTech Beacon */}
        <group ref={brokerOrbRef} position={[-0.25, 4.9, -0.15]}>
          <mesh rotation={[Math.PI / 4, 0, 0]}>
            <torusGeometry args={[0.55, 0.045, 10, 28]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.4} roughness={0.2} metalness={0.85} />
          </mesh>
          <mesh>
            <octahedronGeometry args={[0.28, 0]} />
            <meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={2.0} />
          </mesh>
        </group>

        {/* 6. Rooftop Signboard: PERUSAHAAN SEKURITAS · BROKER */}
        <mesh position={[0.2, 4.85, 0.75]}>
          <boxGeometry args={[3.9, 1.02, 0.14]} />
          <meshBasicMaterial map={brokerSignTex} />
        </mesh>

        {/* 7. Floating 3D Interaction Text Above Building when Player is in Proximity */}
        {isBrokerActive && !isModalOpen && (
          <group ref={brokerPromptRef} position={[0.2, 6.05, 0.75]}>
            <mesh>
              <boxGeometry args={[3.3, 0.82, 0.12]} />
              <meshBasicMaterial map={brokerPromptTex} />
            </mesh>
          </group>
        )}
      </group>

      {/* =====================================================================
          POI 3: PUSAT REKSA DANA (MUTUAL FUND CENTER)
          A peaceful botanical green zone with ornamental trees, stone lanterns,
          and a small octagonal timber & emerald-roofed gazebo.
      ===================================================================== */}
      <group
        name="poi-pusat-reksa-dana"
        position={[0, reksaDanaY, -10.8]}
      >
        {/* 1. Peaceful Botanical Green Zone Lawn & Stone Garden Border */}
        <mesh position={[0, 0.03, 0]} receiveShadow={castShadows}>
          <cylinderGeometry args={[5.0, 5.2, 0.08, 32]} />
          <meshStandardMaterial color="#2d6a4f" roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0.06, 0]} receiveShadow={castShadows}>
          <cylinderGeometry args={[4.2, 4.4, 0.06, 28]} />
          <meshStandardMaterial color="#40916c" roughness={0.8} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0.095, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.35, isReksaActive ? 4.8 : 4.65, 32]} />
          <meshBasicMaterial
            color={isReksaActive ? '#fbbf24' : '#4ade80'}
            transparent
            opacity={isReksaActive ? 0.9 : 0.55}
            depthWrite={false}
          />
        </mesh>

        {/* 2. Small Octagonal Wooden & Emerald Gazebo at Center */}
        <group position={[0, 0.08, 0]}>
          {/* Stepped Teakwood Gazebo Deck */}
          <mesh position={[0, 0.12, 0]} receiveShadow={castShadows} castShadow={castShadows}>
            <cylinderGeometry args={[2.35, 2.55, 0.24, 8]} />
            <meshStandardMaterial color="#8b5a2b" roughness={0.75} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0.28, 0]} receiveShadow={castShadows}>
            <cylinderGeometry args={[2.05, 2.15, 0.12, 8]} />
            <meshStandardMaterial color="#a06b3b" roughness={0.7} metalness={0.12} />
          </mesh>

          {/* 6 Timber Gazebo Columns */}
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const angle = (idx / 6) * Math.PI * 2 + Math.PI / 6;
            const px = Math.cos(angle) * 1.78;
            const pz = Math.sin(angle) * 1.78;
            return (
              <mesh
                key={`gazebo-post-${idx}`}
                position={[px, 1.35, pz]}
                castShadow={castShadows}
              >
                <cylinderGeometry args={[0.11, 0.13, 2.15, 8]} />
                <meshStandardMaterial color="#6f4e37" roughness={0.8} metalness={0.08} />
              </mesh>
            );
          })}

          {/* Dual-Tiered Emerald Pagoda Gazebo Roof */}
          <mesh position={[0, 2.65, 0]} rotation={[0, Math.PI / 8, 0]} castShadow={castShadows}>
            <coneGeometry args={[2.75, 0.95, 8]} />
            <meshStandardMaterial color="#15803d" roughness={0.55} metalness={0.18} />
          </mesh>
          <mesh position={[0, 3.25, 0]} rotation={[0, Math.PI / 8, 0]} castShadow={castShadows}>
            <coneGeometry args={[1.85, 0.85, 8]} />
            <meshStandardMaterial color="#22c55e" roughness={0.48} metalness={0.22} />
          </mesh>
          {/* Golden Lotus Finial Spire */}
          <mesh position={[0, 3.82, 0]}>
            <octahedronGeometry args={[0.26, 0]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1.2} roughness={0.2} metalness={0.9} />
          </mesh>

          {/* Tranquil Mutual Fund Growth Pedestal & Levitating Emerald Crystal inside Gazebo */}
          <mesh position={[0, 0.62, 0]} castShadow={castShadows}>
            <cylinderGeometry args={[0.45, 0.58, 0.58, 8]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.6} metalness={0.2} />
          </mesh>
          <mesh ref={gazeboCrystalRef} position={[0, 1.42, 0]}>
            <octahedronGeometry args={[0.36, 0]} />
            <meshStandardMaterial
              color="#86efac"
              emissive="#22c55e"
              emissiveIntensity={2.0}
              roughness={0.15}
              metalness={0.85}
            />
          </mesh>
        </group>

        {/* 3. Peaceful Sanctuary Trees & Ornamental Bushes Flanking the Gazebo */}
        {[
          { x: -3.4, z: 1.8, scale: 0.88, canopyColor: '#52b788', topColor: '#95d5b2' },
          { x: 3.4, z: 1.8, scale: 0.88, canopyColor: '#52b788', topColor: '#95d5b2' },
          { x: -3.6, z: -2.2, scale: 1.02, canopyColor: '#2d6a4f', topColor: '#74c69d' },
          { x: 3.6, z: -2.2, scale: 1.02, canopyColor: '#2d6a4f', topColor: '#74c69d' },
        ].map((gt, idx) => (
          <group
            key={`sanctuary-tree-${idx}`}
            position={[gt.x, 0.06, gt.z]}
            scale={[gt.scale, gt.scale, gt.scale]}
          >
            {/* Contact Shadow */}
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.95, 14]} />
              <meshBasicMaterial color="#09150e" transparent opacity={0.35} depthWrite={false} />
            </mesh>
            {/* Trunk */}
            <mesh position={[0, 0.75, 0]} castShadow={castShadows}>
              <cylinderGeometry args={[0.15, 0.24, 1.4, 7]} />
              <meshStandardMaterial color="#6f4e37" roughness={0.85} />
            </mesh>
            {/* Rounded Peaceful Canopy Layers */}
            <mesh position={[0, 1.65, 0]} castShadow={castShadows}>
              <dodecahedronGeometry args={[0.92, 0]} />
              <meshStandardMaterial color={gt.canopyColor} roughness={0.6} />
            </mesh>
            <mesh position={[0, 2.35, 0]} castShadow={castShadows}>
              <dodecahedronGeometry args={[0.68, 0]} />
              <meshStandardMaterial color={gt.topColor} roughness={0.52} />
            </mesh>
          </group>
        ))}

        {/* 4. Gazebo Signboard: PUSAT REKSA DANA · MUTUAL FUND */}
        <mesh position={[0, 4.45, 0.6]}>
          <boxGeometry args={[3.8, 1.02, 0.14]} />
          <meshBasicMaterial map={reksaSignTex} />
        </mesh>

        {/* 5. Floating 3D Interaction Text Above Building when Player is in Proximity */}
        {isReksaActive && !isModalOpen && (
          <group ref={reksaPromptRef} position={[0, 5.65, 0.6]}>
            <mesh>
              <boxGeometry args={[3.3, 0.82, 0.12]} />
              <meshBasicMaterial map={reksaPromptTex} />
            </mesh>
          </group>
        )}
      </group>

      {/* =====================================================================
          POI 6: KPEI — KLIRING DAN PENJAMINAN (CLEARING & GUARANTEE)
          A sleek, symmetrical teal-emerald & sovereign-gold Clearing House vault
          with twin Buyer/Seller settlement bastions, a glowing Netting ledger matrix,
          and rotating interlocking Clearing & Guarantee rings on the roof.
      ===================================================================== */}
      <group
        name="poi-kpei"
        position={[-13.5, kpeiY, 8.2]}
        rotation={[0, 0.56, 0]}
      >
        {/* Circular Ground Zone Indicator Ring (offset >= 0.02 on Y) */}
        <mesh position={[0, 0.025, 0.35]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.4, isKpeiActive ? 3.9 : 3.7, 32]} />
          <meshBasicMaterial
            color={isKpeiActive ? '#fbbf24' : '#14b8a6'}
            transparent
            opacity={isKpeiActive ? 0.92 : 0.56}
            depthWrite={false}
          />
        </mesh>

        {/* 1. Stepped Slate & Teal-Emerald Clearing House Podium */}
        <mesh position={[0, 0.16, 0]} receiveShadow={castShadows} castShadow={castShadows}>
          <boxGeometry args={[4.5, 0.32, 3.7]} />
          <meshStandardMaterial color="#1e293b" roughness={0.72} metalness={0.25} />
        </mesh>
        <mesh position={[0, 0.36, 0.08]} receiveShadow={castShadows} castShadow={castShadows}>
          <boxGeometry args={[4.05, 0.16, 3.3]} />
          <meshStandardMaterial color="#115e59" roughness={0.52} metalness={0.35} />
        </mesh>

        {/* 2. Primary Silhouette: Central Clearing Vault & Twin Buyer/Seller Settlement Bastions */}
        <mesh position={[0, 2.05, -0.25]} castShadow={castShadows} receiveShadow={castShadows}>
          <boxGeometry args={[3.6, 3.2, 2.3]} />
          <meshStandardMaterial color="#0f766e" roughness={0.46} metalness={0.35} />
        </mesh>

        {/* Left & Right Symmetrical Settlement Bastions (Buyer & Seller Counterparties) */}
        <mesh position={[-1.72, 2.05, -0.15]} castShadow={castShadows}>
          <boxGeometry args={[0.52, 3.32, 2.5]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.35} metalness={0.65} />
        </mesh>
        <mesh position={[1.72, 2.05, -0.15]} castShadow={castShadows}>
          <boxGeometry args={[0.52, 3.32, 2.5]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.35} metalness={0.65} />
        </mesh>

        {/* 3. Secondary Read: Four Brushed Silver-Teal Clearing Columns & Dual-Bridge Roof */}
        {[-1.2, -0.4, 0.4, 1.2].map((colX, idx) => (
          <mesh
            key={`kpei-col-${idx}`}
            position={[colX, 1.85, 1.15]}
            castShadow={castShadows}
          >
            <cylinderGeometry args={[0.14, 0.17, 2.75, 12]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.38} metalness={0.55} />
          </mesh>
        ))}

        {/* Clearing House Entablature & Crowned Teal-Gold Roof */}
        <mesh position={[0, 3.4, 0.05]} castShadow={castShadows}>
          <boxGeometry args={[4.2, 0.4, 3.2]} />
          <meshStandardMaterial color="#134e4a" roughness={0.42} metalness={0.45} />
        </mesh>
        <mesh position={[0, 3.74, 0.05]} castShadow={castShadows}>
          <boxGeometry args={[3.5, 0.28, 2.65]} />
          <meshStandardMaterial color="#14b8a6" roughness={0.32} metalness={0.55} />
        </mesh>
        {/* Golden Guarantee Trim Strip */}
        <mesh position={[0, 3.6, 1.66]}>
          <boxGeometry args={[4.22, 0.08, 0.06]} />
          <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.75} roughness={0.22} metalness={0.88} />
        </mesh>

        {/* 4. Accent Detail: Front Facade 'Netting & Clearing Verification Matrix' Panel */}
        <group position={[0, 2.15, 1.28]}>
          <mesh>
            <boxGeometry args={[2.75, 1.32, 0.12]} />
            <meshStandardMaterial color="#042f2e" roughness={0.25} metalness={0.75} />
          </mesh>
          {/* Glowing Teal Ledger Bars (Matched Buy & Sell Settlement Rows) */}
          {[-0.34, 0, 0.34].map((rowY, i) => (
            <group key={`kpei-ledger-row-${i}`} position={[0, rowY, 0.07]}>
              <mesh position={[-0.65, 0, 0]}>
                <boxGeometry args={[0.95, 0.14, 0.04]} />
                <meshStandardMaterial color="#2dd4bf" emissive="#14b8a6" emissiveIntensity={1.8} />
              </mesh>
              <mesh position={[0, 0, 0.01]}>
                <octahedronGeometry args={[0.1, 0]} />
                <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={2.0} />
              </mesh>
              <mesh position={[0.65, 0, 0]}>
                <boxGeometry args={[0.95, 0.14, 0.04]} />
                <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.8} />
              </mesh>
            </group>
          ))}
        </group>

        {/* 5. Rooftop Signboard: KPEI · KLIRING & PENJAMINAN */}
        <mesh position={[0, 4.32, 0.55]}>
          <boxGeometry args={[3.7, 1.02, 0.14]} />
          <meshBasicMaterial map={kpeiSignTex} />
        </mesh>

        {/* Rooftop Crown Pedestal & Rotating Dual Interlocking Clearing & Guarantee Rings (CCP Symbol) */}
        <mesh position={[0, 4.98, 0.15]} castShadow={castShadows}>
          <cylinderGeometry args={[0.28, 0.38, 0.28, 12]} />
          <meshStandardMaterial color="#134e4a" roughness={0.4} metalness={0.5} />
        </mesh>
        <group ref={kpeiRingsRef} position={[0, 5.45, 0.15]}>
          <mesh position={[-0.22, 0, 0]} rotation={[0.35, 0, 0]}>
            <torusGeometry args={[0.42, 0.055, 10, 28]} />
            <meshStandardMaterial
              color="#2dd4bf"
              emissive="#14b8a6"
              emissiveIntensity={1.6}
              roughness={0.2}
              metalness={0.85}
            />
          </mesh>
          <mesh position={[0.22, 0, 0]} rotation={[-0.35, Math.PI / 2, 0]}>
            <torusGeometry args={[0.42, 0.055, 10, 28]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={1.6}
              roughness={0.2}
              metalness={0.85}
            />
          </mesh>
          <mesh>
            <octahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial color="#ccfbf1" emissive="#2dd4bf" emissiveIntensity={2.2} />
          </mesh>
        </group>

        {/* 6. Floating 3D Interaction Text Above Building when Player is in Proximity */}
        {isKpeiActive && !isModalOpen && (
          <group ref={kpeiPromptRef} position={[0, 6.45, 0.35]}>
            <mesh>
              <boxGeometry args={[3.3, 0.82, 0.12]} />
              <meshBasicMaterial map={kpeiPromptTex} />
            </mesh>
          </group>
        )}
      </group>

      {/* =====================================================================
          POI 7: KSEI — KUSTODIAN SENTRAL (CENTRAL SECURITIES DEPOSITORY)
          An indigo-violet & white-gold Digital Securities Depository vault
          featuring a glowing electronic scrip/data core crystal, SID & AKSes
          digital custody ledger nodes, and a 3D 'KSEI — KUSTODIAN SENTRAL' signboard.
      ===================================================================== */}
      <group
        name="poi-ksei"
        position={[9.5, kseiY, -8.5]}
        rotation={[0, -0.52, 0]}
      >
        {/* Circular Ground Zone Indicator Ring (offset >= 0.02 on Y) */}
        <mesh position={[0, 0.025, 0.35]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.4, isKseiActive ? 3.9 : 3.7, 32]} />
          <meshBasicMaterial
            color={isKseiActive ? '#fbbf24' : '#8b5cf6'}
            transparent
            opacity={isKseiActive ? 0.92 : 0.58}
            depthWrite={false}
          />
        </mesh>

        {/* 1. Stepped Dark Slate & Indigo-Violet Depository Foundation */}
        <mesh position={[0, 0.16, 0]} receiveShadow={castShadows} castShadow={castShadows}>
          <boxGeometry args={[4.5, 0.32, 3.7]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.68} metalness={0.28} />
        </mesh>
        <mesh position={[0, 0.36, 0.08]} receiveShadow={castShadows} castShadow={castShadows}>
          <boxGeometry args={[4.05, 0.16, 3.3]} />
          <meshStandardMaterial color="#4c1d95" roughness={0.5} metalness={0.38} />
        </mesh>

        {/* 2. Primary Silhouette: Indigo-Violet Digital Securities Depository Vault */}
        <mesh position={[0, 2.08, -0.25]} castShadow={castShadows} receiveShadow={castShadows}>
          <boxGeometry args={[3.65, 3.25, 2.35]} />
          <meshStandardMaterial color="#5b21b6" roughness={0.44} metalness={0.36} />
        </mesh>

        {/* White-Gold Corner Custody Vault Pillars */}
        <mesh position={[-1.74, 2.08, -0.2]} castShadow={castShadows}>
          <boxGeometry args={[0.48, 3.36, 2.5]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.32} metalness={0.62} />
        </mesh>
        <mesh position={[1.74, 2.08, -0.2]} castShadow={castShadows}>
          <boxGeometry args={[0.48, 3.36, 2.5]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.32} metalness={0.62} />
        </mesh>

        {/* 3. Secondary Read: Four White-Gold Fluted Custody Columns & Octagonal Vault Crown */}
        {[-1.2, -0.4, 0.4, 1.2].map((colX, idx) => (
          <mesh
            key={`ksei-col-${idx}`}
            position={[colX, 1.85, 1.15]}
            castShadow={castShadows}
          >
            <cylinderGeometry args={[0.14, 0.17, 2.75, 12]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.35} metalness={0.48} />
          </mesh>
        ))}

        {/* Indigo-Violet Entablature & White-Gold Trim */}
        <mesh position={[0, 3.42, 0.05]} castShadow={castShadows}>
          <boxGeometry args={[4.2, 0.4, 3.2]} />
          <meshStandardMaterial color="#3b0764" roughness={0.4} metalness={0.45} />
        </mesh>
        <mesh position={[0, 3.76, 0.05]} castShadow={castShadows}>
          <boxGeometry args={[3.5, 0.28, 2.65]} />
          <meshStandardMaterial color="#6d28d9" roughness={0.34} metalness={0.52} />
        </mesh>
        <mesh position={[0, 3.62, 1.66]}>
          <boxGeometry args={[4.22, 0.08, 0.06]} />
          <meshStandardMaterial color="#fef3c7" emissive="#fde68a" emissiveIntensity={0.85} roughness={0.2} metalness={0.9} />
        </mesh>

        {/* 4. Accent Detail: Front Facade Electronic Securities Ledger (SID · RDN · AKSes KSEI) */}
        <group position={[0, 2.15, 1.28]}>
          <mesh>
            <boxGeometry args={[2.75, 1.34, 0.12]} />
            <meshStandardMaterial color="#170d2b" roughness={0.22} metalness={0.78} />
          </mesh>
          {/* Central Glowing Digital Vault Core & Flanking Electronic Scrip Nodes */}
          <mesh position={[0, 0, 0.08]}>
            <octahedronGeometry args={[0.32, 0]} />
            <meshStandardMaterial color="#ddd6fe" emissive="#a855f7" emissiveIntensity={2.1} roughness={0.15} metalness={0.85} />
          </mesh>
          {[-0.34, 0, 0.34].map((rowY, i) => (
            <group key={`ksei-node-row-${i}`} position={[0, rowY, 0.07]}>
              <mesh position={[-0.82, 0, 0]}>
                <boxGeometry args={[0.72, 0.13, 0.04]} />
                <meshStandardMaterial color="#c4b5fd" emissive="#8b5cf6" emissiveIntensity={1.7} />
              </mesh>
              <mesh position={[0.82, 0, 0]}>
                <boxGeometry args={[0.72, 0.13, 0.04]} />
                <meshStandardMaterial color="#fef3c7" emissive="#f59e0b" emissiveIntensity={1.6} />
              </mesh>
            </group>
          ))}
        </group>

        {/* 5. Rooftop Signboard: KSEI — KUSTODIAN SENTRAL */}
        <mesh position={[0, 4.22, 0.55]}>
          <boxGeometry args={[3.9, 0.98, 0.14]} />
          <meshBasicMaterial map={kseiSignTex} />
        </mesh>

        {/* Rooftop Pedestal & Levitating Electronic Securities Data Crystal (kseiCrystalRef) */}
        <mesh position={[0, 4.78, 0.12]} castShadow={castShadows}>
          <cylinderGeometry args={[0.3, 0.4, 0.24, 8]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.3} metalness={0.75} />
        </mesh>
        <group ref={kseiCrystalRef} position={[0, 5.18, 0.12]}>
          <mesh>
            <octahedronGeometry args={[0.32, 0]} />
            <meshStandardMaterial
              color="#ede9fe"
              emissive="#8b5cf6"
              emissiveIntensity={2.2}
              roughness={0.14}
              metalness={0.88}
            />
          </mesh>
          <mesh rotation={[Math.PI / 3, 0, 0]}>
            <torusGeometry args={[0.46, 0.038, 8, 24]} />
            <meshStandardMaterial
              color="#fef3c7"
              emissive="#fde68a"
              emissiveIntensity={1.5}
              roughness={0.2}
              metalness={0.9}
            />
          </mesh>
        </group>

        {/* 6. Floating 3D Interaction Text Above Building when Player is in Proximity */}
        {isKseiActive && !isModalOpen && (
          <group ref={kseiPromptRef} position={[0, 6.12, 0.35]}>
            <mesh>
              <boxGeometry args={[3.3, 0.82, 0.12]} />
              <meshBasicMaterial map={kseiPromptTex} />
            </mesh>
          </group>
        )}
      </group>

      {/* =====================================================================
          POI 8: INDONESIA SIPF — DANA PERLINDUNGAN PEMODAL (INVESTOR PROTECTION FUND)
          A royal sapphire-navy, platinum-silver, and sovereign gold Asset
          Protection Sanctuary featuring a glowing Investor Protection Shield
          facade emblem, a rotating golden Aegis Shield rooftop crest, and a
          3D 'INDONESIA SIPF · Dana Perlindungan Pemodal' signboard.
      ===================================================================== */}
      <group
        name="poi-indonesia-sipf"
        position={[13.5, sipfY, 8.2]}
        rotation={[0, -0.56, 0]}
      >
        {/* Circular Ground Zone Indicator Ring (offset >= 0.02 on Y) */}
        <mesh position={[0, 0.025, 0.35]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.4, isSipfActive ? 3.9 : 3.7, 32]} />
          <meshBasicMaterial
            color={isSipfActive ? '#fde047' : '#eab308'}
            transparent
            opacity={isSipfActive ? 0.92 : 0.62}
            depthWrite={false}
          />
        </mesh>

        {/* 1. Stepped Royal Sapphire-Slate & Golden Rim Sanctuary Foundation */}
        <mesh position={[0, 0.16, 0]} receiveShadow={castShadows} castShadow={castShadows}>
          <boxGeometry args={[4.5, 0.32, 3.7]} />
          <meshStandardMaterial color="#0f172a" roughness={0.65} metalness={0.32} />
        </mesh>
        <mesh position={[0, 0.36, 0.08]} receiveShadow={castShadows} castShadow={castShadows}>
          <boxGeometry args={[4.05, 0.16, 3.3]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.48} metalness={0.42} />
        </mesh>

        {/* 2. Primary Silhouette: Deep Sapphire-Navy Asset Protection Sanctuary */}
        <mesh position={[0, 2.08, -0.25]} castShadow={castShadows} receiveShadow={castShadows}>
          <boxGeometry args={[3.65, 3.25, 2.35]} />
          <meshStandardMaterial color="#172554" roughness={0.42} metalness={0.38} />
        </mesh>

        {/* Platinum-Gold Corner Protection Bastions */}
        <mesh position={[-1.74, 2.08, -0.2]} castShadow={castShadows}>
          <boxGeometry args={[0.48, 3.36, 2.5]} />
          <meshStandardMaterial color="#fef08a" roughness={0.3} metalness={0.68} />
        </mesh>
        <mesh position={[1.74, 2.08, -0.2]} castShadow={castShadows}>
          <boxGeometry args={[0.48, 3.36, 2.5]} />
          <meshStandardMaterial color="#fef08a" roughness={0.3} metalness={0.68} />
        </mesh>

        {/* 3. Secondary Read: Four Platinum-Silver Fluted Guardian Columns & Shielded Canopy */}
        {[-1.2, -0.4, 0.4, 1.2].map((colX, idx) => (
          <mesh
            key={`sipf-col-${idx}`}
            position={[colX, 1.85, 1.15]}
            castShadow={castShadows}
          >
            <cylinderGeometry args={[0.14, 0.17, 2.75, 12]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.34} metalness={0.55} />
          </mesh>
        ))}

        {/* Sapphire-Gold Entablature & Protective Aegis Roof Crown */}
        <mesh position={[0, 3.42, 0.05]} castShadow={castShadows}>
          <boxGeometry args={[4.2, 0.4, 3.2]} />
          <meshStandardMaterial color="#0c243c" roughness={0.4} metalness={0.48} />
        </mesh>
        <mesh position={[0, 3.76, 0.05]} castShadow={castShadows}>
          <boxGeometry args={[3.5, 0.28, 2.65]} />
          <meshStandardMaterial color="#ca8a04" roughness={0.3} metalness={0.68} />
        </mesh>
        <mesh position={[0, 3.62, 1.66]}>
          <boxGeometry args={[4.22, 0.08, 0.06]} />
          <meshStandardMaterial color="#fde047" emissive="#eab308" emissiveIntensity={0.9} roughness={0.2} metalness={0.9} />
        </mesh>

        {/* 4. Accent Detail: Front Facade 'Investor Protection Shield' Emblem */}
        <group position={[0, 2.15, 1.28]}>
          <mesh>
            <boxGeometry args={[2.75, 1.34, 0.12]} />
            <meshStandardMaterial color="#091526" roughness={0.22} metalness={0.78} />
          </mesh>
          {/* Central Hexagonal Protection Shield Plaque */}
          <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.08, 6]} />
            <meshStandardMaterial color="#fde047" emissive="#ca8a04" emissiveIntensity={1.65} roughness={0.2} metalness={0.88} />
          </mesh>
          <mesh position={[0, 0, 0.13]}>
            <octahedronGeometry args={[0.22, 0]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={2.0} roughness={0.15} metalness={0.85} />
          </mesh>
          {/* Flanking Safekeeping Protection Bars */}
          {[-0.28, 0.28].map((rowY, i) => (
            <group key={`sipf-shield-bar-${i}`} position={[0, rowY, 0.07]}>
              <mesh position={[-0.86, 0, 0]}>
                <boxGeometry args={[0.68, 0.14, 0.04]} />
                <meshStandardMaterial color="#fde047" emissive="#eab308" emissiveIntensity={1.7} />
              </mesh>
              <mesh position={[0.86, 0, 0]}>
                <boxGeometry args={[0.68, 0.14, 0.04]} />
                <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.7} />
              </mesh>
            </group>
          ))}
        </group>

        {/* 5. Rooftop Signboard: INDONESIA SIPF · DANA PERLINDUNGAN PEMODAL */}
        <mesh position={[0, 4.22, 0.55]}>
          <boxGeometry args={[3.9, 0.98, 0.14]} />
          <meshBasicMaterial map={sipfSignTex} />
        </mesh>

        {/* Rooftop Pedestal & Rotating Golden Investor Protection Aegis Shield (sipfShieldRef) */}
        <mesh position={[0, 4.78, 0.12]} castShadow={castShadows}>
          <cylinderGeometry args={[0.3, 0.4, 0.24, 8]} />
          <meshStandardMaterial color="#fde047" roughness={0.28} metalness={0.78} />
        </mesh>
        <group ref={sipfShieldRef} position={[0, 5.18, 0.12]}>
          {/* Outer Golden Guardian Ring */}
          <mesh>
            <torusGeometry args={[0.42, 0.05, 10, 28]} />
            <meshStandardMaterial
              color="#fde047"
              emissive="#eab308"
              emissiveIntensity={1.85}
              roughness={0.18}
              metalness={0.9}
            />
          </mesh>
          {/* Inner Sapphire-Gold Protection Shield Core */}
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <octahedronGeometry args={[0.28, 0]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#f59e0b"
              emissiveIntensity={2.1}
              roughness={0.15}
              metalness={0.88}
            />
          </mesh>
        </group>

        {/* 6. Floating 3D Interaction Text Above Building when Player is in Proximity */}
        {isSipfActive && !isModalOpen && (
          <group ref={sipfPromptRef} position={[0, 6.12, 0.35]}>
            <mesh>
              <boxGeometry args={[3.3, 0.82, 0.12]} />
              <meshBasicMaterial map={sipfPromptTex} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
}
