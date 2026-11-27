/*META {"imports": ["lowpoly", "cinema", "encontros"], "rotulos": [], "D0": 6.9} */
const LP = LOWPOLY, CI = CINEMA, E = ENCONTROS;
await E.prepara();
const st = LP.palco(canvas, { foco: 3, faixa: 0.8, desfoque: 22, bloom: 0.8 });
const { S, cam } = st;
LP.luz(st, "dia"); st.exposicao = 1.08;
CI.cenario(S, "rua", { seed: 7 }); CI.ceu(S, { topo: 0x4a86d0, horizonte: 0xf0dcc0 });
// três pessoas na mesma calçada: o amigo, o colega do ônibus (sentado no ponto) e a mãe
const am = E.amigo(LP); am.root.position.set(-2.4, 0, 0); am.root.rotation.y = 0.2; S.add(am.root);
const po = E.pontoOnibus(LP); po.position.set(0, 0, -0.1); S.add(po);
const co = LP.pessoa({ seed: 61, roupa: "camiseta", camisa: 0x4a6b8a, pele: 0xe0b898, cabelo: 0x6a4a2a, oculos: true, mochila: true, barba: false }); co.root.position.set(-0.1, 0, 0.05); S.add(co.root);
const cel = CI.luzPratica(S, "celular", [0, 0, 0], { forca: 0.5 }); LP.segurar(co, 0, cel.g, { pos: [0, -0.1, 0.04] }); cel.g.rotation.set(-0.6, 0, Math.PI / 2);
const ma = E.mae(LP); ma.root.position.set(2.5, 0, 0); ma.root.rotation.y = -0.2; S.add(ma.root);
const v = new THREE.Vector3(), hAm = new THREE.Vector3(-2.4, 1.6, 0), hCo = new THREE.Vector3(-0.1, 1.15, 0.2), hMa = new THREE.Vector3(2.5, 1.55, 0);
function render(t) {
  LP.ator(am, t, { seed: 27, emocao: "alegre", olharPara: cam.position, olharK: 0.6, gestos: { intens: 0.5 } });
  LP.ator(co, t, { seed: 61, pose: "sentado", emocao: ["foco", "calmo", range(t, 2.6, 3.0)], olharPara: t < 2.7 ? v.set(0.1, 0.9, 0.6) : cam.position, olharK: 0.7 });
  LP.ator(ma, t, { seed: 37, emocao: ["calmo", "alegre", range(t, 4.4, 5.0)], olharPara: cam.position, olharK: 0.8 });
  // travelling lateral: amigo → colega → mãe (na mãe, aproxima devagar)
  CI.trilho(cam, t, [[0, [-2.9, 1.62, 3.3], [-2.35, 1.3, 0]], [1.75, [-2.5, 1.6, 3.2], [-2.3, 1.3, 0]], [2.35, [-0.5, 1.3, 3.0], [-0.1, 0.92, 0]], [3.95, [-0.2, 1.28, 2.85], [-0.1, 0.9, 0]],
    [4.5, [2.0, 1.6, 3.0], [2.45, 1.26, 0]], [6.9, [2.35, 1.58, 2.3], [2.5, 1.28, 0]]], { mao: 1, seed: 6 });
  const foco = t < 2.0 ? hAm : t < 4.2 ? hCo : hMa; LP.focar(st, foco, 0.6); CI.preenche(st, foco, { forca: 1.2 });
  st.draw();
  const c = st.ctx;
  E.sobreCabeca(c, lerp(2400, 3000, ease.outCubic(range(t, 0.9, 1.6))), am, cam, range(t, 0.7, 0.95) * (1 - range(t, 2.1, 2.3)), { rotulo: "MELHOR AMIGO", tam: 70, pulso: LP.mola(t, 1.6, 1, 2.2, 5) });
  E.sobreCabeca(c, 27 * ease.outCubic(range(t, 2.8, 3.4)), co, cam, range(t, 2.4, 2.65) * (1 - range(t, 4.2, 4.4)), { rotulo: "COLEGA DO ÔNIBUS", tam: 70, sobe: 0.34, pulso: LP.mola(t, 3.4, 1, 2.2, 5) });
  E.sobreCabeca(c, 180, ma, cam, range(t, 4.6, 4.9), { rotulo: "MÃE", tam: 70, borrado: 1, t, cor: E.LARANJA });
  E.txt(c, "UM NÚMERO QUE VOCÊ NÃO QUERIA LER", 540, 985, { tam: 28, cor: E.LARANJA, a: range(t, 5.8, 6.1), esp: 0.16 });
}
