/*META {"imports": ["lowpoly", "cinema", "encontros"], "rotulos": [], "D0": 3.55} */
const LP = LOWPOLY, CI = CINEMA, E = ENCONTROS;
await E.prepara();
const st = LP.palco(canvas, { foco: 1.4, faixa: 0.45, desfoque: 24, bloom: 0.9 });
const { S, cam } = st;
LP.luz(st, "interior"); st.exposicao = 1.12; st.quente.intensity = 1.8;
CI.cenario(S, "cozinha", { seed: 2 });
LP.bokeh(S, { n: 30, seed: 4, y: [0.9, 2.6], z: [-6, -3.5], cores: [0xffd08a, 0xff8a4c, 0xfff0d0] });
const lamp = CI.luzPratica(S, "abajur", [0.55, 1.07, -0.25], { forca: 0.6 });
// cafeteria: mesa alta, você com o celular (a mensagem de cancelar) e o amigo chegando do outro lado
const M = E.mesaCafe(LP); S.add(M.g);
const vap = CI.fumaca(S, { pos: [-0.16, 1.14, 0.1], n: 12, sobe: 0.35, largura: 0.05, tam: 0.06, opac: 0.25 });
const eu = E.heroi(LP); eu.root.position.set(0.05, 0, 0.62); eu.root.rotation.y = Math.PI; S.add(eu.root);
const am = E.amigo(LP); am.root.position.set(-0.05, 0, -0.6); S.add(am.root);
const cel = CI.luzPratica(S, "celular", [0, 0, 0], { forca: 0.7 }); LP.segurar(eu, 1, cel.g, { pos: [0, -0.1, 0.04] }); cel.g.rotation.set(-0.5, 0, -Math.PI / 2);
const hAm = new THREE.Vector3(-0.05, 1.6, -0.6), v = new THREE.Vector3();
function render(t) {
  const sobe = ease.inOutCubic(range(t, 2.2, 2.8));   // tira o olho do celular e olha o amigo
  eu.root.updateMatrixWorld(true);
  LP.ator(eu, t, { seed: 12, emocao: ["foco", "alegre", range(t, 2.5, 3.1)], olharPara: v.set(0.25, 1.15, 0.95).lerp(hAm, sobe), olharK: 0.8 });
  LP.alcancar(eu, 1, eu.root.localToWorld(v.set(-0.2, 1.17 - 0.12 * sobe, 0.32)), 1, { polo: new THREE.Vector3(-1, -0.6, -0.3) });
  LP.ator(am, t, { seed: 27, emocao: ["calmo", "alegre", range(t, 0.3, 1.0)], olharPara: eu.cab.getWorldPosition(v), olharK: 0.7, gestos: { intens: 0.6 } });
  cel.update(t); lamp.update(t); vap.update && vap.update(t);
  CI.trilho(cam, t, [[0, [0.55, 1.62, 1.75], [-0.05, 1.35, -0.6]], [3.55, [0.42, 1.6, 1.4], [-0.05, 1.37, -0.6]]], { mao: 1, seed: 8 });
  LP.focar(st, hAm); CI.preenche(st, hAm, { forca: 1.4 });
  st.draw();
  const c = st.ctx;
  E.sobreCabeca(c, 2999, am, cam, range(t, 0.45, 0.7), { rotulo: "ENCONTROS", tam: 64 });
  E.lista(c, [["CANCELAR O CAFÉ?", 1.9, 2.7]], t, 540, 975, { w: 560, lh: 70, tam: 30 });
}
