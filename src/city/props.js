import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RNG } from '../core/rng.js';

// Procedural prop geometry. Every prop is returned as a list of parts
// { geo, mat } that share one transform, centred on their bounding box so the
// physics can treat them as oriented boxes.

const merge = (list) => {
  const clean = list.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k);
    if (!n.attributes.uv) n.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2));
    return n;
  });
  return mergeGeometries(clean, false);
};

const box = (w, h, d, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
  const g = new THREE.BoxGeometry(w, h, d);
  g.rotateX(rx); g.rotateY(ry); g.rotateZ(rz);
  g.translate(x, y, z);
  return g;
};
const cyl = (rt, rb, h, seg, x = 0, y = 0, z = 0, axis = 'y') => {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg);
  if (axis === 'z') g.rotateX(Math.PI / 2);
  if (axis === 'x') g.rotateZ(Math.PI / 2);
  g.translate(x, y, z);
  return g;
};

function extrudeProfile(points, depth, bevel) {
  const s = new THREE.Shape();
  s.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) s.lineTo(points[i][0], points[i][1]);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.9, bevelSegments: 3, curveSegments: 4,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

// ---------------------------------------------------------------------------
export const materials = {};
export function createMaterials(envMap) {
  materials.carPaint = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0.55, roughness: 0.32, clearcoat: 1.0, clearcoatRoughness: 0.06, envMapIntensity: 1.2,
  });
  materials.glass = new THREE.MeshPhysicalMaterial({ color: 0x0b0f14, metalness: 0.2, roughness: 0.05, envMapIntensity: 1.5, clearcoat: 1 });
  materials.rubber = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.85, metalness: 0.1 });
  materials.chrome = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.25, metalness: 1.0 });
  materials.headlight = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xfff1d6, emissiveIntensity: 6 });
  materials.taillight = new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0xff1a0a, emissiveIntensity: 4 });
  materials.person = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.05 });
  materials.bark = new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 0.95 });
  materials.roots = new THREE.MeshStandardMaterial({ color: 0x2c2118, roughness: 1 });
  materials.foliage = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0 });
  materials.wood = new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.7 });
  materials.metalDark = new THREE.MeshStandardMaterial({ color: 0x24282c, roughness: 0.45, metalness: 0.8 });
  materials.plastic = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  materials.cardboard = new THREE.MeshStandardMaterial({ color: 0x9c7a50, roughness: 0.9 });
  materials.fabric = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, side: THREE.DoubleSide });
  materials.stone = new THREE.MeshStandardMaterial({ color: 0x8c857b, roughness: 0.85 });
  materials.lampGlow = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0xffc070, emissiveIntensity: 5 });
  for (const m of Object.values(materials)) if ('envMap' in m) m.envMap = envMap;
  return materials;
}

// Cars ---------------------------------------------------------------------
export function sedanParts() {
  const W = 1.66;
  const body = extrudeProfile([
    [-2.3, 0.32], [-2.32, 0.82], [-2.12, 0.96], [-1.25, 1.0], [-0.72, 1.4], [0.5, 1.43], [1.12, 1.0],
    [2.08, 0.88], [2.32, 0.7], [2.3, 0.32],
  ], W, 0.08);
  const glass = extrudeProfile([[-1.16, 1.0], [-0.69, 1.36], [0.48, 1.39], [1.04, 1.0]], W + 0.18, 0);
  const wheels = [];
  for (const x of [-1.42, 1.42]) for (const z of [-0.84, 0.84]) wheels.push(cyl(0.34, 0.34, 0.24, 18, x, 0.34, z, 'z'));
  const rims = [];
  for (const x of [-1.42, 1.42]) for (const z of [-0.97, 0.97]) rims.push(cyl(0.2, 0.2, 0.02, 12, x, 0.34, z, 'z'));
  const head = merge([box(0.06, 0.12, 0.38, 2.33, 0.68, -0.6), box(0.06, 0.12, 0.38, 2.33, 0.68, 0.6)]);
  const tail = merge([box(0.06, 0.12, 0.4, -2.36, 0.78, -0.62), box(0.06, 0.12, 0.4, -2.36, 0.78, 0.62)]);
  return finalize([
    { geo: body, mat: 'carPaint', color: true },
    { geo: glass, mat: 'glass' },
    { geo: merge(wheels), mat: 'rubber' },
    { geo: merge(rims), mat: 'chrome' },
    { geo: head, mat: 'headlight' },
    { geo: tail, mat: 'taillight' },
  ]);
}

