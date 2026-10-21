import { useState, useEffect, useRef, useCallback, type SyntheticEvent } from 'react';
import { gameInput } from '../game/input';
import type { CapitalMarketPOI } from '../game/physics';

interface MobileTouchControlsProps {
  nearbyPOI: CapitalMarketPOI | null;
  onInteract: () => void;
}

const MAX_JOYSTICK_RADIUS = 40; // px

/**
 * Stops propagation of touch and pointer events so 2D mobile controls
 * never trigger 3D canvas raycasting or camera shifts underneath.
 */
function isolateTouchEvent(e: SyntheticEvent) {
  e.stopPropagation();
}

/**
 * Detects whether the user is on a mobile screen width (< 768px) or a touch-capable device.
 * Automatically hides on desktop devices.
 */
function detectMobileOrTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const isNarrowScreen = window.innerWidth < 768;
  const hasCoarsePointer =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;
  return isNarrowScreen || hasCoarsePointer;
}

export function MobileTouchControls({
  nearbyPOI,
  onInteract,
}: MobileTouchControlsProps) {
  const [isMobileView, setIsMobileView] = useState<boolean>(() =>
    detectMobileOrTouchDevice()
  );
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isDragging, setIsDragging] = useState(false);

  const baseRef = useRef<HTMLDivElement>(null);
  const activePointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    const updateDeviceMode = () => {
      setIsMobileView(detectMobileOrTouchDevice());
    };
    const onTouchStart = () => {
      setIsMobileView(true);
    };

    window.addEventListener('resize', updateDeviceMode);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    return () => {
      window.removeEventListener('resize', updateDeviceMode);
      window.removeEventListener('touchstart', onTouchStart);
    };
  }, []);

  const updateJoystickFromClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      const baseEl = baseRef.current;
      if (!baseEl) return;
      const rect = baseEl.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const rawDx = clientX - centerX;
      const rawDy = clientY - centerY;
      const dist = Math.hypot(rawDx, rawDy);

      const clampedDist = Math.min(dist, MAX_JOYSTICK_RADIUS);
      const angle = dist > 0.0001 ? Math.atan2(rawDy, rawDx) : 0;

      const offsetX = Math.cos(angle) * clampedDist;
      const offsetY = Math.sin(angle) * clampedDist;

      setKnobOffset({ x: offsetX, y: offsetY });

      // Normalize to [-1, 1]; screen -Y (up) maps to +Y (forward) in 3D movement
      const normX = offsetX / MAX_JOYSTICK_RADIUS;
      const normY = -offsetY / MAX_JOYSTICK_RADIUS;
      gameInput.setJoystickVector(normX, normY);
    },
    []
  );

  const resetJoystick = useCallback(() => {
    activePointerIdRef.current = null;
    setIsDragging(false);
    setKnobOffset({ x: 0, y: 0 });
    gameInput.setJoystickVector(0, 0);
  }, []);

  // Auto-hide completely on desktop devices
  if (!isMobileView) {
    return null;
  }

  return (
    <div
      data-testid="mobile-controls-container"
      className="cuanture-mobile-controls flex items-end justify-between w-full mt-auto pb-2 px-1 pointer-events-none select-none z-20"
    >
      {/* BOTTOM-LEFT: VIRTUAL JOYSTICK (Touch Event Isolated from 3D Canvas) */}
      <div
        className="flex flex-col items-center gap-1.5 pointer-events-auto"
        onTouchStart={isolateTouchEvent}
        onTouchMove={isolateTouchEvent}
        onTouchEnd={isolateTouchEvent}
        onTouchCancel={isolateTouchEvent}
        onPointerDown={isolateTouchEvent}
        onPointerMove={isolateTouchEvent}
        onPointerUp={isolateTouchEvent}
      >
        <div
          ref={baseRef}
          data-testid="virtual-joystick"
          role="slider"
          aria-label="Virtual Movement Joystick"
          aria-valuemin={-100}
          aria-valuemax={100}
          aria-valuenow={Math.round((knobOffset.x / MAX_JOYSTICK_RADIUS) * 100)}
          style={{ touchAction: 'none' }}
          onTouchStart={isolateTouchEvent}
          onTouchMove={isolateTouchEvent}
          onTouchEnd={isolateTouchEvent}
          onTouchCancel={isolateTouchEvent}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            activePointerIdRef.current = e.pointerId;
            e.currentTarget.setPointerCapture(e.pointerId);
            setIsDragging(true);
            updateJoystickFromClientPoint(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            e.stopPropagation();
            if (activePointerIdRef.current !== e.pointerId) return;
            e.preventDefault();
            updateJoystickFromClientPoint(e.clientX, e.clientY);
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            if (activePointerIdRef.current !== e.pointerId) return;
            e.preventDefault();
            resetJoystick();
          }}
          onPointerCancel={(e) => {
            e.stopPropagation();
            resetJoystick();
          }}
          className={`relative w-32 h-32 rounded-full bg-[#0b1524]/88 border-2 transition-colors shadow-2xl flex items-center justify-center cursor-pointer ${
            isDragging ? 'border-amber-400/90' : 'border-sky-400/45'
          }`}
        >
          {/* Outer Compass Ring & Crosshairs */}
          <div className="absolute inset-2.5 rounded-full border border-sky-400/20 pointer-events-none" />
          <span className="absolute top-1.5 text-[9px] font-extrabold text-sky-400/70 pointer-events-none">
            ▲
          </span>
          <span className="absolute bottom-1.5 text-[9px] font-extrabold text-sky-400/70 pointer-events-none">
            ▼
          </span>
          <span className="absolute left-2 text-[9px] font-extrabold text-sky-400/70 pointer-events-none">
            ◀
          </span>
          <span className="absolute right-2 text-[9px] font-extrabold text-sky-400/70 pointer-events-none">
            ▶
          </span>

          {/* Draggable Virtual Thumb Stick Knob */}
          <div
            data-testid="virtual-joystick-knob"
            style={{
              transform: `translate3d(${knobOffset.x.toFixed(1)}px, ${knobOffset.y.toFixed(1)}px, 0)`,
            }}
            className={`w-13 h-13 rounded-full shadow-lg border-2 flex items-center justify-center pointer-events-none transition-transform duration-75 ${
              isDragging
                ? 'bg-amber-400 border-white text-slate-950 scale-105'
                : 'bg-sky-500/90 border-sky-200 text-slate-950'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-slate-950/35" />
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-[#0b1524]/80 px-2 py-0.5 rounded-md border border-slate-700/70">
          Move
        </span>
      </div>

      {/* BOTTOM-RIGHT: COMPACT CAMERA ZOOM (+/-), JUMP & LARGE CIRCULAR 'INTERACT' BUTTON (Touch Event Isolated) */}
      <div
        className="pointer-events-auto flex flex-col items-end gap-2.5"
        onTouchStart={isolateTouchEvent}
        onTouchMove={isolateTouchEvent}
        onTouchEnd={isolateTouchEvent}
        onTouchCancel={isolateTouchEvent}
        onPointerDown={isolateTouchEvent}
        onPointerMove={isolateTouchEvent}
        onPointerUp={isolateTouchEvent}
      >
        {/* Compact Camera Zoom In (+) and Zoom Out (-) Controls */}
        <div
          data-testid="mobile-zoom-controls"
          className="flex items-center gap-1.5 bg-[#0b1524]/90 border border-sky-400/40 rounded-full p-1 shadow-lg"
        >
          <button
            type="button"
            data-testid="mobile-zoom-out-button"
            aria-label="Zoom Out Camera"
            style={{ touchAction: 'manipulation' }}
            onTouchStart={isolateTouchEvent}
            onTouchEnd={isolateTouchEvent}
            onPointerDown={isolateTouchEvent}
            onPointerUp={isolateTouchEvent}
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              gameInput.adjustCameraZoom(1.8);
            }}
            className="w-8 h-8 rounded-full bg-slate-800/90 hover:bg-slate-700 active:bg-sky-500 border border-slate-600/80 text-sky-200 active:text-slate-950 font-extrabold text-sm leading-none flex items-center justify-center cursor-pointer"
          >
            −
          </button>
          <button
            type="button"
            data-testid="mobile-zoom-in-button"
            aria-label="Zoom In Camera"
            style={{ touchAction: 'manipulation' }}
            onTouchStart={isolateTouchEvent}
            onTouchEnd={isolateTouchEvent}
            onPointerDown={isolateTouchEvent}
            onPointerUp={isolateTouchEvent}
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              gameInput.adjustCameraZoom(-1.8);
            }}
            className="w-8 h-8 rounded-full bg-slate-800/90 hover:bg-slate-700 active:bg-sky-500 border border-slate-600/80 text-sky-200 active:text-slate-950 font-extrabold text-sm leading-none flex items-center justify-center cursor-pointer"
          >
            +
          </button>
        </div>

        {/* Secondary Compact Jump Button */}
        <button
          type="button"
          data-testid="mobile-jump-button"
          aria-label="Jump"
          style={{ touchAction: 'none' }}
          onTouchStart={isolateTouchEvent}
          onTouchEnd={isolateTouchEvent}
          onPointerDown={(e) => {
            e.stopPropagation();
            gameInput.setTouchControl('jumpHeld', true);
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            gameInput.setTouchControl('jumpHeld', false);
          }}
          onPointerLeave={(e) => {
            e.stopPropagation();
            gameInput.setTouchControl('jumpHeld', false);
          }}
          className="w-12 h-12 rounded-full bg-slate-800/90 active:bg-sky-500 border border-sky-400/40 text-sky-200 active:text-slate-950 font-extrabold text-[10px] tracking-wider uppercase shadow-lg flex items-center justify-center"
        >
          Jump
        </button>

        {/* Primary Large Circular Virtual 'Interact' Action Button (Triggers 'E') */}
        <button
          type="button"
          data-testid="virtual-interact-button"
          aria-label={
            nearbyPOI
              ? `Interact with ${nearbyPOI.name}`
              : 'Interact with nearby building'
          }
          style={{ touchAction: 'manipulation' }}
          onTouchStart={isolateTouchEvent}
          onTouchEnd={isolateTouchEvent}
          onPointerDown={isolateTouchEvent}
          onPointerUp={isolateTouchEvent}
          onClick={(e) => {
            e.stopPropagation();
            e.currentTarget.blur();
            onInteract();
          }}
          className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl cursor-pointer border-4 ${
            nearbyPOI
              ? 'bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 border-amber-100 ring-4 ring-amber-400/35'
              : 'bg-[#0b1524]/90 active:bg-slate-800 text-slate-300 border-sky-400/45'
          }`}
        >
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono font-black mb-0.5 ${
              nearbyPOI
                ? 'bg-slate-950 text-amber-300'
                : 'bg-slate-800 text-sky-300 border border-slate-600'
            }`}
          >
            E
          </span>
          <span className="text-xs font-extrabold uppercase tracking-wider leading-tight">
            Interact
          </span>
          {nearbyPOI && (
            <span className="text-[9px] font-bold text-slate-900 truncate max-w-[74px] mt-0.5">
              {nearbyPOI.shortLabel}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
