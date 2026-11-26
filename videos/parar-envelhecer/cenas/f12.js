/*META {"imports": ["idade"], "rotulos": [], "D0": 5.72, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const ID = IDADE;
await ID.prepara();
const st = ID.palcoDoc(T, canvas, { fov: 34, ceu: "#02040a" });
const S = st.scene, cam = st.cam;
st.scene.children.filter((o) => o.geometry && o.geometry.type === "CircleGeometry").forEach((o) => (o.visible = false));
// Terra facetada: continentes secos e cinzentos que esverdeiam a partir de um ponto em "cuidasse melhor"
const geo = new THREE.IcosahedronGeometry(1, 4), P = geo.attributes.position, cor = new Float32Array(P.count * 3), base = [];
const ruido = (x, y, z) => Math.sin(x * 3.1 + 1.3) * Math.cos(y * 2.7 - 0.4) + Math.sin(z * 3.7 + x * 1.9) * 0.7 + Math.sin(y * 5.3 + z * 4.1) * 0.35;
const ORIG = new THREE.Vector3(0.3, 0.4, 0.86).normalize(), q = new THREE.Vector3();
for (let i = 0; i < P.count; i += 3) { q.set(0, 0, 0); for (let j = 0; j < 3; j++) q.add(new THREE.Vector3().fromBufferAttribute(P, i + j)); q.normalize();
  const terra = ruido(q.x, q.y, q.z) > 0.35, gelo = Math.abs(q.y) > 0.88; for (let j = 0; j < 3; j++) base.push([terra, gelo, q.angleTo(ORIG)]); }
geo.setAttribute("color", new THREE.BufferAttribute(cor, 3));
const terra = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.7 })); terra.position.y = 1.2; S.add(terra);
const atm = ID.brilho(0x6ab8ff, 3.0, "suave", 0.55); atm.position.copy(terra.position); atm.position.z = -0.3; S.add(atm);
const est = new THREE.BufferGeometry(), r = mulberry32(9), ep = []; for (let i = 0; i < 500; i++) { const a = r() * 6.283, b = r() * 2 - 1, R = 30; ep.push(Math.cos(a) * Math.sqrt(1 - b * b) * R, b * R, Math.sin(a) * Math.sqrt(1 - b * b) * R - 10); }
est.setAttribute("position", new THREE.Float32BufferAttribute(ep, 3)); S.add(new THREE.Points(est, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06 })));
st.key.position.set(-4, 3, 5);
const al = new THREE.Vector3(), c3 = new THREE.Color(), seco = new THREE.Color(0x8a7a62), verde = new THREE.Color(0x3f8a3a), mar = new THREE.Color(0x1d4a8a), gelo = new THREE.Color(0xeef4ff);
function render(t) {
  const onda = ease.inOutSine(range(t, 2.75, 5.0)) * 3.3;
  base.forEach(([tt, g, ang], i) => { if (g) c3.copy(gelo); else if (!tt) c3.copy(mar); else c3.copy(seco).lerp(verde, Math.min(1, Math.max(0, (onda - ang) / 0.4)));
    cor[i * 3] = c3.r; cor[i * 3 + 1] = c3.g; cor[i * 3 + 2] = c3.b; });
  geo.attributes.color.needsUpdate = true;
  terra.rotation.y = -0.4 + t * 0.12; terra.rotation.x = 0.2;
  const e = ease.inOutSine(range(t, 0, 5.72));
  cam.position.set(lerp(1.6, -0.6, e), lerp(1.7, 1.4, e), lerp(11, 8.5, e)); al.set(0, lerp(0.7, 0.75, e), 0); cam.lookAt(al);
  st.bloom = 0.7; st.draw();
  const c = st.ctx;
  ID.txt(c, "TANTO TEMPO PELA FRENTE", 540, 700, { tam: 30, cor: ID.AZUL, a: range(t, 0.48, 0.8) * (1 - range(t, 2.5, 2.7)), esp: 0.28 });
  ID.txt(c, "CUIDAR MELHOR DO PLANETA", 540, 985, { tam: 34, cor: "#fff", a: range(t, 3.26, 3.5), esp: 0.2 });
}