export function suvParts() {
  const W = 1.78;
  const body = extrudeProfile([
    [-2.4, 0.4], [-2.42, 1.62], [-2.25, 1.78], [0.6, 1.8], [1.35, 1.12], [2.3, 1.02], [2.45, 0.8], [2.42, 0.4],
  ], W, 0.09);
  const glass = extrudeProfile([[-2.2, 1.18], [-2.12, 1.66], [0.55, 1.69], [1.22, 1.12]], W + 0.2, 0);
  const wheels = [], rims = [];
  for (const x of [-1.5, 1.5]) for (const z of [-0.9, 0.9]) wheels.push(cyl(0.4, 0.4, 0.28, 18, x, 0.4, z, 'z'));
  for (const x of [-1.5, 1.5]) for (const z of [-1.05, 1.05]) rims.push(cyl(0.24, 0.24, 0.02, 12, x, 0.4, z, 'z'));
  const head = merge([box(0.06, 0.14, 0.4, 2.46, 0.86, -0.62), box(0.06, 0.14, 0.4, 2.46, 0.86, 0.62)]);
  const tail = merge([box(0.06, 0.3, 0.16, -2.48, 1.2, -0.78), box(0.06, 0.3, 0.16, -2.48, 1.2, 0.78)]);
  return finalize([
    { geo: body, mat: 'carPaint', color: true },
    { geo: glass, mat: 'glass' },
    { geo: merge(wheels), mat: 'rubber' },
    { geo: merge(rims), mat: 'chrome' },
    { geo: head, mat: 'headlight' },
    { geo: tail, mat: 'taillight' },
  ]);
}

export function busParts() {
  const W = 2.4;
  const body = extrudeProfile([[-5.9, 0.45], [-6.0, 3.0], [-5.8, 3.2], [5.7, 3.2], [6.0, 2.9], [6.05, 0.45]], W, 0.06);
  const glass = merge([
    box(10.6, 0.95, W + 0.14, -0.3, 2.15, 0),
    box(0.1, 1.6, 2.1, 6.08, 2.0, 0),
  ]);
  const wheels = [];
  for (const x of [-3.8, 3.9]) for (const z of [-1.02, 1.02]) wheels.push(cyl(0.5, 0.5, 0.32, 18, x, 0.5, z, 'z'));
  const head = merge([box(0.06, 0.16, 0.4, 6.1, 0.8, -0.85), box(0.06, 0.16, 0.4, 6.1, 0.8, 0.85)]);
  const tail = merge([box(0.06, 0.4, 0.2, -6.05, 1.0, -1.0), box(0.06, 0.4, 0.2, -6.05, 1.0, 1.0)]);
  return finalize([
    { geo: body, mat: 'carPaint', color: true },
    { geo: glass, mat: 'glass' },
    { geo: merge(wheels), mat: 'rubber' },
    { geo: head, mat: 'headlight' },
    { geo: tail, mat: 'taillight' },
  ]);
}

// People (stylised silhouettes) -------------------------------------------
function limb(r, len, from, dir) {
  const g = new THREE.CapsuleGeometry(r, len, 2, 7);
  const d = new THREE.Vector3(...dir).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
  g.applyQuaternion(q);
  const c = new THREE.Vector3(...from).addScaledVector(d, len / 2 + r * 0.3);
  g.translate(c.x, c.y, c.z);
  return g;
}

export function personParts(pose = 'stand') {
  const parts = [];
  // torso & hips
  const torso = new THREE.CapsuleGeometry(0.16, 0.42, 3, 9);
  torso.scale(1, 1, 0.65);
  torso.translate(0, 1.2, 0);
  parts.push(torso);
  const head = new THREE.SphereGeometry(0.11, 10, 7);
  head.scale(0.9, 1.08, 0.95);
  head.translate(0, 1.66, 0.01);
  parts.push(head);
  parts.push(cyl(0.05, 0.06, 0.1, 8, 0, 1.53, 0));
  if (pose === 'stand') {
    parts.push(limb(0.07, 0.72, [-0.1, 0.93, 0], [0.02, -1, 0]));
    parts.push(limb(0.07, 0.72, [0.1, 0.93, 0], [-0.02, -1, 0.05]));
    parts.push(limb(0.05, 0.56, [-0.21, 1.4, 0], [-0.12, -1, 0.05]));
    parts.push(limb(0.05, 0.56, [0.21, 1.4, 0], [0.12, -1, -0.05]));
  } else {
    // floating / flailing: arms up and out, one knee bent
    parts.push(limb(0.07, 0.4, [-0.1, 0.93, 0], [-0.25, -1, 0.35]));
    parts.push(limb(0.065, 0.36, [-0.2, 0.58, 0.14], [0.0, -1, -0.5]));
    parts.push(limb(0.07, 0.72, [0.1, 0.93, 0], [0.35, -1, -0.15]));
    parts.push(limb(0.05, 0.56, [-0.21, 1.42, 0], [-0.9, 0.85, 0.15]));
    parts.push(limb(0.05, 0.56, [0.21, 1.42, 0], [0.85, 0.6, -0.3]));
  }
  const g = merge(parts);
  return finalize([{ geo: g, mat: 'person', color: true }]);
}

