/*META {"imports": ["lowpoly", "cinema", "relogio"], "rotulos": [], "D0": 5.02} */
const LP = LOWPOLY, CI = CINEMA, R = RELOGIO, Y = R.ANOS;
await R.prepara();
const st = LP.palco(canvas, { foco: 2.4, faixa: 0.8, desfoque: 20, bloom: 1.0, raios: 0.4 });
const { S, cam } = st;
LP.luz(st, "noite"); st.exposicao = 1.15;
CI.cenario(S, "rua", { seed: 21 }); CI.ceu(S, { topo: 0x0a1030, horizonte: 0x3a2a5a, estrelas: 200 });
LP.bokeh(S, { n: 40, seed: 12, y: [0.6, 4], z: [-24, -12], cores: [0xffc07a, 0x7cc8ff, 0xff8a4c, 0xfff0d0] });
[-6, -11].forEach((z) => CI.luzPratica(S, "poste", [-4.2, 0.11, z], { forca: 0.8 }));
// herói secreto: corre pela calçada à noite; ao passar, o relógio de um estranho sai do laranja (minutos) para o azul (anos)
const eu = R.heroi(LP); eu.root.rotation.y = Math.PI; S.add(eu.root);
const zS = 3.6 - 2.6 * 3.9;   // onde você estará em 3,9 s
const st1 = LP.pessoa({ seed: 66, roupa: "camiseta", camisa: 0x6a8a3a, pele: 0x8a5a3e, cabelo: 0x140c08, barba: false }); st1.root.position.set(-3.95, 0.11, zS - 0.4); st1.root.rotation.y = 0.9; S.add(st1.root);
const F = R.multidao(LP, S, [[-2.6, -14, 101, 0x3d5a80, 0], [-4.4, -18, 102, 0x7a3b3b, 0], [3.4, -12, 103, 0x4a6b4a, 0.5, 1]]);
F.forEach((f) => (f.root.position.y = 0.11));
const h = new THREE.Vector3(), v = new THREE.Vector3(), hs = new THREE.Vector3();
function render(t) {
  R.andaMultidao(LP, F, t); F.forEach((f) => (f.root.position.y = 0.11));
  const d = LP.ator(eu, t, { seed: 18, correr: { vel: 1 }, emocao: ["foco", "alegre", range(t, 3.9, 4.4)] });
  eu.root.position.set(-3.1, 0.11, 3.6 - d);
  LP.ator(st1, t, { seed: 66, emocao: t < 3.8 ? "calmo" : ["calmo", "surpresa", range(t, 3.8, 4.2)], olharPara: t > 3.4 ? eu.cab.getWorldPosition(v) : undefined, olharK: 0.7 });
  eu.cab.getWorldPosition(h);
  const e = ease.inOutSine(range(t, 0, 5.02));
  R.mira(cam, v.set(h.x + lerp(1.1, 1.5, e), lerp(0.85, 1.2, e), h.z - lerp(2.3, 3.0, e)), h, 790, lerp(560, 640, e)); LP.camMao(cam, t, { seed: 11, intens: 1.6 });
  LP.focar(st, h); CI.preenche(st, h, { forca: 1.5, cor: 0xd8e6ff }); CI.movimento(st, 0, 0.002);
  st.draw();
  const c = st.ctx;
  const salvo = range(t, 3.82, 4.05);
  R.relogio(c, salvo > 0.5 ? 52 * Y + 7e6 - t : 4 * 60 + 12 - t, st1, cam, range(t, 2.4, 2.7), { tam: 44, sobe: 0.26, cor: salvo > 0.5 ? R.AZUL : R.LARANJA, glitch: salvo * (1 - range(t, 4.05, 4.3)), t, pulso: LP.mola(t, 4.05, 1, 2.2, 5), rotulo: salvo > 0.5 ? "SALVO" : "ESTRANHO" });
  R.titulo(c, "SE O RELÓGIO MUDAR", ["um *herói secreto*"], range(t, 1.55, 1.85) * (1 - range(t, 3.4, 3.6)), { y: 975, tam: 56, kTam: 24 });
  R.txt(c, "SALVANDO ESTRANHOS", 540, 985, { tam: 32, cor: R.LARANJA, a: range(t, 3.82, 4.05), esp: 0.22 });
}
