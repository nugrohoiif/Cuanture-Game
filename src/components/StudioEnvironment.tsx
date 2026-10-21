import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type LightingPreset = 'morning' | 'noon' | 'sunset';

interface StudioEnvironmentProps {
  lightingPreset: LightingPreset;
  castShadows: boolean;
  shadowMapSize?: number;
}

const PRESET_CONFIG: Record<
  LightingPreset,
  {
    sunPosition: [number, number, number];
    keyColor: string;
    keyIntensity: number;
    skyColor: string;
    groundColor: string;
    hemiIntensity: number;
    fogColor: string;
    turbidity: number;
    rayleigh: number;
  }
> = {
  morning: {
    sunPosition: [45, 28, 35],
    keyColor: '#fff3d6',
    keyIntensity: 2.1,
    skyColor: '#bae6fd',
    groundColor: '#1e3a2f',
    hemiIntensity: 0.75,
    fogColor: '#cdeafe',
    turbidity: 2.5,
    rayleigh: 1.2,
  },
  noon: {
    sunPosition: [25, 65, 25],
    keyColor: '#fffbeb',
    keyIntensity: 2.3,
    skyColor: '#7dd3fc',
    groundColor: '#2d5a40',
    hemiIntensity: 0.85,
    fogColor: '#d8f0ff',
    turbidity: 1.8,
    rayleigh: 0.9,
  },
  sunset: {
    sunPosition: [-55, 14, -30],
    keyColor: '#fdba74',
    keyIntensity: 2.0,
    skyColor: '#f472b6',
    groundColor: '#1e293b',
    hemiIntensity: 0.68,
    fogColor: '#fed7aa',
    turbidity: 6.5,
    rayleigh: 2.4,
  },
};

export function StudioEnvironment({
  lightingPreset,
  castShadows,
  shadowMapSize = 1024,
}: StudioEnvironmentProps) {
  const { gl, scene, invalidate } = useThree();
  const cfg = PRESET_CONFIG[lightingPreset];

  // Populate studio PBR reflection environment map once via RoomEnvironment + PMREMGenerator on hardware GPUs
  // Skip in headless software WebGL (castShadows === false) to avoid ReadPixels stalls
  useEffect(() => {
    if (!castShadows) {
      const id = window.setInterval(() => {
        invalidate();
      }, 50);
      return () => window.clearInterval(id);
    }

    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const envScene = new RoomEnvironment();
    const envRenderTarget = pmremGenerator.fromScene(envScene, 0.04);
    scene.environment = envRenderTarget.texture;
    scene.environmentIntensity = 0.55;

    return () => {
      envRenderTarget.dispose();
      pmremGenerator.dispose();
    };
  }, [gl, scene, castShadows, invalidate]);

  return (
    <>
      <color attach="background" args={[cfg.fogColor]} />
      <fog attach="fog" args={[cfg.fogColor, 48, 135]} />

      {/* Drei Procedural Clear Sky Dome */}
      <Sky
        distance={450000}
        sunPosition={cfg.sunPosition}
        turbidity={cfg.turbidity}
        rayleigh={cfg.rayleigh}
        mieCoefficient={0.004}
        mieDirectionalG={0.8}
      />

      {/* Warm/Cool Hemisphere Fill + Ambient Fill */}
      <hemisphereLight
        args={[cfg.skyColor, cfg.groundColor, cfg.hemiIntensity]}
        position={[0, 50, 0]}
      />
      <ambientLight intensity={0.28} color="#f8fafc" />

      {/* Primary Shadow-Casting Directional Sun Key Light */}
      <directionalLight
        position={cfg.sunPosition}
        intensity={cfg.keyIntensity}
        color={cfg.keyColor}
        castShadow={castShadows}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={5}
        shadow-camera-far={130}
        shadow-camera-left={-32}
        shadow-camera-right={32}
        shadow-camera-top={32}
        shadow-camera-bottom={-32}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />

      {/* Subtle Cool Rim Light for Silhouette Separation */}
      <directionalLight
        position={[-30, 18, -25]}
        intensity={0.55}
        color="#38bdf8"
      />
    </>
  );
}