// Trees ------------------------------------------------------------------------
export function treeParts(seed = 1) {
  const rng = new RNG(seed);
  const trunk = [];
  trunk.push(cyl(0.11, 0.2, 3.4, 9, 0, 1.7, 0));
  trunk.push(limb(0.06, 1.3, [0, 2.7, 0], [0.7, 1, 0.2]));
  trunk.push(limb(0.06, 1.2, [0, 2.9, 0], [-0.6, 1, -0.3]));
  trunk.push(limb(0.05, 1.0, [0, 3.2, 0], [0.1, 1, -0.8]));
  const roots = new THREE.SphereGeometry(0.85, 12, 8);
  roots.scale(1, 0.55, 1);
  roots.translate(0, -0.25, 0);
  const rootLimbs = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rng.float(0, 0.5);
    rootLimbs.push(limb(0.07, 0.9, [0, -0.1, 0], [Math.cos(a), -0.45, Math.sin(a)]));
  }
  const fol = [];
  const blobs = [[0, 4.6, 0, 1.7], [1.0, 4.1, 0.4, 1.2], [-0.9, 4.3, -0.5, 1.25], [0.2, 5.4, -0.2, 1.2], [-0.3, 3.9, 0.9, 1.0], [0.6, 4.4, -1.0, 1.05]];
  for (const [x, y, z, r] of blobs) {
    const g = new THREE.IcosahedronGeometry(r, 2);
    const p = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = 1 + 0.18 * Math.sin(v.x * 4.1 + seed) * Math.sin(v.y * 3.7) * Math.sin(v.z * 4.3 + seed * 2.0);
      v.multiplyScalar(n);
      p.setXYZ(i, v.x, v.y * 0.85, v.z);
    }
    g.translate(x, y, z);
    fol.push(g);
  }
  const foliage = merge(fol);
  // soft "canopy" normals: point away from the canopy centre for smooth light
  const fp = foliage.attributes.position, fn = foliage.attributes.normal;
  const c = new THREE.Vector3(0, 4.5, 0), v = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < fp.count; i++) {
    v.fromBufferAttribute(fp, i).sub(c).normalize();
    n.fromBufferAttribute(fn, i);
    n.lerp(v, 0.7).normalize();
    fn.setXYZ(i, n.x, n.y, n.z);
  }
  return finalize([
    { geo: merge(trunk), mat: 'bark' },
    { geo: merge([roots, ...rootLimbs]), mat: 'roots' },
    { geo: foliage, mat: 'foliage', color: true },
  ], { ignoreBelow: 0 });
}

