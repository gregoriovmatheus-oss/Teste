/*META {"imports": ["relogio"], "rotulos": [], "D0": 5.43} */
const R = RELOGIO;
await R.prepara();
const st = R.palcoDoc(T, canvas, { fov: 36, ceu: "#04060a" });
const S = st.scene, cam = st.cam;
st.key.color.set(0xb8d0ff); st.key.intensity = 1.4;
// torres frias em volta de uma praça; em cada topo, um olho de câmera que vira para o ponto no meio (você e o seu poder)
const r = mulberry32(9), TORRES = [], geo = new THREE.BoxGeometry(1, 1, 1);
const mT = new THREE.MeshStandardMaterial({ color: 0x1a2230, roughness: 0.35, metalness: 0.4 });
const jan = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.09, 0.12), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), 900); jan.frustumCulled = false; S.add(jan);
const o = new THREE.Object3D(), cor = new THREE.Color(); let nj = 0;
for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283 + 0.3, d = 2.4 + r() * 0.8, w = 0.6 + r() * 0.3, hh = 1.6 + r() * 2.2;
  const m = new THREE.Mesh(geo, mT); m.scale.set(w, hh, w); m.position.set(Math.cos(a) * d, hh / 2, Math.sin(a) * d - 0.5); m.rotation.y = -a; S.add(m); TORRES.push([m, w, hh]);
  for (let k = 0; k < 90 && nj < 900; k++) { const fx = ((k % 5) - 2) * 0.16 * w / 0.8, fy = 0.25 + Math.floor(k / 5) * 0.2; if (fy > hh - 0.2) break;
    o.position.set(fx, fy - hh / 2, w / 2 + 0.002); o.rotation.set(0, 0, 0); o.updateMatrix(); const M = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().compose(m.position, m.quaternion, new THREE.Vector3(1, hh, 1)), o.matrix);
    M.multiply(new THREE.Matrix4().makeScale(1, 1 / hh, 1)); jan.setMatrixAt(nj, M); jan.setColorAt(nj, cor.setHex(r() < 0.3 ? 0x9fc8ff : 0x1c2a3a)); nj++; } }
jan.count = nj;
const centro = new THREE.Vector3(0, 0.12, -0.5);
const nucleo = R.brilho(0xff8a4c, 0.9, "suave", 1); nucleo.position.copy(centro); S.add(nucleo);
const OLHOS = TORRES.map(([m, w, hh], i) => { const g = new THREE.Group(); g.position.set(m.position.x, hh + 0.12, m.position.z); S.add(g);
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.28), new THREE.MeshStandardMaterial({ color: 0xd8dde4, roughness: 0.4 })); g.add(corpo);
  const lente = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 14), new THREE.MeshStandardMaterial({ color: 0x0a0a0c, emissive: 0xff2a2a, emissiveIntensity: 0 })); lente.rotation.x = Math.PI / 2; lente.position.z = 0.15; g.add(lente);
  const bri = R.brilho(0xff3a3a, 0.35, "suave", 0); bri.position.z = 0.18; g.add(bri); return { g, lente, bri, ph: r() * 6.283 }; });
const al = new THREE.Vector3(), v = new THREE.Vector3();
const ROT = [[0, "EMPRESAS", 0.1], [3, "SEGURADORAS", 0.65], [6, "GOVERNOS", 1.53]];
function render(t) {
  OLHOS.forEach((O, i) => { const k = ease.inOutCubic(range(t, 2.1 + i * 0.08, 2.9 + i * 0.08)); O.g.lookAt(centro); const ry = O.g.rotation.y;
    O.g.rotation.set(O.g.rotation.x * k, ry + (1 - k) * Math.sin(t * 0.7 + O.ph) * 1.2, O.g.rotation.z * k);
    O.lente.material.emissiveIntensity = 0.3 + 2.5 * k; O.bri.material.opacity = 0.2 + 0.8 * k * (0.75 + 0.25 * Math.sin(t * 6 + i)); });
  nucleo.scale.setScalar(0.6 + 0.12 * Math.sin(t * 3));
  const e = ease.inOutSine(range(t, 0, 5.43));
  cam.position.set(Math.sin(lerp(0.5, -0.3, e)) * lerp(6.2, 4.6, e), lerp(5.2, 2.6, e), Math.cos(lerp(0.5, -0.3, e)) * lerp(6.2, 4.6, e)); al.set(0, lerp(0.4, 1.2, e), -0.5); cam.lookAt(al);
  st.bloom = 0.9; st.draw();
  const c = st.ctx;
  ROT.forEach(([i, s, t0]) => R.tag(c, s, v.copy(OLHOS[i].g.position), cam, range(t, t0, t0 + 0.25), { cor: "#c8d8ff", dy: -70, tam: 22 }));
  R.tag(c, "VOCÊ", v.copy(centro), cam, range(t, 2.79, 3.0), { cor: R.LARANJA, dy: 90, tam: 22 });
  R.txt(c, "PERIGOSO DEMAIS", 540, 985, { tam: 40, cor: R.LARANJA, a: range(t, 4.12, 4.35), esp: 0.24 });
}
