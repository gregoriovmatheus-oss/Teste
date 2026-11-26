/**
 * shockwave.js — anel de choque no chão + parede de poeira translúcida, e tremor de câmera com seed. De f11.
 *
 *   const sw = createShockwave(scene, { t0: 3.27, velocidade: 210 });
 *   sw.update(t)                              anel e parede crescem a partir de t0
 *   const tremor = createShake(3303);
 *   tremor.aplicar(camera, t, { t0: 3.27, amp: 3.2, decai: 2.4 })   chame depois de posicionar a câmera
 *                                                                    e antes do lookAt
 * sw.raio(t) devolve o raio atual (para disparar efeitos quando a onda chega num prédio: t0 + dist / velocidade).
 */
import * as THREE from "../three.module.js";
import { range, lerp, mulberry32 } from "../kit.js";

export function createShockwave(scene, {
  t0 = 0, velocidade = 210, centro = [0, 0, 0],
  cor = 0xfff1d6, corParede = 0xf2e4cc,
  altura = [26, 8],        // altura da parede no início e no fim
} = {}) {
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 96, 1),
    new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(centro[0], centro[1] + 1.2, centro[2]);
  const wg = new THREE.CylinderGeometry(1, 1, 1, 96, 1, true);
  wg.translate(0, 0.5, 0);
  const wall = new THREE.Mesh(wg, new THREE.MeshBasicMaterial({ color: corParede, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  wall.position.set(...centro);
  scene.add(ring, wall);

  const raio = (t) => Math.max(0.01, (t - t0) * velocidade);
  function update(t) {
    const age = t - t0;
    const R = raio(t);
    ring.visible = wall.visible = age > 0;
    ring.scale.set(R, R, 1);
    ring.material.opacity = 0.95 * (1 - range(age, 0.6, 1.8));
    wall.scale.set(R, lerp(altura[0], altura[1], range(age, 0, 1.6)), R);
    wall.material.opacity = 0.38 * (1 - range(age, 0.4, 1.8));
  }
  return { ring, wall, raio, update };
}

export function createShake(seed = 3303) {
  const r = mulberry32(seed);
  const SH = Array.from({ length: 4 }, () => ({ f: 18 + r() * 22, ph: r() * 6.28, a: 0.5 + r() * 0.5 }));
  const onda = (t, k) => SH.reduce((acc, s, i) => acc + Math.sin(t * s.f * (1 + 0.13 * k) + s.ph + k * 1.7 + i) * s.a, 0) / 2.5;
  const _v = new THREE.Vector3();
  return {
    onda,
    // desloca a câmera e devolve o deslocamento do alvo (some no lookAt)
    aplicar(camera, t, { t0 = 0, amp = 3.2, decai = 2.4 } = {}) {
      const age = t - t0;
      if (age < 0) return _v.set(0, 0, 0);
      const a = amp * Math.exp(-age * decai);
      camera.position.x += onda(t, 0) * a;
      camera.position.y += onda(t, 1) * a;
      camera.position.z += onda(t, 2) * a;
      return _v.set(onda(t, 3) * a * 0.8, 0, 0);
    },
  };
}
