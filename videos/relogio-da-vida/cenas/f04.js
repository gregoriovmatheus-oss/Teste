/*META {"imports": ["terra", "relogio"], "rotulos": [], "D0": 6.56} */
const R = RELOGIO;
await R.prepara();
const st = T.createToyStage(canvas, { fov: 40, ceu: ["#000000", "#02030a"], nevoa: null, nuvens: 0, exposicao: 1.0 });
const S = st.scene, cam = st.cam;
S.environment = null; st.hemi.intensity = 0.04; st.key.intensity = 0; st.rim.intensity = 0; st.key.castShadow = false;
S.add(TERRA.createCeu({ seed: 21, n: 4500, via: 0.5 }));
const E = await TERRA.createTerra({ raio: 1 }); S.add(E.group);
E.sol.set(1, 0.25, -0.35); E.u.nuvens.value = 0.45; E.u.luzes.value = 0.9; E.u.atmo.value = 1.1;
// faíscas quentes que acendem e se apagam pelo planeta (cada uma, um relógio chegando a zero); sem dramatizar
const N = 260, r = mulberry32(44), P = [];
for (let i = 0; i < N; i++) { const lat = -38 + r() * 95, lon = -120 + r() * 260; const s = R.brilho(i % 4 ? 0xffb070 : 0xff8a4c, 0.05, "suave", 0); s.position.copy(E.ponto(lon, lat, 1.006)); E.earth.add(s); P.push([s, r() * 3, 0.5 + r() * 0.8, lon, lat]); }
const TAGS = [[18, 12, "00:00:41"], [78, 22, "00:02:13"], [-47, -15, "00:00:09"], [115, 31, "00:05:58"]];
const al = new THREE.Vector3(), v = new THREE.Vector3();
function render(t) {
  E.aim(lerp(-10, 40, ease.inOutSine(range(t, 0, 6.56))), 12); E.nuv.rotation.y = t * 0.01;
  const dens = 0.35 + 0.65 * range(t, 1.1, 2.6);
  P.forEach(([s, ph, f], i) => { const c = ((t * f + ph) % 3) / 3, on = i / N < dens ? Math.max(0, 1 - Math.abs(c - 0.15) / 0.15) : 0; s.material.opacity = on; s.scale.setScalar(0.03 + 0.06 * on); });
  const e = ease.inOutSine(range(t, 0, 6.56));
  cam.position.set(lerp(0.4, -0.2, e), lerp(0.55, 0.35, e), lerp(3.6, 2.7, e)); al.set(0, lerp(-0.45, -0.35, e), 0); cam.lookAt(al);
  st.bloom = 0.8; st.draw();
  const c = st.ctx;
  R.txt(c, "TODO DIA", 540, 790, { tam: 28, cor: R.AZUL, a: range(t, 0.3, 0.6), esp: 0.34 });
  const k = ease.outCubic(range(t, 1.11, 1.99));
  R.odometro(c, 170000 * k, 540, 880, { tam: 120, a: range(t, 1.05, 1.25), cor: k > 0.99 ? "#ff8a4c" : null });
  R.txt(c, "PESSOAS NO MUNDO", 540, 975, { tam: 30, cor: "#fff", a: range(t, 2.22, 2.5), esp: 0.24 });
  TAGS.forEach(([lon, lat, s], i) => R.tag(c, s, E.earth.localToWorld(v.copy(E.ponto(lon, lat, 1.01))), cam, range(t, 4.88 + i * 0.12, 5.1 + i * 0.12), { cor: R.LARANJA, dy: -60 - (i % 2) * 40, dx: (i % 2 ? 50 : -50), tam: 22 }));
}
