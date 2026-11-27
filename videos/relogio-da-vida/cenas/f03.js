/*META {"imports": ["lowpoly", "cinema", "relogio"], "rotulos": [], "D0": 5.09} */
const LP = LOWPOLY, CI = CINEMA, R = RELOGIO;
await R.prepara();
const st = LP.palco(canvas, { foco: 1.0, faixa: 0.45, desfoque: 24, bloom: 0.85, raios: 0.4 });
const { S, cam } = st;
LP.luz(st, "por-do-sol"); st.exposicao = 1.1;
CI.cenario(S, "rua", { seed: 9 }); CI.ceu(S, { topo: 0x3a4a7a, horizonte: 0xffb07a });
st.sol(new THREE.Vector3(6, 3, -30), 0.8);
LP.bokeh(S, { n: 28, seed: 9, y: [0.8, 3.5], z: [-16, -8], cores: [0xffc07a, 0xff8a4c, 0xfff0d0] });
// você na calçada: primeiro hesita; depois grita "cuidado hoje!" e ninguém para
const eu = R.heroi(LP); eu.root.position.set(-3.0, 0.11, 0); eu.root.rotation.y = 0.5; S.add(eu.root);
const F = R.multidao(LP, S, [[-5.4, -1.2, 81, 0x3d5a80, 0.7, 1], [-1.0, -0.6, 82, 0x7a3b3b, 0.6, -1], [-4.4, -3.6, 83, 0x4a6b4a, 0.8, 1], [-1.6, -4.4, 84, 0x6b5a7a, 0.5, -1], [-3.6, -7.0, 85, 0x8a6a3a, 0]]);
F.forEach((f) => (f.root.position.y = 0.11));
const C1 = 1.75, h = new THREE.Vector3(), v = new THREE.Vector3();
function render(t) {
  R.andaMultidao(LP, F, t); F.forEach((f) => (f.root.position.y = 0.11));
  const grita = range(t, 3.5, 3.75);
  LP.ator(eu, t, { seed: 18, pose: t > 3.4 ? [["apontar", ease.outBack(grita)]] : undefined, gestos: t > 1.75 && t < 3.5 ? { intens: 0.7 } : undefined,
    emocao: t < C1 ? ["foco", "nervoso", range(t, 0.4, 1.2)] : t < 3.5 ? "nervoso" : ["nervoso", "grito", grita], olhar: t < C1 ? [0.35, 0.05] : undefined, fala: t > 1.9 && t < 3.5 ? true : undefined });
  if (t > 3.5) eu.cab.rotation.x -= 0.12 * grita;
  eu.cab.getWorldPosition(h);
  if (t < C1) CI.plano(st, h, t, t / C1, "close", { lado: -1, seed: 4 });
  else { const u = ease.inOutSine(range(t, C1, 5.09)); R.mira(cam, v.set(lerp(-0.6, -0.9, u), lerp(1.2, 1.1, u), lerp(3.2, 2.6, u)), h, 760, 560); LP.camMao(cam, t, { seed: 6, intens: 1 + grita }); LP.focar(st, h); }
  CI.preenche(st, h, { forca: 1.3 });
  st.draw();
  const c = st.ctx;
  R.txt(c, "AVISAR?", 540, 985, { tam: 40, cor: "#fff", a: range(t, 1.07, 1.3) * (1 - range(t, 1.6, 1.75)), esp: 0.3 });
  R.txt(c, "NINGUÉM ACREDITARIA", 540, 985, { tam: 30, cor: R.AZUL, a: range(t, 2.22, 2.5) * (1 - range(t, 3.9, 4.05)), esp: 0.24 });
  R.numero(c, "CUIDADO HOJE!", 540, 960, range(t, 4.11, 4.3), { tam: 84, cor: "#ff8a4c" });
}
