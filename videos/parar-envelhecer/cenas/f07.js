/*META {"imports": ["idade"], "rotulos": [], "D0": 5.84, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const ID = IDADE;
await ID.prepara();
const st = ID.palcoDoc(T, canvas, { fov: 34 });
const S = st.scene, cam = st.cam;
// dupla hélice (30 degraus) girando; à volta, células se dividindo; depois degraus viram laranja (erros)
const G = new THREE.Group(); G.position.y = 1.4; S.add(G);
const bA = new THREE.MeshStandardMaterial({ color: 0x9fd6ff, emissive: 0x7cc8ff, emissiveIntensity: 0.5, roughness: 0.3 });
const esf = new THREE.IcosahedronGeometry(0.06, 1), deg = [], NR = 30;
for (let i = 0; i < NR; i++) { const a = i * 0.42, y = (i - NR / 2) * 0.11, g = new THREE.Group(); g.position.y = y; g.rotation.y = a; G.add(g);
  [-1, 1].forEach((s) => { const b = new THREE.Mesh(esf, bA); b.position.x = s * 0.42; g.add(b); });
  const m = new THREE.MeshStandardMaterial({ color: 0xdfe8ff, emissive: 0x7cc8ff, emissiveIntensity: 0.25, roughness: 0.4 });
  const r = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.84, 6), m); r.rotation.z = Math.PI / 2; g.add(r); deg.push({ m, r }); }
const ERROS = [5, 11, 16, 20, 24, 8, 27], cel = [];
for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.283 + 0.5, c = new THREE.Group(); c.position.set(Math.cos(a) * 1.5, 0.5 + 0.6 * (i % 2), Math.sin(a) * 1.0 - 0.6); S.add(c);
  const par = [0, 1].map(() => { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 2), new THREE.MeshStandardMaterial({ color: 0x9fe0c0, transparent: true, opacity: 0.4, roughness: 0.2, emissive: 0x3a8a6a, emissiveIntensity: 0.3 }));
    const n = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 1), new THREE.MeshStandardMaterial({ color: 0x4a7aff, emissive: 0x2a4aaa, emissiveIntensity: 0.5 })); s.add(n); c.add(s); return s; }); cel.push(par); }
const al = new THREE.Vector3(), v = new THREE.Vector3();
function render(t) {
  G.rotation.y = t * 0.5;
  cel.forEach((par, i) => { const k = ease.inOutCubic(range(t, 0.6 + i * 0.25, 1.8 + i * 0.25)); par.forEach((s, j) => { s.position.x = (j ? 1 : -1) * 0.2 * k; s.scale.set(1 - 0.25 * k + 0.25 * Math.sin(k * Math.PI) * 0.6, 1, 1); s.material.opacity = 0.4 * (1 - range(t, 2.6, 3.2)); }); });
  ERROS.forEach((i, n) => { const k = range(t, 3.31 + n * 0.22, 3.5 + n * 0.22), d = deg[i]; d.m.color.setRGB(lerp(0.87, 1, k), lerp(0.91, 0.54, k), lerp(1, 0.3, k)); d.m.emissive.setRGB(lerp(0.49, 1, k), lerp(0.78, 0.45, k), lerp(1, 0.2, k)); d.m.emissiveIntensity = 0.25 + 1.2 * k; d.r.scale.y = 1 - 0.3 * k * (n % 2); });
  const e = ease.inOutSine(range(t, 0, 5.84));
  cam.position.set(lerp(-1.6, 1.2, e), lerp(1.9, 1.1, e), lerp(5.6, 2.6, e)); al.set(0, lerp(0.95, 0.85, e), 0); cam.lookAt(al);
  st.bloom = 0.8; st.draw();
  const c = st.ctx;
  ID.tag(c, "CÉLULAS NOVAS", cel[0][1].getWorldPosition(v), cam, range(t, 1.3, 1.55) * (1 - range(t, 2.5, 2.7)), { dy: -40 });
  ID.txt(c, "DNA", 540, 700, { tam: 30, cor: ID.AZUL, a: range(t, 2.69, 2.9), esp: 0.4 });
  ID.tag(c, "ERROS", deg[ERROS[2]].r.getWorldPosition(v), cam, range(t, 4.48, 4.7), { cor: ID.LARANJA, dx: 200, dy: 120 });
  ID.txt(c, "SE ACUMULAM COM O TEMPO", 540, 985, { tam: 28, cor: "#fff", a: range(t, 4.84, 5.1), esp: 0.2 });
}
