/*META {"imports": ["relogio"], "rotulos": [], "D0": 6.81} */
const R = RELOGIO;
await R.prepara();
const st = R.palcoDoc(T, canvas, { fov: 34 });
const S = st.scene, cam = st.cam;
// idade em que as pessoas morrem (0–100 anos): poucas cedo, o pico perto dos 80; a medicina só lê chances nessa curva
const N = 101, W = 0.03, geo = new THREE.BoxGeometry(W * 0.78, 1, W * 0.78);
const m = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x7cc8ff, emissiveIntensity: 0.55, roughness: 0.35 });
const im = new THREE.InstancedMesh(geo, m, N); im.frustumCulled = false; S.add(im);
const g = (a) => Math.exp((a - 84) / 9) * Math.exp(-Math.exp((a - 84) / 9));
const dist = (a) => (a === 0 ? 0.22 : 0.012 + (a < 40 ? 0.004 * a / 40 : 0)) * 0.6 + 2.3 * g(a), x0 = -N * W / 2;
const o = new THREE.Object3D(), cor = new THREE.Color(), azul = new THREE.Color(0x9fd6ff), lar = new THREE.Color(0xff8a4c);
const marca = new THREE.Mesh(new THREE.BoxGeometry(0.012, 1, 0.012), new THREE.MeshBasicMaterial({ color: 0xff8a4c })); S.add(marca);
const ponto = R.brilho(0xff8a4c, 0.4, "suave", 0); S.add(ponto);
const al = new THREE.Vector3(), v = new THREE.Vector3(), XM = x0 + 76.5 * W;
for (let i = 0; i < N; i++) im.setColorAt(i, azul);
function render(t) {
  for (let i = 0; i < N; i++) { const k = ease.outCubic(range(t, 0.3 + i * 0.016, 0.9 + i * 0.016)), hh = Math.max(0.001, 1.4 * dist(i) * k);
    o.position.set(x0 + (i + 0.5) * W, hh / 2, 0); o.scale.set(1, hh, 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
    im.setColorAt(i, cor.copy(azul).lerp(lar, Math.abs(i - 76) < 1 ? range(t, 5.35, 5.7) : 0)); }
  im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
  const km = ease.outCubic(range(t, 5.35, 5.9)); marca.scale.y = Math.max(0.001, 1.5 * km); marca.position.set(XM, 0.75 * km, 0.02); marca.visible = km > 0;
  ponto.position.set(XM, 1.5 * km, 0.02); ponto.material.opacity = km;
  const e = ease.inOutSine(range(t, 0, 6.81));
  cam.position.set(lerp(-1.3, 0.85, e), lerp(0.45, 0.9, e), lerp(1.8, 3.6, e)); al.set(lerp(-1.2, 0.8, e), lerp(0.3, 0.55, e), 0); cam.lookAt(al);
  st.bloom = 0.8; st.draw();
  const c = st.ctx;
  R.txt(c, "IDADE AO MORRER · CHANCES", 540, 700, { tam: 26, cor: R.AZUL, a: range(t, 0.52, 0.8), esp: 0.26 });
  R.txt(c, "SÓ ESTIMA CHANCES", 540, 985, { tam: 32, cor: "#fff", a: range(t, 1.72, 2.0) * (1 - range(t, 2.7, 2.85)), esp: 0.22 });
  R.tag(c, "0 ANOS", v.set(x0 + 0.5 * W, 0.02, 0), cam, range(t, 0.6, 0.9) * (1 - range(t, 2.7, 2.9)), { dy: 120, tam: 20, cor: "#9aa4b0" });
  R.txt(c, "BRASIL · EXPECTATIVA DE VIDA", 540, 985, { tam: 28, cor: R.AZUL, a: range(t, 3.04, 3.3), esp: 0.2 });
  R.numero(c, "76 ANOS", 300, 690, range(t, 5.35, 5.6), { tam: 92, cor: "#ff8a4c" });
}
