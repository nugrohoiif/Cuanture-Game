import type { MovementInput } from './physics';

class InputManager {
  private keysHeld = new Set<string>();
  private jumpJustPressedFlag = false;
  private touchState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jumpHeld: false,
    sprint: false,
  };
  private joystickVector = { x: 0, y: 0 };
  public cameraOrbitDeltaX = 0;
  public cameraZoomDelta = 0;

  public adjustCameraZoom(deltaDistance: number): void {
    this.cameraZoomDelta += deltaDistance;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aether-camera-zoom'));
    }
  }

  public consumeCameraZoomDelta(): number {
    const delta = this.cameraZoomDelta;
    this.cameraZoomDelta = 0;
    return delta;
  }

  public handleKeyDown = (e: KeyboardEvent): void => {
    const code = e.code;
    if (
      code === 'Space' ||
      code === 'ArrowUp' ||
      code === 'ArrowDown' ||
      code === 'ArrowLeft' ||
      code === 'ArrowRight'
    ) {
      // Prevent page scroll
      e.preventDefault();
    }

    if ((code === 'Space' || code === 'KeyJ') && !this.keysHeld.has(code)) {
      this.jumpJustPressedFlag = true;
    }
    this.keysHeld.add(code);
  };

  public handleKeyUp = (e: KeyboardEvent): void => {
    this.keysHeld.delete(e.code);
  };

  public clearAll = (): void => {
    this.keysHeld.clear();
    this.jumpJustPressedFlag = false;
    this.joystickVector = { x: 0, y: 0 };
    this.touchState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jumpHeld: false,
      sprint: false,
    };
  };

  public setTouchControl(
    control: keyof typeof this.touchState,
    active: boolean
  ): void {
    if (control === 'jumpHeld' && active && !this.touchState.jumpHeld) {
      this.jumpJustPressedFlag = true;
    }
    this.touchState[control] = active;
  }

  /**
   * Sets the normalized virtual joystick vector:
   * x in [-1, 1] (left to right), y in [-1, 1] (backward to forward)
   */
  public setJoystickVector(x: number, y: number): void {
    const deadzone = 0.12;
    const len = Math.hypot(x, y);
    if (len < deadzone) {
      this.joystickVector.x = 0;
      this.joystickVector.y = 0;
      this.touchState.forward = false;
      this.touchState.backward = false;
      this.touchState.left = false;
      this.touchState.right = false;
      return;
    }

    const clampedX = Math.max(-1, Math.min(1, x));
    const clampedY = Math.max(-1, Math.min(1, y));
    this.joystickVector.x = clampedX;
    this.joystickVector.y = clampedY;

    this.touchState.forward = clampedY > 0.22;
    this.touchState.backward = clampedY < -0.22;
    this.touchState.right = clampedX > 0.22;
    this.touchState.left = clampedX < -0.22;
  }

  public sampleMovementInput(): MovementInput {
    const forward =
      this.keysHeld.has('KeyW') ||
      this.keysHeld.has('ArrowUp') ||
      this.touchState.forward;
    const backward =
      this.keysHeld.has('KeyS') ||
      this.keysHeld.has('ArrowDown') ||
      this.touchState.backward;
    const left =
      this.keysHeld.has('KeyA') ||
      this.keysHeld.has('ArrowLeft') ||
      this.touchState.left;
    const right =
      this.keysHeld.has('KeyD') ||
      this.keysHeld.has('ArrowRight') ||
      this.touchState.right;
    const jumpHeld =
      this.keysHeld.has('Space') ||
      this.keysHeld.has('KeyJ') ||
      this.touchState.jumpHeld;
    const sprint =
      this.keysHeld.has('ShiftLeft') ||
      this.keysHeld.has('ShiftRight') ||
      this.touchState.sprint;

    const jumpJustPressed = this.jumpJustPressedFlag;
    this.jumpJustPressedFlag = false;

    return {
      forward,
      backward,
      left,
      right,
      jumpHeld,
      jumpJustPressed,
      sprint,
      analogX: this.joystickVector.x,
      analogY: this.joystickVector.y,
    };
  }

  public isKeyHeld(code: string): boolean {
    return this.keysHeld.has(code);
  }
}

export const gameInput = new InputManager();