// Street furniture ---------------------------------------------------------------
export function benchParts() {
  const slats = [];
  for (let i = 0; i < 4; i++) slats.push(box(1.8, 0.04, 0.1, 0, 0.45, -0.18 + i * 0.12));
  for (let i = 0; i < 3; i++) slats.push(box(1.8, 0.1, 0.035, 0, 0.62 + i * 0.13, -0.28, -0.25));
  const legs = [box(0.06, 0.45, 0.5, -0.8, 0.22, -0.05), box(0.06, 0.45, 0.5, 0.8, 0.22, -0.05),
    box(0.05, 0.5, 0.05, -0.8, 0.68, -0.29, -0.25), box(0.05, 0.5, 0.05, 0.8, 0.68, -0.29, -0.25)];
  return finalize([{ geo: merge(slats), mat: 'wood' }, { geo: merge(legs), mat: 'metalDark' }]);
}
export function tableParts() {
  return finalize([
    { geo: merge([cyl(0.4, 0.4, 0.035, 20, 0, 0.74, 0)]), mat: 'plastic', color: true },
    { geo: merge([cyl(0.03, 0.03, 0.72, 8, 0, 0.37, 0), cyl(0.22, 0.25, 0.03, 16, 0, 0.015, 0)]), mat: 'metalDark' },
  ]);
}
export function chairParts() {
  return finalize([
    { geo: merge([box(0.42, 0.04, 0.42, 0, 0.45, 0), box(0.42, 0.42, 0.04, 0, 0.68, -0.2, -0.12)]), mat: 'plastic', color: true },
    { geo: merge([box(0.03, 0.45, 0.03, -0.19, 0.22, -0.19), box(0.03, 0.45, 0.03, 0.19, 0.22, -0.19), box(0.03, 0.45, 0.03, -0.19, 0.22, 0.19), box(0.03, 0.45, 0.03, 0.19, 0.22, 0.19)]), mat: 'metalDark' },
  ]);
}
export function umbrellaParts() {
  const top = new THREE.ConeGeometry(1.4, 0.45, 12, 1, true);
  top.translate(0, 2.3, 0);
  return finalize([
    { geo: merge([top]), mat: 'fabric', color: true },
    { geo: merge([cyl(0.025, 0.025, 2.4, 6, 0, 1.2, 0)]), mat: 'chrome' },
  ]);
}
export function binParts() {
  return finalize([
    { geo: merge([cyl(0.28, 0.25, 0.9, 14, 0, 0.45, 0)]), mat: 'metalDark' },
    { geo: merge([cyl(0.3, 0.3, 0.05, 14, 0, 0.92, 0)]), mat: 'plastic', color: true },
  ]);
}
export function coneParts() {
  return finalize([
    { geo: merge([new THREE.ConeGeometry(0.16, 0.6, 12).translate(0, 0.35, 0)]), mat: 'plastic', color: true },
    { geo: merge([box(0.38, 0.05, 0.38, 0, 0.025, 0)]), mat: 'rubber' },
  ]);
}
export function crateParts() {
  return finalize([{ geo: merge([box(0.6, 0.45, 0.45, 0, 0.225, 0)]), mat: 'cardboard' }]);
}
export function lampParts() {
  const pole = merge([cyl(0.07, 0.1, 7, 10, 0, 3.5, 0), limb(0.04, 1.2, [0, 6.9, 0], [1, 0.12, 0])]);
  const head = merge([box(0.55, 0.12, 0.26, 1.25, 7.0, 0)]);
  const glow = merge([box(0.45, 0.03, 0.2, 1.25, 6.93, 0)]);
  return finalize([{ geo: pole, mat: 'metalDark' }, { geo: head, mat: 'metalDark' }, { geo: glow, mat: 'lampGlow' }], { keepOrigin: true });
}

// Centre geometry on its bounds; returns { parts, half, offset }
function finalize(parts, opts = {}) {
  const bb = new THREE.Box3();
  for (const p of parts) {
    if (opts.ignoreBelow !== undefined && p.mat === 'roots') continue;
    p.geo.computeBoundingBox();
    bb.union(p.geo.boundingBox);
  }
  const center = bb.getCenter(new THREE.Vector3());
  const half = bb.getSize(new THREE.Vector3()).multiplyScalar(0.5);
  if (!opts.keepOrigin) {
    for (const p of parts) p.geo.translate(-center.x, -center.y, -center.z);
  }
  for (const p of parts) { p.geo.computeBoundingSphere(); }
  return { parts, half, center };
}

// ---------------------------------------------------------------------------
// A group of InstancedMeshes (one per part) that share instance transforms.
export class InstancedProp {
  constructor(def, count, scene, { castShadow = true, receiveShadow = true } = {}) {
    this.def = def;
    this.count = count;
    this.meshes = def.parts.map((p) => {
      const m = new THREE.InstancedMesh(p.geo, materials[p.mat], count);
      m.castShadow = castShadow;
      m.receiveShadow = receiveShadow;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.frustumCulled = false;
      if (p.color) m.userData.colored = true;
      scene.add(m);
      return m;
    });
  }
  setMatrix(i, m) { for (const mesh of this.meshes) mesh.setMatrixAt(i, m); }
  setColor(i, c) { for (const mesh of this.meshes) if (mesh.userData.colored) mesh.setColorAt(i, c); }
  commit() {
    for (const m of this.meshes) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }
}
