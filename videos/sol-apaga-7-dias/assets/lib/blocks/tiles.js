/**
 * tiles.js — diorama de massinha (R04): blocos isométricos de cantos arredondados com base em camadas.
 * Cada bloco tem um `topo` (Group em y = altura do bloco) para pôr o mini-mundo (city.js em escala, casas, árvores...).
 *
 *   const d = createTiles(scene, { grade: [3, 3], cores: ["#7CC54A", "#3FB6C8", ...] });
 *   d.tiles[4].topo.add(minhaCasa)
 *   d.update(t)                          blocos sobem um a um (pop-in) a partir de opts.entrada
 *   d.isoCam(cam, indice, zoom)          câmera isométrica no bloco `indice` (zoom 1 = grade inteira)
 * Fundo #111111. Camadas da base: creme e laranja, como a referência.
 */
import * as THREE from "../three.module.js";
import { maqueteMaterial, ease, range, clamp, lerp } from "../kit.js";

function roundedSlab(size, h, r) {
  const s = size / 2 - r;
  const shape = new THREE.Shape();
  shape.moveTo(-s, -s - r);
  shape.lineTo(s, -s - r); shape.quadraticCurveTo(s + r, -s - r, s + r, -s);
  shape.lineTo(s + r, s); shape.quadraticCurveTo(s + r, s + r, s, s + r);
  shape.lineTo(-s, s + r); shape.quadraticCurveTo(-s - r, s + r, -s - r, s);
  shape.lineTo(-s - r, -s); shape.quadraticCurveTo(-s - r, -s - r, -s, -s - r);
  const bev = Math.min(r * 0.5, h * 0.35);
  const g = new THREE.ExtrudeGeometry(shape, { depth: h - 2 * bev, bevelEnabled: true, bevelSize: bev, bevelThickness: bev, bevelSegments: 4, curveSegments: 10 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bev, 0);
  return g;
}

export function createTiles(scene, {
  grade = [3, 3], tamanho = 30, vao = 6, raio = 4,
  cores = ["#7CC54A", "#3FB6C8", "#F3D9A4", "#7CC54A", "#F08A3C", "#3FB6C8", "#F3D9A4", "#7CC54A", "#E5463A"],
  camadas = [["#F3D9A4", 3], ["#F08A3C", 4]],   // base de baixo para cima: [cor, altura]
  topo = 2.5,
  entrada = null,                                 // [t0, intervalo]: pop-in em sequência; null = já montado
  fundo = 0x111111,
} = {}) {
  scene.background = new THREE.Color(fundo);
  const [cx, cz] = grade;
  const pitch = tamanho + vao;
  const tiles = [];
  const geos = new Map();
  const geo = (h) => { const k = h.toFixed(2); if (!geos.has(k)) geos.set(k, roundedSlab(tamanho, h, raio)); return geos.get(k); };
  let i = 0;
  for (let z = 0; z < cz; z++) {
    for (let x = 0; x < cx; x++, i++) {
      const g = new THREE.Group();
      g.position.set((x - (cx - 1) / 2) * pitch, 0, (z - (cz - 1) / 2) * pitch);
      let y = 0;
      for (const [cor, h] of camadas) {
        const m = new THREE.Mesh(geo(h), maqueteMaterial(cor, { roughness: 0.75 }));
        m.position.y = y; m.castShadow = m.receiveShadow = true; g.add(m); y += h;
      }
      const top = new THREE.Mesh(geo(topo), maqueteMaterial(cores[i % cores.length], { roughness: 0.7 }));
      top.position.y = y; top.receiveShadow = top.castShadow = true; g.add(top); y += topo;
      const conteudo = new THREE.Group(); conteudo.position.y = y; g.add(conteudo);
      scene.add(g);
      tiles.push({ group: g, topo: conteudo, altura: y });
    }
  }
  const ext = Math.max(cx, cz) * pitch;

  function update(t) {
    if (!entrada) return;
    const [t0, dt] = entrada;
    tiles.forEach((tile, k) => {
      const p = clamp((t - t0 - k * dt) / 0.45);
      const s = p <= 0 ? 0.001 : ease.outBack(p);
      tile.group.scale.set(s, s, s);
      tile.group.position.y = lerp(-20, 0, ease.outCubic(p));
    });
  }

  const alvo = new THREE.Vector3();
  function isoCam(cam, indice = null, zoom = 1) {
    if (indice == null) alvo.set(0, 0, 0); else alvo.copy(tiles[indice].group.position).setY(tiles[indice].altura);
    const d = (indice == null ? ext * 2.6 : pitch * 3.4) / zoom;
    cam.position.set(alvo.x + d * 0.62, alvo.y + d * 0.72, alvo.z + d * 0.62);
    cam.up.set(0, 1, 0);
    cam.lookAt(alvo);
  }
  update(0);
  return { tiles, update, isoCam };
}
