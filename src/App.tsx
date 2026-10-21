/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createInitialPlayerState,
  getIslandGroundHeight,
  getCapitalMarketPOIStatus,
  loadInitialGameSettings,
  sanitizeGameSettings,
  serializeGameSettings,
  DEFAULT_GAME_SETTINGS,
  SETTINGS_STORAGE_KEY,
  SPAWN_POINT,
  type AetherShard,
  type CapitalMarketPOI,
  type GameSettings,
  type PlayerPhysicsState,
} from './game/physics';
import { createInitialShards } from './game/worldData';
import { gameInput } from './game/input';
import { soundFX } from './game/sound';
import { StudioEnvironment, type LightingPreset } from './components/StudioEnvironment';
import { FloatingIsland } from './components/FloatingIsland';
import { CapitalMarketPOIs } from './components/CapitalMarketPOIs';
import { PlayerCharacter, type TelemetrySnapshot } from './components/PlayerCharacter';
import { FollowCamera } from './components/FollowCamera';
import { GameHUD } from './components/GameHUD';
import { OpeningSplash } from './components/OpeningSplash';
import { RotateDeviceOverlay } from './components/RotateDeviceOverlay';
import { isMobilePortrait } from './game/deviceOrientation';
import { MarketProvider } from './game/MarketContext';

export default function App() {
  return (
    <MarketProvider>
      <GameContent />
    </MarketProvider>
  );
}

