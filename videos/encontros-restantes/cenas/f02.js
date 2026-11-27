/*META {"imports": ["lowpoly", "cinema", "encontros"], "rotulos": [], "D0": 3.49} */
const LP = LOWPOLY, CI = CINEMA, E = ENCONTROS;
await E.prepara();
const st = LP.palco(canvas, { foco: 2.4, faixa: 0.8, desfoque: 22, bloom: 0.9, raios: 0.5 });
const { S, cam } = st;
LP.luz(st, "por-do-sol"); st.exposicao = 1.12;
CI.cenario(S, "rua", { seed: 5 }); CI.ceu(S, { topo: 0x2a3466, horizonte: 0xffa070 });
st.sol(new THREE.Vector3(5, 3, -30), 0.9);
LP.bokeh(S, { n: 30, seed: 8, y: [0.8, 3.5], z: [-16, -9], cores: [0xffc07a, 0xff8a4c, 0x7cc8ff] });
// você no meio da calçada, girando o olhar: cada desconhecido tem o seu número
const eu = E.heroi(LP); S.add(eu.root);
const F = E.multidao(LP, S, [[-2.9, -3.2, 71, 0x3d5a80, 0.7, 1], [2.2, -4.6, 72, 0x7a3b3b, 0.6, -1], [-1.9, -6.4, 73, 0x4a6b4a, 0], [1.7, -7.6, 74, 0x6b5a7a, 0.8, -1], [3.2, -9.0, 75, 0x8a6a3a, 0], [0.2, -10.5, 76, 0x2f4f6f, 0.5, 1]]);
const NUM = [12, 480, 3, 1250, 76, 9], T0 = [0.15, 0.35, 0.55, 0.75, 0.95, 1.15];
const olho = new THREE.Vector3(), rosto = new THREE.Vector3(0, 1.6, 0);
function render(t) {
  E.andaMultidao(LP, F, t);
  olho.set(lerp(-2.5, 2.0, ease.inOutSine(range(t, 0.2, 2.8))), 1.65, -5);
  LP.ator(eu, t, { seed: 12, emocao: ["surpresa", "alegre", range(t, 2.0, 2.8)], olharPara: olho, olharK: 0.75 });
  // câmera baixa, em arco lento na frente dele (os de trás ficam abaixo do rosto, na faixa dos números)
  const e = ease.inOutSine(range(t, 0, 3.49)), a = lerp(-0.35, 0.3, e);
  cam.position.set(Math.sin(a) * 3.7, 1.15, Math.cos(a) * 3.7); cam.lookAt(0, 1.32, -1.0);
  LP.camMao(cam, t, { seed: 2 }); LP.focar(st, rosto); CI.preenche(st, rosto, { forca: 1.3 });
  st.draw();
  const c = st.ctx;
  F.forEach((f, i) => E.sobreCabeca(c, NUM[i] * ease.outCubic(range(t, T0[i], T0[i] + 0.9)) , f, cam, range(t, T0[i], T0[i] + 0.25), { tam: 40, sobe: 0.32, ymin: 540, pulso: 0 }));
  E.txt(c, "ENCONTROS RESTANTES", 540, 985, { tam: 34, cor: "#fff", a: range(t, 2.18, 2.45), esp: 0.24 });
}
