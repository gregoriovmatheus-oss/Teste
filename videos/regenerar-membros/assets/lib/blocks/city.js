/**
 * city.js — cidade-maquete (grade de quadras, carros, árvores) com geada e camada de neve. De f01/f05/f10/f11.
 *
 *   const c = createCity(scene, { seed: 7, geada: [4.6, 4.95], neve: [1, 3, 1], carros: 14, paraEm: 4.6 });
 *   c.update(t)          aplica geada, neve, carros, névoa e luz no tempo t
 *   c.setGeada(0..1)     controle direto (se preferir animar à mão)
 *   c.setNeve(0..1)      espessura da camada branca (0 = sem neve)
 *
 * geada / neve: número fixo ou [t0, t1] (rampa 0→1) ou [t0, t1, max].
 * Câmeras usadas no vídeo original: aérea alta (y 300→175 olhando a origem, up girado),
 *   rasante na borda da avenida (y 4-8, z = c.borda + 22, olhando para dentro).
 */
import * as THREE from "../three.module.js";
import { PALETTE, buildCityGrid, setFrost, addMaqueteLights, maqueteMaterial, range, lerp, ease } from "../kit.js";

const rampa = (v, t) => {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const [a, b, max = 1] = v;
  return ease.outCubic(range(t, a, b)) * max;
};

export function createCity(scene, {
  seed = 7, cols = 8, rows = 11, maxH = 38,
  geada = null, neve = null,
  carros = 14,            // velocidade dos carros (unidades/s); 0 = parados
  paraEm = Infinity,      // carros congelam neste tempo
  tabuleiro = false,      // base da maquete (borda visível em close); liga sozinho se houver neve
  ceu = 0x9aa3ae, ceuGelo = 0xd7e6f2, nevoa = [260, 520],
  luzes = true,
} = {}) {
  scene.background = new THREE.Color(ceu);
  scene.fog = new THREE.Fog(ceu, nevoa[0], nevoa[1]);
  const lights = luzes ? addMaqueteLights(scene, { intensity: 1, shadowSize: 200 }) : null;
  const city = buildCityGrid({ seed, cols, rows, maxH });
  scene.add(city.group);

  const BW = city.size.w + 20, BD = city.size.d + 20;
  let snow = null;
  if (tabuleiro || neve != null) {
    city.ground.visible = false;
    const board = new THREE.Mesh(new THREE.BoxGeometry(BW, 2.5, BD), maqueteMaterial(0x5d646e, { roughness: 0.9 }));
    board.position.y = -1.25;
    board.receiveShadow = true;
    scene.add(board);
  }
  if (neve != null) {
    const g = new THREE.BoxGeometry(BW, 1.0, BD);
    g.translate(0, 0.5, 0);
    snow = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xf6f9fc, roughness: 0.92, emissive: 0x8fcbf2, emissiveIntensity: 0.06 }));
    snow.receiveShadow = true;
    scene.add(snow);
  }

  const carBase = city.cars.map((c) => c.position.z);
  const cBase = new THREE.Color(ceu), cIce = new THREE.Color(ceuGelo);
  const kWarm = new THREE.Color(0xffe2bf), kIce = new THREE.Color(0xdbeeff);

  function setGeada(a) {
    setFrost(city.group, a);
    scene.fog.color.copy(cBase).lerp(cIce, a);
    scene.background.copy(scene.fog.color);
    if (lights) {
      lights.key.color.copy(kWarm).lerp(kIce, a);
      lights.key.intensity = lerp(2.6, 2.1, a);
    }
  }
  function setNeve(a) {
    if (!snow) return;
    snow.scale.y = Math.max(0.001, a);
    snow.visible = a > 0.001;
  }
  function update(t) {
    const mt = Math.min(t, paraEm);
    city.cars.forEach((c, i) => { c.position.z = carBase[i] + c.userData.dir * carros * mt; });
    if (geada != null) setGeada(rampa(geada, t));
    if (neve != null) setNeve(rampa(neve, t));
  }

  return { ...city, lights, snow, borda: BD / 2, setGeada, setNeve, update };
}
