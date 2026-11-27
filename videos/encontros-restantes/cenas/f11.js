/*META {"imports": ["lowpoly", "cinema", "encontros"], "rotulos": [], "D0": 4.04} */
const LP = LOWPOLY, CI = CINEMA, E = ENCONTROS;
await E.prepara();
const st = LP.palco(canvas, { foco: 5, faixa: 2.0, desfoque: 14, bloom: 0.5 });
const { S, cam } = st;
LP.luz(st, "frio"); st.exposicao = 1.0; CI.clima(st, "memoria"); st.U.sat.value = 0.45;
CI.cenario(S, "rua", { seed: 13 }); CI.ceu(S, { topo: 0x8a96a4, horizonte: 0xc8ccd0 });
// uma terça qualquer: rua comum, gente passando; o avô segue andando na calçada e o 1 vira 0 sem alarde
const av = E.avo(LP); av.root.position.set(-3.1, 0.11, -3.5); av.root.rotation.y = Math.PI; S.add(av.root);
const F = E.multidao(LP, S, [[-2.0, -6.5, 81, 0x4a5058, 0.6, 1], [2.9, -4.0, 82, 0x5a4a44, 0], [3.4, -8.0, 83, 0x3e4a5a, 0.7, -1], [-3.4, -10.0, 84, 0x52525a, 0]]);
F.forEach((f) => (f.root.position.y = Math.abs(f.root.position.x) > 2.2 ? 0.11 : 0));
const poste = CI.luzPratica(S, "poste", [-2.3, 0.11, -5.5], { forca: 0.3 });
const v = new THREE.Vector3();
function render(t) {
  E.andaMultidao(LP, F, t); F.forEach((f) => (f.root.position.y = Math.abs(f.userData.x) > 2.2 ? 0.11 : 0));
  const d = LP.ator(av, t, { seed: 44, andar: { vel: 0.55 }, emocao: "calmo" });
  av.root.position.z = -3.5 - d * 0.55;
  const e = ease.inOutSine(range(t, 0, 4.04));
  cam.position.set(lerp(-0.9, -1.3, e), lerp(1.5, 1.55, e), lerp(1.6, 0.9, e)); cam.lookAt(v.set(-3.0, 1.0, av.root.position.z - 1.2)); LP.camMao(cam, t, { seed: 7, intens: 0.6 });
  LP.focar(st, av.cab.getWorldPosition(v));
  st.draw();
  const c = st.ctx;
  // 1 → 0 em "zero" (1,29 s), depois o selo apaga devagar
  const n = 1 - ease.inOutCubic(range(t, 1.1, 1.5));
  E.sobreCabeca(c, n, av, cam, (1 - range(t, 2.4, 3.6)) * 0.9, { tam: 56, sobe: 0.3, cor: "#c8d0da", numCor: "#e8ecf0" });
  E.txt(c, "TERÇA-FEIRA", 540, 985, { tam: 30, cor: "#c8d0da", a: range(t, 1.82, 2.1), esp: 0.34 });
  E.txt(c, "SEM AVISO", 540, 935, { tam: 24, cor: "#8a96a4", a: range(t, 3.48, 3.7), esp: 0.34 });
}
