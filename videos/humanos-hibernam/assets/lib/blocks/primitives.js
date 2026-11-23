/**
 * primitives.js — campo de primitivas flutuando (R03): toro, cápsula, cilindro, cruz, poliedro em wireframe,
 * bolinhas brilhantes e no máximo `vidro` objetos de vidro (transmission é pesado sem GPU).
 *
 *   const f = createPrimitives(scene, { n: 16, paleta: ["#7B3FE4", "#B05CF0", "#F07A3A", "#3E7BFA"] });
 *   f.update(t)        flutuação e giro determinísticos
 * Câmera sugerida: z 30 olhando a origem, fov 35. Fundo #1E1A33 com névoa (25, 70) dá profundidade.
 */
import * as THREE from "../three.module.js";
import { mulberry32, addMaqueteLights } from "../kit.js";

export function createPrimitives(scene, {
  n = 16, seed = 303, raio = 14,
  paleta = ["#7B3FE4", "#B05CF0", "#F07A3A", "#3E7BFA"],
  vidro = 1, brilhos = 40, fundo = 0x1e1a33, luzes = true,
} = {}) {
  scene.background = new THREE.Color(fundo);
  scene.fog = new THREE.Fog(fundo, 25, 70);
  if (luzes) addMaqueteLights(scene, { intensity: 1.1, shadowSize: 30 });
  const r = mulberry32(seed);
  const cruz = (() => {
    const a = new THREE.BoxGeometry(2.4, 0.7, 0.7), b = new THREE.BoxGeometry(0.7, 2.4, 0.7);
    const g = new THREE.BufferGeometry();
    const pa = a.toNonIndexed().attributes, pb = b.toNonIndexed().attributes;
    const cat = (x, y) => { const o = new Float32Array(x.array.length + y.array.length); o.set(x.array); o.set(y.array, x.array.length); return o; };
    g.setAttribute("position", new THREE.BufferAttribute(cat(pa.position, pb.position), 3));
    g.setAttribute("normal", new THREE.BufferAttribute(cat(pa.normal, pb.normal), 3));
    return g;
  })();
  const formas = [
    new THREE.TorusGeometry(1, 0.38, 20, 48),
    new THREE.CapsuleGeometry(0.6, 1.2, 8, 20),
    new THREE.CylinderGeometry(0.8, 0.8, 1.6, 32),
    new THREE.SphereGeometry(0.9, 32, 20).scale(1, 1.25, 1),
    cruz,
  ];
  const wire = new THREE.IcosahedronGeometry(1.3, 0);
  const itens = [];
  for (let i = 0; i < n; i++) {
    const cor = paleta[Math.floor(r() * paleta.length)];
    let mat;
    if (i < vidro) {
      mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.35, transmission: 1, thickness: 1.2, ior: 1.3 });
    } else if (r() < 0.18) {
      mat = new THREE.MeshBasicMaterial({ color: cor, wireframe: true });
    } else {
      mat = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.55 + r() * 0.3 });
    }
    const m = new THREE.Mesh(mat.wireframe ? wire : formas[Math.floor(r() * formas.length)], mat);
    const s = 0.7 + r() * 1.3;
    m.scale.setScalar(s);
    m.castShadow = true;
    const base = new THREE.Vector3((r() * 2 - 1) * raio * 0.7, (r() * 2 - 1) * raio, (r() * 2 - 1) * raio * 0.6 - 4);
    scene.add(m);
    itens.push({ m, base, ph: r() * 6.28, f: 0.4 + r() * 0.6, rx: (r() - 0.5) * 1.2, ry: (r() - 0.5) * 1.2 });
  }
  // bolinhas brilhantes
  const bp = new Float32Array(brilhos * 3);
  for (let i = 0; i < brilhos; i++) bp.set([(r() * 2 - 1) * raio, (r() * 2 - 1) * raio * 1.3, (r() * 2 - 1) * raio - 4], i * 3);
  const bg = new THREE.BufferGeometry();
  bg.setAttribute("position", new THREE.BufferAttribute(bp, 3));
  const pts = new THREE.Points(bg, new THREE.PointsMaterial({ color: 0xf3e9ff, size: 0.25, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(pts);

  function update(t) {
    for (const it of itens) {
      it.m.position.copy(it.base);
      it.m.position.y += Math.sin(it.ph + t * it.f) * 0.8;
      it.m.position.x += Math.cos(it.ph * 1.3 + t * it.f * 0.7) * 0.4;
      it.m.rotation.set(it.ph + t * it.rx, it.ph * 0.5 + t * it.ry, 0);
    }
    pts.rotation.y = t * 0.03;
  }
  update(0);
  return { itens, update };
}
