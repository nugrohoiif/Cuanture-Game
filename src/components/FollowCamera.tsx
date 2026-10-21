import { useRef, useEffect, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  computeFollowCameraTarget,
  dampValue,
  normalizeAngle,
  MIN_CAMERA_DISTANCE,
  MAX_CAMERA_DISTANCE,
  MIN_CAMERA_PITCH,
  MAX_CAMERA_PITCH,
  type PlayerPhysicsState,
} from '../game/physics';
import { gameInput } from '../game/input';

interface FollowCameraProps {
  gameState: 'title' | 'playing' | 'paused' | 'gameover';
  cameraMode: 'follow' | 'orbit';
  playerStateRef: MutableRefObject<PlayerPhysicsState>;
  cameraYawRef: MutableRefObject<number>;
  cameraSensitivity?: number;
  zoomSpeed?: number;
}

// Pre-allocated module-scope vectors to avoid GC inside useFrame
const _desiredPos = new THREE.Vector3();
const _desiredLookAt = new THREE.Vector3();

function clampCameraPitch(pitch: number): number {
  return Math.max(MIN_CAMERA_PITCH, Math.min(MAX_CAMERA_PITCH, pitch));
}

function clampCameraDistance(dist: number): number {
  return Math.max(MIN_CAMERA_DISTANCE, Math.min(MAX_CAMERA_DISTANCE, dist));
}

/**
 * Smooth Follow Camera with Free Camera Control (Desktop & Mobile):
 * - Desktop: Right-click + mouse drag rotates horizontally (yaw) and vertically (pitch);
 *   Mouse scroll wheel zooms in/out within [MIN_CAMERA_DISTANCE, MAX_CAMERA_DISTANCE].
 * - Mobile: Touch & drag on the 3D viewport rotates camera, 2-finger pinch or '+' / '-' buttons
 *   adjust zoom distance while Virtual Joystick & UI buttons remain isolated.
 */
