import * as THREE from 'three';

let cachedMeadowTextures: { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } | null = null;
let cachedStoneTextures: { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } | null = null;

export function getMeadowTextures(maxAnisotropy = 4): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  if (cachedMeadowTextures) return cachedMeadowTextures;

  const size = 256;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  // Rich emerald/sage meadow base with soft radial warmth
  const grad = ctx.createRadialGradient(size / 2, size / 2, 16, size / 2, size / 2, size * 0.7);
  grad.addColorStop(0, '#449962');
  grad.addColorStop(1, '#367d4f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Subtle fine grass speckles
  for (let i = 0; i < 400; i++) {
    const x = (i * 73) % size;
    const y = (i * 139) % size;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(98, 182, 125, 0.14)' : 'rgba(38, 97, 60, 0.14)';
    ctx.fillRect(x, y, 3, 3);
  }

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);
  for (let i = 0; i < 140; i++) {
    const x = (i * 73) % size;
    const y = (i * 139) % size;
    const r = 5 + (i % 8);
    bCtx.fillStyle = i % 2 === 0 ? 'rgba(148, 148, 148, 0.35)' : 'rgba(110, 110, 110, 0.35)';
    bCtx.beginPath();
    bCtx.arc(x, y, r, 0, Math.PI * 2);
    bCtx.fill();
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(10, 10);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(10, 10);
  bumpMap.anisotropy = maxAnisotropy;

  cachedMeadowTextures = { map, bumpMap };
  return cachedMeadowTextures;
}

export function getStoneTextures(maxAnisotropy = 4): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  if (cachedStoneTextures) return cachedStoneTextures;

  const size = 256;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  ctx.fillStyle = '#7e8691';
  ctx.fillRect(0, 0, size, size);

  // Carved flagstones & mineral flecks
  for (let y = 0; y < size; y += 32) {
    for (let x = 0; x < size; x += 32) {
      const offset = ((y / 32) % 2) * 16;
      const shade = 115 + ((x * 7 + y * 13) % 28);
      ctx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 10})`;
      ctx.fillRect((x + offset) % size + 1, y + 1, 30, 30);
    }
  }

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#505050';
  bCtx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 32) {
    for (let x = 0; x < size; x += 32) {
      const offset = ((y / 32) % 2) * 16;
      bCtx.fillStyle = '#c8c8c8';
      bCtx.fillRect((x + offset) % size + 2, y + 2, 28, 28);
    }
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(6, 6);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(6, 6);
  bumpMap.anisotropy = maxAnisotropy;

  cachedStoneTextures = { map, bumpMap };
  return cachedStoneTextures;
}