function GameContent() {
  const isHeadless = useMemo(
    () =>
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent)),
    []
  );

  const initialAutoStart = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') === '1';
  }, []);

  // Mobile visitors must rotate before seeing any usable start controls.
  // Even ?autostart=1 cannot bypass the portrait gate.
  const [needsRotation, setNeedsRotation] = useState(isMobilePortrait);
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'gameover'>(
    initialAutoStart && !isMobilePortrait() ? 'playing' : 'title'
  );
  const [isVisible, setIsVisible] = useState<boolean>(
    !initialAutoStart || isMobilePortrait()
  );
  const [freeRoam, setFreeRoam] = useState(false);
  const [nearbyPOI, setNearbyPOI] = useState<CapitalMarketPOI | null>(null);
  const [activeModalPOI, setActiveModalPOI] = useState<CapitalMarketPOI | null>(null);
  const [cameraMode, setCameraMode] = useState<'follow' | 'orbit'>('follow');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('morning');
  const [isMuted, setIsMuted] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(() =>
    loadInitialGameSettings(typeof window !== 'undefined' ? window.localStorage : null)
  );
  const [shards, setShards] = useState<AetherShard[]>(() => createInitialShards());
  const [lastCollectedShardName, setLastCollectedShardName] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [victorySnapshot, setVictorySnapshot] = useState<{
    clearTime: number;
    peakSpeed: number;
    respawns: number;
  } | null>(null);

  const [telemetry, setTelemetry] = useState<TelemetrySnapshot>(() => ({
    x: SPAWN_POINT.x,
    y: getIslandGroundHeight(SPAWN_POINT.x, SPAWN_POINT.z),
    z: SPAWN_POINT.z,
    yaw: Math.PI,
    speed: 0,
    peakSpeed: 0,
    stamina: 100,
    isGrounded: true,
    respawnCount: 0,
  }));

  // Mutable simulation refs decoupled from React reconciliation
  const playerStateRef = useRef<PlayerPhysicsState>(createInitialPlayerState());
  const cameraYawRef = useRef<number>(0); // Camera sits on +Z looking toward -Z (north vista)
  const shardsRef = useRef<AetherShard[]>(shards);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  // Detect changes immediately when a phone rotates, including on mobile Safari.
  useEffect(() => {
    const orientationQuery = window.matchMedia?.('(orientation: portrait)');
    const pointerQuery = window.matchMedia?.('(pointer: coarse)');
    const updateRotationGate = () => setNeedsRotation(isMobilePortrait());

    orientationQuery?.addEventListener?.('change', updateRotationGate);
    pointerQuery?.addEventListener?.('change', updateRotationGate);
    window.addEventListener('resize', updateRotationGate);
    window.addEventListener('orientationchange', updateRotationGate);
    updateRotationGate();

    return () => {
      orientationQuery?.removeEventListener?.('change', updateRotationGate);
      pointerQuery?.removeEventListener?.('change', updateRotationGate);
      window.removeEventListener('resize', updateRotationGate);
      window.removeEventListener('orientationchange', updateRotationGate);
    };
  }, []);

  // A player who rotates back to portrait is paused until they return to
  // landscape. Prevent held joystick/keyboard input from moving the player.
  useEffect(() => {
    if (!needsRotation) return;
    gameInput.clearAll();
    setGameState((current) => current === 'playing' ? 'paused' : current);
  }, [needsRotation]);

  // Sync document.body.dataset.state with gameState
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Run timer during active gameplay (paused when educational modal is open)
  useEffect(() => {
    if (gameState !== 'playing' || activeModalPOI || needsRotation) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [gameState, activeModalPOI, needsRotation]);

  const handleDismissSplash = useCallback(() => {
    if (needsRotation || isMobilePortrait()) return;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setIsVisible(false);
  }, [needsRotation]);

  const handleStartGame = useCallback(() => {
    if (needsRotation || isMobilePortrait()) return;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (!soundFX.muted) {
      soundFX.startMusic();
    }
    gameInput.clearAll();
    setIsVisible(false);
    document.body.dataset.state = 'playing';
    setGameState('playing');
    setFreeRoam(false);
  }, [needsRotation]);

  const handleResumeGame = useCallback(() => {
    if (needsRotation || isMobilePortrait()) return;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    gameInput.clearAll();
    document.body.dataset.state = 'playing';
    setGameState('playing');
  }, [needsRotation]);

  const handleOpenPOIModal = useCallback(() => {
    if (!nearbyPOI) return;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    gameInput.clearAll();
    soundFX.playInteract();
    setActiveModalPOI(nearbyPOI);
  }, [nearbyPOI]);

  const handleClosePOIModal = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    gameInput.clearAll();
    setActiveModalPOI(null);
  }, []);

  const handleResetPlayer = useCallback(() => {
    const fresh = createInitialPlayerState();
    playerStateRef.current = fresh;
    cameraYawRef.current = 0;
    gameInput.clearAll();
    setNearbyPOI(null);
    setActiveModalPOI(null);
    setTelemetry({
      x: fresh.x,
      y: fresh.y,
      z: fresh.z,
      yaw: fresh.yaw,
      speed: 0,
      peakSpeed: fresh.peakSpeed,
      stamina: 100,
      isGrounded: true,
      respawnCount: fresh.respawnCount,
    });
    if (gameState === 'paused') {
      document.body.dataset.state = 'playing';
      setGameState('playing');
    }
  }, [gameState]);

  const handleRestartRun = useCallback(() => {
    if (needsRotation || isMobilePortrait()) return;
    const freshPlayer = createInitialPlayerState();
    const freshShards = createInitialShards();
    playerStateRef.current = freshPlayer;
    shardsRef.current = freshShards;
    cameraYawRef.current = 0;
    gameInput.clearAll();
    setNearbyPOI(null);
    setActiveModalPOI(null);
    setShards(freshShards);
    setElapsedSeconds(0);
    setVictorySnapshot(null);
    setLastCollectedShardName(null);
    setFreeRoam(false);
    document.body.dataset.state = 'playing';
    setGameState('playing');
  }, [needsRotation]);

  const handleReturnTitle = useCallback(() => {
    gameInput.clearAll();
    setActiveModalPOI(null);
    setFreeRoam(false);
    document.body.dataset.state = 'title';
    setGameState('title');
  }, []);

  const handleToggleCameraMode = useCallback(() => {
    setCameraMode((prev) => (prev === 'follow' ? 'orbit' : 'follow'));
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundFX.setMuted(next);
      if (!next) {
        soundFX.startMusic();
      }
      return next;
    });
  }, []);

  // Sync settings to soundFX.volume and localStorage ('aether_isle_settings')
  useEffect(() => {
    soundFX.setVolume(settings.audioVolume);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, serializeGameSettings(settings));
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [settings]);

  const handleUpdateSettings = useCallback((patch: Partial<GameSettings>) => {
    setSettings((prev) => sanitizeGameSettings({ ...prev, ...patch }));
  }, []);

  const handleResetSettings = useCallback(() => {
    setSettings({ ...DEFAULT_GAME_SETTINGS });
  }, []);

  const effectiveCastShadows = !isHeadless && settings.graphicsQuality !== 'low';
  const effectiveDpr: number | [number, number] =
    isHeadless || settings.graphicsQuality === 'low'
      ? 1
      : settings.graphicsQuality === 'medium'
        ? [1, 1.5]
        : [1, 2];
  const shadowMapSize = settings.graphicsQuality === 'high' ? 2048 : 1024;

  // Global keyboard listeners (WASD, E interact, Space, Shift, Enter/Space on title, Esc/P pause, C camera, R reset)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (needsRotation || isMobilePortrait()) {
        gameInput.clearAll();
        return;
      }
      if (gameState === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          if (isVisible) {
            if (!soundFX.muted) {
              soundFX.startMusic();
            }
            soundFX.playInteract();
            handleDismissSplash();
          } else {
            handleStartGame();
          }
        }
        return;
      }

      // When an educational POI modal is open, 'Escape' or 'KeyE' closes it and resumes movement
      if (activeModalPOI) {
        if (e.code === 'Escape' || e.code === 'KeyE') {
          e.preventDefault();
          handleClosePOIModal();
        }
        return;
      }

      // Press 'E' when near a Capital Market building to pause movement and open its educational modal
      if (e.code === 'KeyE' && (gameState === 'playing' || freeRoam)) {
        if (nearbyPOI) {
          e.preventDefault();
          handleOpenPOIModal();
          return;
        }
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameState === 'playing') {
          gameInput.clearAll();
          document.body.dataset.state = 'paused';
          setGameState('paused');
          return;
        } else if (gameState === 'paused') {
          handleResumeGame();
          return;
        }
      }

      if (e.code === 'KeyC' && (gameState === 'playing' || freeRoam)) {
        handleToggleCameraMode();
        return;
      }

      if (e.code === 'KeyR' && (gameState === 'playing' || freeRoam)) {
        handleResetPlayer();
        return;
      }

      if (e.code === 'KeyM') {
        handleToggleMute();
        return;
      }

      gameInput.handleKeyDown(e);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      gameInput.handleKeyUp(e);
    };

    const onBlur = () => {
      gameInput.clearAll();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        gameInput.clearAll();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [
    gameState,
    needsRotation,
    isVisible,
    freeRoam,
    nearbyPOI,
    activeModalPOI,
    handleDismissSplash,
    handleStartGame,
    handleResumeGame,
    handleOpenPOIModal,
    handleClosePOIModal,
    handleToggleCameraMode,
    handleResetPlayer,
    handleToggleMute,
  ]);

  const handleShardCollected = useCallback(
    (updatedShards: AetherShard[], newlyCollectedIds: string[]) => {
      setShards(updatedShards);
      const lastShard = updatedShards.find(
        (s) => s.id === newlyCollectedIds[newlyCollectedIds.length - 1]
      );
      if (lastShard) {
        setLastCollectedShardName(lastShard.name);
      }

      const allCollected = updatedShards.every((s) => s.collected);
      if (allCollected) {
        soundFX.playVictory();
        setVictorySnapshot({
          clearTime: elapsedSeconds,
          peakSpeed: playerStateRef.current.peakSpeed,
          respawns: playerStateRef.current.respawnCount,
        });
        document.body.dataset.state = 'gameover';
        setGameState('gameover');
      }
    },
    [elapsedSeconds]
  );

  const handleVisitPOI = useCallback((poi: CapitalMarketPOI) => {
    let targetX = poi.x;
    let targetZ = poi.z + 3.0;
    let targetYaw = Math.PI;
    let targetCamYaw = 0;

    if (poi.id === 'financial-advisor-kiosk') {
      targetX = poi.x - 1.4;
      targetZ = poi.z + 1.9;
      targetYaw = 2.55;
      targetCamYaw = -0.58;
    } else if (poi.id === 'bursa-efek') {
      targetX = poi.x + 1.5;
      targetZ = poi.z + 3.1;
      targetYaw = -2.68;
      targetCamYaw = 0.46;
    } else if (poi.id === 'perusahaan-sekuritas') {
      targetX = poi.x - 1.5;
      targetZ = poi.z + 3.1;
      targetYaw = 2.68;
      targetCamYaw = -0.46;
    } else if (poi.id === 'pusat-reksa-dana') {
      targetX = -1.6;
      targetZ = poi.z + 3.4;
      targetYaw = 2.85;
      targetCamYaw = -0.32;
    } else if (poi.id === 'pusat-regulator') {
      targetX = poi.x + 1.8;
      targetZ = poi.z + 3.2;
      targetYaw = -2.62;
      targetCamYaw = 0.52;
    } else if (poi.id === 'kpei') {
      targetX = poi.x + 1.8;
      targetZ = poi.z + 3.0;
      targetYaw = -2.58;
      targetCamYaw = 0.56;
    } else if (poi.id === 'ksei') {
      targetX = poi.x - 1.8;
      targetZ = poi.z + 3.2;
      targetYaw = 2.62;
      targetCamYaw = -0.52;
    } else if (poi.id === 'indonesia-sipf') {
      targetX = poi.x - 1.8;
      targetZ = poi.z + 3.0;
      targetYaw = 2.58;
      targetCamYaw = -0.56;
    }

    const groundY = getIslandGroundHeight(targetX, targetZ);
    playerStateRef.current = {
      ...playerStateRef.current,
      x: targetX,
      y: groundY,
      z: targetZ,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: targetYaw,
      isGrounded: true,
    };
    cameraYawRef.current = targetCamYaw;
    gameInput.clearAll();
    const detected = getCapitalMarketPOIStatus(targetX, targetZ).activePOI;
    setNearbyPOI(detected);
    setTelemetry((prev) => ({
      ...prev,
      x: targetX,
      y: groundY,
      z: targetZ,
      yaw: targetYaw,
      speed: 0,
      isGrounded: true,
    }));
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0b1524]" style={{ height: '100dvh' }}>
      <div className="absolute inset-0" inert={needsRotation} aria-hidden={needsRotation}>
      {/* Isolated Full-Screen 3D WebGL Viewport Container */}
      <div
        ref={canvasWrapperRef}
        data-testid="game-canvas-container"
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
      >
        <Canvas
          frameloop={isHeadless || needsRotation ? 'demand' : 'always'}
          shadows={effectiveCastShadows}
          dpr={effectiveDpr}
          camera={{ position: [0, 6.5, 18.5], fov: 52, near: 0.1, far: 250 }}
          gl={{
            antialias: !isHeadless && settings.graphicsQuality !== 'low',
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
        >
          <StudioEnvironment
            lightingPreset={lightingPreset}
            castShadows={effectiveCastShadows}
            shadowMapSize={shadowMapSize}
          />

          <FloatingIsland
            shards={shards}
            castShadows={effectiveCastShadows}
          />

          <CapitalMarketPOIs
            castShadows={effectiveCastShadows}
            activePOIId={nearbyPOI?.id ?? null}
            isModalOpen={Boolean(activeModalPOI)}
          />

          <PlayerCharacter
            gameState={gameState}
            freeRoam={freeRoam && !needsRotation}
            isInteractionModalOpen={Boolean(activeModalPOI)}
            playerStateRef={playerStateRef}
            cameraYawRef={cameraYawRef}
            shardsRef={shardsRef}
            castShadows={effectiveCastShadows}
            onShardCollected={handleShardCollected}
            onProximityChange={setNearbyPOI}
            onTelemetryUpdate={setTelemetry}
          />

          <FollowCamera
            gameState={gameState}
            cameraMode={cameraMode}
            playerStateRef={playerStateRef}
            cameraYawRef={cameraYawRef}
            cameraSensitivity={settings.cameraSensitivity}
            zoomSpeed={settings.zoomSpeed}
          />
        </Canvas>
      </div>

      {/* Conditional Opening Splash Screen */}
      {gameState === 'title' && isVisible && (
        <OpeningSplash
          isVisible={isVisible}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onStartAdventure={handleDismissSplash}
        />
      )}

      {/* World-Matched HUD & Game State Overlays */}
      <GameHUD
        gameState={gameState}
        isSplashVisible={isVisible}
        freeRoam={freeRoam}
        shards={shards}
        telemetry={telemetry}
        nearbyPOI={nearbyPOI}
        activeModalPOI={activeModalPOI}
        cameraMode={cameraMode}
        lightingPreset={lightingPreset}
        isMuted={isMuted}
        settings={settings}
        elapsedSeconds={elapsedSeconds}
        victorySnapshot={victorySnapshot}
        lastCollectedShardName={lastCollectedShardName}
        onStartGame={handleStartGame}
        onResumeGame={handleResumeGame}
        onPauseToggle={() => {
          if (needsRotation || isMobilePortrait()) return;
          if (activeModalPOI) {
            handleClosePOIModal();
            return;
          }
          if (gameState === 'playing') {
            gameInput.clearAll();
            document.body.dataset.state = 'paused';
            setGameState('paused');
          } else if (gameState === 'paused') {
            handleResumeGame();
          }
        }}
        onResetPlayer={handleResetPlayer}
        onVisitPOI={handleVisitPOI}
        onOpenPOIModal={handleOpenPOIModal}
        onClosePOIModal={handleClosePOIModal}
        onRestartRun={handleRestartRun}
        onEnterFreeRoam={() => {
          if (needsRotation || isMobilePortrait()) return;
          setFreeRoam(true);
          document.body.dataset.state = 'playing';
          setGameState('playing');
        }}
        onReturnTitle={handleReturnTitle}
        onToggleCameraMode={handleToggleCameraMode}
        onChangeLighting={setLightingPreset}
        onToggleMute={handleToggleMute}
        onDismissSplash={handleDismissSplash}
        onUpdateSettings={handleUpdateSettings}
        onResetSettings={handleResetSettings}
      />
      </div>
      {needsRotation && <RotateDeviceOverlay />}
    </main>
  );
}
