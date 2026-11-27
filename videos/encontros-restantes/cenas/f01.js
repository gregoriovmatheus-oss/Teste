/*META {"imports": ["lowpoly", "cinema", "encontros"], "rotulos": [], "D0": 3.83} */
const LP = LOWPOLY, CI = CINEMA, E = ENCONTROS;
await E.prepara();
const st = LP.palco(canvas, { foco: 2.2, faixa: 0.6, desfoque: 26, bloom: 0.85, raios: 0.5 });
const { S, cam } = st;
LP.luz(st, "por-do-sol"); st.exposicao = 1.12;
CI.cenario(S, "rua", { seed: 3 }); CI.ceu(S, { topo: 0x2a3466, horizonte: 0xffa070 });
st.sol(new THREE.Vector3(-6, 3, -30), 0.9);
LP.bokeh(S, { n: 34, seed: 6, y: [0.8, 3.5], z: [-14, -6], cores: [0xffc07a, 0xff8a4c, 0x7cc8ff, 0xfff0d0] });
// você (de costas, ombro em primeiro plano) olhando o melhor amigo; o número dele já está no ar no quadro 0
const eu = E.heroi(LP); eu.root.rotation.y = Math.PI; eu.root.position.set(0.14, 0, 0.45); S.add(eu.root);
const am = E.amigo(LP); am.root.position.set(-0.12, 0, -1.9); am.root.rotation.y = 0.12; S.add(am.root);
const hA = new THREE.Vector3(0.14, 1.6, 0.45), hB = new THREE.Vector3(-0.12, 1.6, -1.9), v = new THREE.Vector3();
const poe = LP.poeira(S, { n: 50, centro: [0, 1.7, -1], raio: [1.2, 0.7, 1], cor: 0xffd8a0 });
function render(t) {
  if (t < 0.17) st.T = 0.17;  // quadro 0 = miniatura: sem o dip escuro de entrada
  CI.trilho(cam, t, [[0, [0.52, 1.74, 1.55], [-0.14, 1.24, -1.9]], [3.83, [0.44, 1.72, 1.15], [-0.13, 1.25, -1.9]]], { mao: 1, seed: 3 });
  LP.ator(eu, t, { seed: 12, emocao: "surpresa", olharPara: hB, olharK: 0.6 });
  LP.ator(am, t, { seed: 27, emocao: ["calmo", "alegre", range(t, 0.3, 1.1)], olharPara: hA, olharK: 0.7 });
  LP.focar(st, hB); CI.preenche(st, hB, { forca: 1.4 }); poe.update(t);
  st.draw();
  const c = st.ctx, n = 2950 + 50 * ease.outCubic(range(t, 0, 2.4));
  E.sobreCabeca(c, n, am, cam, 1, { rotulo: "ENCONTROS", sobe: 0.27, ymin: 470, pulso: LP.mola(t, 1.89, 1, 2.2, 5) });
  E.titulo(c, "", ["E se você visse", "*um número* sobre cada um?"], 1 - range(t, 2.0, 2.4), { y: 968, tam: 52 });
  E.txt(c, "FLUTUANDO SOBRE A CABEÇA", 540, 985, { tam: 28, cor: E.AZUL, a: range(t, 2.3, 2.6), esp: 0.28 });
}
