/*META {"imports": ["lowpoly", "cinema", "relogio"], "rotulos": [], "D0": 7.04} */
const LP = LOWPOLY, CI = CINEMA, R = RELOGIO, Y = R.ANOS;
await R.prepara();
const st = LP.palco(canvas, { foco: 2.1, faixa: 0.6, desfoque: 26, bloom: 0.9, raios: 0.6 });
const { S, cam } = st;
LP.luz(st, "por-do-sol"); st.exposicao = 1.12;
CI.cenario(S, "rua", { seed: 3 });
const ceu = CI.ceu(S, { topo: 0x1a2250, horizonte: 0xc86a50 }); const dm = ceu.children[0].material.uniforms;
const cTopo = [new THREE.Color(0x1a2250), new THREE.Color(0x4a7ac0)], cHor = [new THREE.Color(0xc86a50), new THREE.Color(0xffd08a)];
LP.bokeh(S, { n: 34, seed: 6, y: [0.8, 3.5], z: [-14, -6], cores: [0xffc07a, 0xff8a4c, 0x7cc8ff, 0xfff0d0] });
const poe = LP.poeira(S, { n: 60, centro: [0, 1.6, -0.5], raio: [1.2, 0.7, 1], cor: 0xffe0a8 });
// volta à mesma rua do começo; os relógios se apagam, o sol nasce, você olha para a câmera e sorri
const eu = R.heroi(LP); eu.root.position.set(0.3, 0, 0); eu.root.rotation.y = -0.25; S.add(eu.root);
const pa = LP.pessoa({ seed: 61, feminina: true, roupa: "casaco", jaqueta: 0x3d6a5a, pele: 0xe0b898, cabelo: 0x5a2e16, iris: 0x3a5a3a }); pa.root.rotation.y = 1.25; S.add(pa.root);
const F = R.multidao(LP, S, [[-2.0, -6.5, 71, 0x3d5a80, 0.6, 1], [1.5, -8.0, 72, 0x7a3b3b, 0], [0.3, -10.5, 73, 0x4a6b4a, 0.5, -1], [-1.3, -12.0, 74, 0x6b5a7a, 0]]);
const SF = [52 * Y + 9e6, 17 * Y + 2e6, 63 * Y + 4e6, 8 * Y + 1e7];
const hP = new THREE.Vector3(), hE = new THREE.Vector3(), sol = new THREE.Vector3();
function render(t) {
  const nasce = ease.inOutSine(range(t, 0.5, 6.5));
  dm.a.value.copy(cTopo[0]).lerp(cTopo[1], nasce); dm.b.value.copy(cHor[0]).lerp(cHor[1], nasce);
  st.sol(sol.set(-6, lerp(-1, 6, nasce), -30), 0.5 + 0.7 * nasce); st.exposicao = 1.0 + 0.2 * nasce;
  R.andaMultidao(LP, F, t);
  LP.ator(pa, t, { seed: 61, andar: { vel: 0.45 }, emocao: "calmo" }); pa.root.position.set(-0.95 + 0.11 * (t + 5.9), 0, -2.7 + 0.03 * (t + 5.9));
  pa.cab.getWorldPosition(hP);
  const vira = ease.inOutCubic(range(t, 2.9, 3.8));
  LP.ator(eu, t, { seed: 18, emocao: t < 2.4 ? "foco" : ["calmo", "alegre", range(t, 3.4, 4.4)], olharPara: vira < 0.5 ? hP : cam.position, olharK: 0.75 });
  eu.cab.getWorldPosition(hE);
  const e = ease.inOutSine(range(t, 0, 7.04));
  R.mira(cam, new THREE.Vector3(lerp(0.08, 0.3, e), 1.66, lerp(2.0, 1.25, e)), hE, lerp(790, 720, e), lerp(735, 540, e)); LP.camMao(cam, t, { seed: 3 });
  LP.focar(st, hE); CI.preenche(st, hE, { forca: 1.4 }); poe.update(t);
  st.draw();
  const c = st.ctx;
  // em "Sem vê-lo" (2,14 s) os relógios tremem e somem
  const some = range(t, 2.14, 2.9), gl = range(t, 1.9, 2.3) * (1 - some);
  R.relogio(c, 41 * Y + 207 * 86400 + 22492 - 5.9 - t, pa, cam, 1 - some, { rotulo: "TEMPO RESTANTE", tam: 54, sobe: 0.24, glitch: Math.max(gl, some), t });
  F.forEach((f, i) => R.relogio(c, SF[i] - t, f, cam, 1 - range(t, 2.14 + i * 0.08, 2.6 + i * 0.08), { tam: 26, sobe: 0.3, ymin: 560, glitch: gl, t }));
  R.txt(c, "TODO MUNDO TEM UM", 540, 975, { tam: 30, cor: R.AZUL, a: range(t, 1.32, 1.6) * (1 - range(t, 2.6, 2.8)), esp: 0.26 });
  R.titulo(c, "", ["Escolha como gastar", "*cada minuto*."], range(t, 4.27, 4.7), { y: 968, tam: 54 });
}
