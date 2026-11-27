/*META {"imports": ["lowpoly", "cinema", "relogio"], "rotulos": [], "D0": 5.91} */
const LP = LOWPOLY, CI = CINEMA, R = RELOGIO, Y = R.ANOS;
await R.prepara();
const st = LP.palco(canvas, { foco: 2.1, faixa: 0.6, desfoque: 26, bloom: 0.85, raios: 0.5 });
const { S, cam } = st;
LP.luz(st, "por-do-sol"); st.exposicao = 1.12;
CI.cenario(S, "rua", { seed: 3 }); CI.ceu(S, { topo: 0x2a3466, horizonte: 0xffa070 });
st.sol(new THREE.Vector3(-6, 3, -30), 0.9);
LP.bokeh(S, { n: 34, seed: 6, y: [0.8, 3.5], z: [-14, -6], cores: [0xffc07a, 0xff8a4c, 0x7cc8ff, 0xfff0d0] });
const poe = LP.poeira(S, { n: 50, centro: [0, 1.6, -0.5], raio: [1.2, 0.7, 1], cor: 0xffd8a0 });
// você em primeiro plano (surpreso) vê o relógio sobre a cabeça da moça que passa; ao fundo, cada um tem o seu
const eu = R.heroi(LP); eu.root.position.set(0.3, 0, 0); eu.root.rotation.y = -0.25; S.add(eu.root);
const pa = LP.pessoa({ seed: 61, feminina: true, roupa: "casaco", jaqueta: 0x3d6a5a, pele: 0xe0b898, cabelo: 0x5a2e16, iris: 0x3a5a3a }); pa.root.rotation.y = 1.25; S.add(pa.root);
const F = R.multidao(LP, S, [[-2.0, -6.5, 71, 0x3d5a80, 0.6, 1], [1.5, -8.0, 72, 0x7a3b3b, 0], [0.3, -10.5, 73, 0x4a6b4a, 0.5, -1], [-1.3, -12.0, 74, 0x6b5a7a, 0]]);
const SF = [52 * Y + 9e6, 17 * Y + 2e6, 63 * Y + 4e6, 8 * Y + 1e7], T0 = [1.0, 1.15, 1.3, 1.45];
const hP = new THREE.Vector3(), hE = new THREE.Vector3();
function render(t) {
  if (t < 0.17) st.T = 0.17;   // quadro 0 = miniatura: sem o dip escuro de entrada
  R.andaMultidao(LP, F, t);
  LP.ator(pa, t, { seed: 61, andar: { vel: 0.45 }, emocao: "calmo" }); pa.root.position.set(-0.95 + 0.11 * t, 0, -2.7 + 0.03 * t);
  pa.cab.getWorldPosition(hP);
  LP.ator(eu, t, { seed: 18, emocao: t < 3.6 ? "surpresa" : ["surpresa", "foco", range(t, 3.6, 4.4)], olharPara: hP, olharK: 0.75 });
  eu.cab.getWorldPosition(hE);
  const e = ease.inOutSine(range(t, 0, 5.91));
  R.mira(cam, new THREE.Vector3(lerp(-0.05, 0.08, e), 1.66, lerp(2.45, 2.0, e)), hE, 720, lerp(760, 740, e)); LP.camMao(cam, t, { seed: 3 });
  LP.focar(st, hE); CI.preenche(st, hE, { forca: 1.4 }); poe.update(t);
  st.draw();
  const c = st.ctx;
  R.relogio(c, 41 * Y + 207 * 86400 + 22492 - t, pa, cam, 1, { rotulo: "TEMPO RESTANTE", tam: 54, sobe: 0.24, pulso: LP.mola(t, 2.37, 1, 2.2, 5) });
  F.forEach((f, i) => R.relogio(c, SF[i] - t, f, cam, range(t, T0[i], T0[i] + 0.3), { tam: 26, sobe: 0.3, ymin: 560 }));
  R.titulo(c, "", ["E se você visse", "*o tempo que resta*?"], 1 - range(t, 2.0, 2.4), { y: 968, tam: 52 });
  R.txt(c, "SOBRE A CABEÇA", 540, 975, { tam: 30, cor: R.AZUL, a: range(t, 3.24, 3.5), esp: 0.3 });
}