export function FollowCamera({
  gameState,
  cameraMode,
  playerStateRef,
  cameraYawRef,
  cameraSensitivity = 1.0,
  zoomSpeed = 1.0,
}: FollowCameraProps) {
  const { camera, gl, invalidate } = useThree();

  const smoothCamPosRef = useRef(new THREE.Vector3(0, 5.5, 19.3));
  const smoothLookAtRef = useRef(new THREE.Vector3(0, 1.8, 7.5));

  const targetPitchRef = useRef<number>(0.45);
  const smoothPitchRef = useRef<number>(0.45);
  const targetDistanceRef = useRef<number>(10.9);
  const smoothDistanceRef = useRef<number>(10.9);

  const sensitivityRef = useRef<number>(cameraSensitivity);
  const zoomSpeedRef = useRef<number>(zoomSpeed);

  useEffect(() => {
    sensitivityRef.current = cameraSensitivity;
  }, [cameraSensitivity]);

  useEffect(() => {
    zoomSpeedRef.current = zoomSpeed;
  }, [zoomSpeed]);

  // Sync default distance & pitch when cameraMode preset ('follow' vs 'orbit') is toggled
  useEffect(() => {
    if (cameraMode === 'orbit') {
      targetPitchRef.current = clampCameraPitch(0.55);
      targetDistanceRef.current = clampCameraDistance(16.0);
    } else {
      targetPitchRef.current = clampCameraPitch(0.45);
      targetDistanceRef.current = clampCameraDistance(10.9);
    }
    invalidate();
  }, [cameraMode, invalidate]);

  // Attach Desktop (Right-Click Drag + Wheel Zoom) & Mobile (3D Viewport Touch-Drag + Pinch Zoom) listeners
  useEffect(() => {
    const domElement = gl.domElement;
    if (!domElement) return;

    let isRightMouseDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    let activeTouchPointerId: number | null = null;
    let lastTouchX = 0;
    let lastTouchY = 0;
    const touchPoints = new Map<number, { x: number; y: number }>();
    let lastPinchDist: number | null = null;

    const syncDataset = () => {
      if (typeof document !== 'undefined') {
        document.body.dataset.cameraYaw = cameraYawRef.current.toFixed(3);
        document.body.dataset.cameraPitch = targetPitchRef.current.toFixed(3);
        document.body.dataset.cameraDistance = targetDistanceRef.current.toFixed(2);
      }
    };
    syncDataset();

    const applyRotationDelta = (dx: number, dy: number, baseSensitivity = 0.0065) => {
      const effectiveSensitivity = baseSensitivity * sensitivityRef.current;
      cameraYawRef.current = normalizeAngle(cameraYawRef.current - dx * effectiveSensitivity);
      targetPitchRef.current = clampCameraPitch(
        targetPitchRef.current + dy * (effectiveSensitivity * 0.85)
      );
      syncDataset();
      invalidate();
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touchPoints.size === 2) {
          const pts = Array.from(touchPoints.values());
          lastPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          activeTouchPointerId = null;
          return;
        }
        if (activeTouchPointerId === null && touchPoints.size === 1) {
          activeTouchPointerId = e.pointerId;
          lastTouchX = e.clientX;
          lastTouchY = e.clientY;
        }
        return;
      }

      // Desktop: Right mouse button only (e.button === 2)
      if (e.button === 2) {
        isRightMouseDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      }
    };

    const onWindowPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        if (touchPoints.has(e.pointerId)) {
          touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }
        if (touchPoints.size >= 2) {
          const pts = Array.from(touchPoints.values());
          const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          if (lastPinchDist !== null) {
            const pinchDelta = lastPinchDist - dist;
            if (Math.abs(pinchDelta) > 0.5) {
              targetDistanceRef.current = clampCameraDistance(
                targetDistanceRef.current + pinchDelta * 0.035 * zoomSpeedRef.current
              );
              syncDataset();
              invalidate();
            }
          }
          lastPinchDist = dist;
          return;
        }

        if (activeTouchPointerId !== null && e.pointerId === activeTouchPointerId) {
          const dx = e.clientX - lastTouchX;
          const dy = e.clientY - lastTouchY;
          lastTouchX = e.clientX;
          lastTouchY = e.clientY;
          applyRotationDelta(dx, dy, 0.0075);
        }
        return;
      }

      if (isRightMouseDragging) {
        // Also verify right mouse button is still held when buttons bitmask is reported
        if (typeof e.buttons === 'number' && e.buttons > 0 && (e.buttons & 2) === 0) {
          isRightMouseDragging = false;
          return;
        }
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        applyRotationDelta(dx, dy, 0.0065);
      }
    };

    const onWindowPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        touchPoints.delete(e.pointerId);
        if (touchPoints.size < 2) {
          lastPinchDist = null;
        }
        if (activeTouchPointerId === e.pointerId) {
          activeTouchPointerId = null;
        }
        if (touchPoints.size === 1 && activeTouchPointerId === null) {
          const [remainingId, remainingPt] = Array.from(touchPoints.entries())[0];
          activeTouchPointerId = remainingId;
          lastTouchX = remainingPt.x;
          lastTouchY = remainingPt.y;
        }
        return;
      }
      if (e.button === 2 || !isRightMouseDragging) {
        isRightMouseDragging = false;
      }
    };

    const onBlur = () => {
      isRightMouseDragging = false;
      activeTouchPointerId = null;
      touchPoints.clear();
      lastPinchDist = null;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY === 0) return;
      const step =
        Math.sign(e.deltaY) *
        Math.min(Math.abs(e.deltaY), 120) *
        0.015 *
        zoomSpeedRef.current;
      targetDistanceRef.current = clampCameraDistance(targetDistanceRef.current + step);
      syncDataset();
      invalidate();
    };

    const onMobileZoomButton = () => {
      const zoomDelta = gameInput.consumeCameraZoomDelta();
      if (zoomDelta !== 0) {
        targetDistanceRef.current = clampCameraDistance(
          targetDistanceRef.current + zoomDelta * zoomSpeedRef.current
        );
        syncDataset();
        invalidate();
      }
    };

    domElement.addEventListener('contextmenu', onContextMenu);
    domElement.addEventListener('pointerdown', onPointerDown);
    domElement.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointermove', onWindowPointerMove);
    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', onWindowPointerUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('aether-camera-zoom', onMobileZoomButton);

    return () => {
      domElement.removeEventListener('contextmenu', onContextMenu);
      domElement.removeEventListener('pointerdown', onPointerDown);
      domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('aether-camera-zoom', onMobileZoomButton);
    };
  }, [gl, cameraYawRef, invalidate]);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const ps = playerStateRef.current;

    // 1. Live World Camera Tour when on Title Screen
    if (gameState === 'title') {
      const t = state.clock.elapsedTime * 0.22;
      const tourRadius = 18.5;
      _desiredPos.set(
        Math.sin(t) * tourRadius,
        6.2 + Math.sin(t * 1.5) * 1.1,
        Math.cos(t) * tourRadius + 2.0
      );
      _desiredLookAt.set(0, 1.8, 1.5);

      const tourAlpha = 1 - Math.exp(-4.5 * dt);
      smoothCamPosRef.current.set(
        THREE.MathUtils.lerp(smoothCamPosRef.current.x, _desiredPos.x, tourAlpha),
        THREE.MathUtils.lerp(smoothCamPosRef.current.y, _desiredPos.y, tourAlpha),
        THREE.MathUtils.lerp(smoothCamPosRef.current.z, _desiredPos.z, tourAlpha)
      );
      smoothLookAtRef.current.set(
        THREE.MathUtils.lerp(smoothLookAtRef.current.x, _desiredLookAt.x, tourAlpha),
        THREE.MathUtils.lerp(smoothLookAtRef.current.y, _desiredLookAt.y, tourAlpha),
        THREE.MathUtils.lerp(smoothLookAtRef.current.z, _desiredLookAt.z, tourAlpha)
      );

      camera.position.copy(smoothCamPosRef.current);
      camera.lookAt(smoothLookAtRef.current);
      return;
    }

    // Consume any pending zoom delta from Mobile '+' / '-' Zoom buttons
    const zoomDelta = gameInput.consumeCameraZoomDelta();
    if (zoomDelta !== 0) {
      targetDistanceRef.current = clampCameraDistance(
        targetDistanceRef.current + zoomDelta * zoomSpeedRef.current
      );
    }

    // Smoothly damp vertical pitch and zoom distance
    smoothPitchRef.current = dampValue(
      smoothPitchRef.current,
      targetPitchRef.current,
      14,
      dt
    );
    smoothDistanceRef.current = dampValue(
      smoothDistanceRef.current,
      targetDistanceRef.current,
      12,
      dt
    );

    // Expose live camera orientation & zoom on body dataset for deterministic diagnostics
    if (typeof document !== 'undefined') {
      document.body.dataset.cameraYaw = cameraYawRef.current.toFixed(3);
      document.body.dataset.cameraPitch = smoothPitchRef.current.toFixed(3);
      document.body.dataset.cameraDistance = smoothDistanceRef.current.toFixed(2);
    }

    // 2. Compute smooth follow camera target using current yaw, pitch, and zoom distance
    const { cameraPosition, lookAtTarget } = computeFollowCameraTarget(
      ps,
      cameraMode,
      cameraYawRef.current,
      smoothPitchRef.current,
      smoothDistanceRef.current
    );

    _desiredPos.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    _desiredLookAt.set(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);

    // 3. Smoothly interpolate camera position and lookAt target using THREE.MathUtils.lerp
    const posLerpFactor = 1 - Math.exp(-8.5 * dt);
    const lookLerpFactor = 1 - Math.exp(-12.0 * dt);

    smoothCamPosRef.current.set(
      THREE.MathUtils.lerp(smoothCamPosRef.current.x, _desiredPos.x, posLerpFactor),
      THREE.MathUtils.lerp(smoothCamPosRef.current.y, _desiredPos.y, posLerpFactor),
      THREE.MathUtils.lerp(smoothCamPosRef.current.z, _desiredPos.z, posLerpFactor)
    );

    smoothLookAtRef.current.set(
      THREE.MathUtils.lerp(smoothLookAtRef.current.x, _desiredLookAt.x, lookLerpFactor),
      THREE.MathUtils.lerp(smoothLookAtRef.current.y, _desiredLookAt.y, lookLerpFactor),
      THREE.MathUtils.lerp(smoothLookAtRef.current.z, _desiredLookAt.z, lookLerpFactor)
    );

    camera.position.copy(smoothCamPosRef.current);
    camera.lookAt(smoothLookAtRef.current);

    // Subtle dynamic FOV boost when sprinting/boosting (no extreme FOV distortion)
    if (camera instanceof THREE.PerspectiveCamera) {
      const horizSpeed = Math.hypot(ps.vx, ps.vz);
      const targetFov = horizSpeed > 8.5 ? 56 : 50;
      const nextFov = dampValue(camera.fov, targetFov, 6, dt);
      if (Math.abs(nextFov - camera.fov) > 0.05) {
        camera.fov = nextFov;
        camera.updateProjectionMatrix();
      }
    }
  });

  return null;
}
