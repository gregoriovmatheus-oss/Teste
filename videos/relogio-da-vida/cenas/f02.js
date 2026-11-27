/*META {"imports": ["lowpoly", "cinema", "relogio"], "rotulos": [], "D0": 7.22} */
const LP = LOWPOLY, CI = CINEMA, R = RELOGIO, Y = R.ANOS;
await R.prepara();
const st = LP.palco(canvas, { foco: 1.3, faixa: 0.5, desfoque: 22, bloom: 0.8, raios: 0.4 });
const { S, cam } = st;
LP.luz(st, "dia"); st.exposicao = 1.08;
CI.cenario(S, "rua", { seed: 7 }); CI.ceu(S, { topo: 0x4a86d0, horizonte: 0xf0dcc0, nuvens: 6 });
st.sol(new THREE.Vector3(8, 10, -30), 0.5);
[[-4.4, -1], [4.4, -7], [-4.4, -9]].forEach(([x, z], i) => CI.arvore(S, { pos: [x, 0.11, z], alt: 2.6, seed: 4 + i }));
// 3 planos: a mãe com o bebê no colo (84 anos), o senhor no banco da praça (6 anos), o motoboy que passa (3 horas)
const ma = R.mae(LP); ma.root.position.set(-3.0, 0.11, 1.0); ma.root.rotation.y = 0.3; S.add(ma.root);
const bb = R.bebe(LP); S.add(bb.root);
const bc = R.banco(LP); bc.position.set(3.1, 0.11, -3.0); bc.rotation.y = -0.5; S.add(bc);
const se = R.senhor(LP); se.root.position.set(3.1, 0.11, -2.95); se.root.rotation.y = -0.5; S.add(se.root);
const mt = R.moto(LP); mt.g.rotation.y = Math.PI / 2; S.add(mt.g);
const mb = R.motoboy(LP); mb.root.position.set(0, 0.26, -0.22); mt.g.add(mb.root);
const C1 = 2.35, C2 = 4.4, v = new THREE.Vector3(), h = new THREE.Vector3();
function render(t) {
  const sA = t < C1, sB = !sA && t < C2, Cc = t >= C2;
  ma.root.visible = bb.root.visible = sA; se.root.visible = bc.visible = sB; mt.g.visible = Cc;
  if (sA) {
    LP.ator(ma, t, { seed: 33, emocao: "alegre", olharPara: bb.cab.getWorldPosition(v), olharK: 0.8 });
    ma.root.updateMatrixWorld(true); bb.root.position.copy(ma.root.localToWorld(v.set(0.06, 0.78, 0.24))); bb.root.rotation.y = ma.root.rotation.y + 0.5;
    LP.ator(bb, t, { seed: 5, pose: "sentado", emocao: ["calmo", "alegre", range(t, 0.6, 1.4)], olharPara: cam.position, olharK: 0.5 });
    bb.root.updateMatrixWorld(true);
    LP.alcancar(ma, 0, bb.root.localToWorld(v.set(0.05, 0.3, -0.05)), 1, { polo: new THREE.Vector3(-1, -0.6, -0.3) });
    LP.alcancar(ma, 1, bb.root.localToWorld(v.set(-0.25, 0.65, -0.05)), 1, { polo: new THREE.Vector3(1, -0.6, -0.3) });
    bb.cab.getWorldPosition(h);
    const e = ease.inOutSine(range(t, 0, C1));
    R.mira(cam, v.set(h.x + lerp(0.55, 0.35, e), h.y + 0.1, h.z + lerp(1.35, 1.1, e)), h, 800); LP.camMao(cam, t, { seed: 2 });
  } else if (sB) {
    const u = t - C1;
    LP.ator(se, t, { seed: 44, pose: "sentado", emocao: ["calmo", "alegre", range(u, 0.5, 1.4)], olharPara: cam.position, olharK: 0.4 });
    se.cab.getWorldPosition(h);
    const e = ease.inOutSine(range(u, 0, C2 - C1));
    R.mira(cam, v.set(h.x - lerp(1.5, 1.2, e), h.y + 0.15, h.z + lerp(1.4, 1.2, e)), h, 800, 560); LP.camMao(cam, t, { seed: 5 });
  } else {
    const u = t - C2;
    mt.g.position.set(-4.2 + u * 2.6, 0, -0.6); mt.update(u, 2.6);
    LP.ator(mb, t, { seed: 52, pose: "sentado", emocao: "foco", olhar: [0.3, 0] }); R.pilotar(LP, mb, mt);
    mb.cab.getWorldPosition(h);
    R.mira(cam, v.set(lerp(-1.4, 1.2, ease.inOutSine(range(u, 0, 2.8))), 1.35, 3.4), h, 800, lerp(620, 520, range(u, 0, 2.8))); LP.camMao(cam, t, { seed: 7 });
  }
  LP.focar(st, h); CI.preenche(st, h, { forca: 1.2 });
  st.draw();
  const c = st.ctx;
  if (sA) R.relogio(c, 84 * Y * ease.outCubic(range(t, 1.0, 1.97)) + 9.7e6 * range(t, 1.0, 1.97) - (t - 1.97), bb, cam, range(t, 0.3, 0.55), { rotulo: "BEBÊ", tam: 60, sobe: 0.17, pulso: LP.mola(t, 1.97, 1, 2.2, 5) });
  if (sB) R.relogio(c, 6 * Y * ease.outCubic(range(t, 3.4, 3.99)) + 3.1e6 * range(t, 3.4, 3.99) - (t - 3.99), se, cam, range(t, 2.6, 2.85), { rotulo: "SENHOR NA PRAÇA", tam: 60, sobe: 0.26, pulso: LP.mola(t, 3.99, 1, 2.2, 5) });
  if (Cc) { const k = range(t, 6.1, 6.4);
    R.relogio(c, 3 * 3600 - Math.max(0, t - 6.4), mb, cam, range(t, 4.6, 4.85), { rotulo: "MOTOBOY", tam: 60, sobe: 0.32, cor: k > 0.5 ? R.LARANJA : R.AZUL, borrado: 1 - k, t, pulso: LP.mola(t, 6.4, 1, 2.2, 5) }); }
}
