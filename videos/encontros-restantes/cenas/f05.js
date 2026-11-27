/*META {"imports": ["encontros"], "rotulos": [], "D0": 4.54} */
const E = ENCONTROS;
await E.prepara();
const st = E.palcoDoc(T, canvas, { fov: 34 });
const S = st.scene, cam = st.cam;
// uma barra por ano de vida (0–60): altura = tempo com os pais. Quase tudo fica na infância.
const N = 60, W = 0.05, geo = new THREE.BoxGeometry(W * 0.8, 1, W * 0.8);
const m = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x7cc8ff, emissiveIntensity: 0.55, roughness: 0.35 });
const im = new THREE.InstancedMesh(geo, m, N); im.frustumCulled = false; S.add(im);
const alt = (i) => (i < 18 ? 1.25 - 0.012 * i : 0.09 * Math.exp(-(i - 18) / 14) + 0.03), x0 = -N * W / 2;
const o = new THREE.Object3D(), cor = new THREE.Color(), azul = new THREE.Color(0x9fd6ff), cinza = new THREE.Color(0x3a4048), lar = new THREE.Color(0xff8a4c);
const agora = new THREE.Mesh(new THREE.BoxGeometry(0.012, 1.6, 0.012), new THREE.MeshBasicMaterial({ color: 0xffffff })); S.add(agora);
const ponto = E.brilho(0xffffff, 0.35, "suave", 1); S.add(ponto);
const al = new THREE.Vector3(), v = new THREE.Vector3();
for (let i = 0; i < N; i++) im.setColorAt(i, azul);
function render(t) {
  const VOC = 32, xa = x0 + (lerp(0, VOC, ease.inOutSine(range(t, 2.6, 3.4))) + 0.5) * W;
  for (let i = 0; i < N; i++) { const k = ease.outCubic(range(t, 0.2 + i * 0.03, 0.8 + i * 0.03)), h = Math.max(0.001, alt(i) * k);
    o.position.set(x0 + (i + 0.5) * W, h / 2, 0); o.scale.set(1, h, 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
    const pass = x0 + (i + 0.5) * W < xa && t > 2.6;
    im.setColorAt(i, cor.copy(azul).lerp(i < 18 ? lar : cinza, pass ? (i < 18 ? 0.5 + 0.5 * range(t, 3.82, 4.1) : 0.8) : 0)); }
  im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
  agora.position.set(xa, 0.8, 0.02); agora.visible = t > 2.6; ponto.position.set(xa, 1.62, 0.02); ponto.visible = t > 2.6;
  const e = ease.inOutSine(range(t, 0, 4.54));
  cam.position.set(lerp(-1.1, 0.2, e), lerp(0.7, 0.95, e), lerp(2.6, 4.0, e)); al.set(lerp(-0.9, -0.05, e), lerp(0.5, 0.35, e), 0); cam.lookAt(al);
  st.bloom = 0.8; st.draw();
  const c = st.ctx;
  E.txt(c, "TEMPO COM OS PAIS", 540, 985, { tam: 30, cor: E.AZUL, a: range(t, 1.95, 2.25), esp: 0.3 });
  E.tag(c, "VOCÊ HOJE", v.set(xa, 1.62, 0), cam, range(t, 2.75, 3.0), { dy: -90, dx: 60 });
  E.tag(c, "JÁ PASSOU", v.set(x0 + 25 * W, 0.12, 0), cam, range(t, 2.93, 3.2), { cor: "#9aa4b0", dy: 150, dx: -40 });
  E.tag(c, "INFÂNCIA", v.set(x0 + 9 * W, 1.2, 0), cam, range(t, 3.82, 4.05), { cor: E.LARANJA, dy: -110, dx: -60 });
}
