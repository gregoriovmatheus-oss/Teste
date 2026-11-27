/*META {"imports": ["lowpoly", "cinema", "encontros"], "rotulos": [], "D0": 6.63} */
const LP = LOWPOLY, CI = CINEMA, E = ENCONTROS;
await E.prepara();
const st = LP.palco(canvas, { foco: 2.2, faixa: 0.6, desfoque: 26, bloom: 0.9, raios: 0.6 });
const { S, cam } = st;
LP.luz(st, "por-do-sol"); st.exposicao = 1.14;
CI.cenario(S, "rua", { seed: 3 }); CI.ceu(S, { topo: 0x2a3466, horizonte: 0xffa070 });
st.sol(new THREE.Vector3(-6, 3, -30), 1.0);
LP.bokeh(S, { n: 34, seed: 6, y: [0.8, 3.5], z: [-14, -6], cores: [0xffc07a, 0xff8a4c, 0x7cc8ff, 0xfff0d0] });
const poe = LP.poeira(S, { n: 50, centro: [0, 1.7, -1], raio: [1.2, 0.7, 1], cor: 0xffd8a0 });
// volta à imagem do começo: o amigo vai embora, você olha de novo (o número), vai até ele e abraça
const eu = E.heroi(LP); eu.root.rotation.y = Math.PI; S.add(eu.root);
const am = E.amigo(LP); S.add(am.root);
const hA = new THREE.Vector3(), hB = new THREE.Vector3(), v = new THREE.Vector3();
const ZB = -1.9;
function render(t) {
  // amigo: vira e dá uns passos (1,6–2,7 s), para, volta a olhar (3,0–3,6 s)
  const vai = range(t, 1.6, 2.8), volta = ease.inOutCubic(range(t, 3.0, 3.6));
  const dB = LP.ator(am, t, { seed: 27, andar: vai > 0 && vai < 1 ? { vel: 0.8 } : false,
    emocao: t < 3.0 ? ["alegre", "calmo", range(t, 1.2, 1.8)] : ["calmo", "alegre", range(t, 3.4, 4.0)], olharPara: t > 3.2 ? hA : undefined, olharK: 0.7 });
  am.root.rotation.y = lerp(0.12, Math.PI - 0.1, ease.inOutCubic(range(t, 1.5, 1.85))) * (1 - volta) + 0.0 * volta;
  am.root.position.set(-0.12, 0, ZB - 0.55 * ease.inOutSine(vai));
  // você: em "olhe de novo" ergue o olhar; a partir de 3,3 s anda até ele; abraço em "abraço" (4,34 s)
  const zA = lerp(0.45, am.root.position.z + 0.42, ease.inOutSine(range(t, 3.3, 4.35)));
  const andando = t > 3.3 && t < 4.35;
  LP.ator(eu, t, { seed: 12, andar: andando ? { vel: 1.0 } : false, emocao: t < 3.3 ? ["calmo", "surpresa", range(t, 2.4, 2.8)] : ["surpresa", "alegre", range(t, 3.4, 4.0)], olharPara: hB, olharK: 0.6 });
  eu.root.position.set(lerp(0.14, -0.1, range(t, 3.3, 4.35)), 0, zA);
  const k = ease.inOutCubic(range(t, 4.25, 4.9)); LP.abracar(eu, am, k);
  am.cab.getWorldPosition(hB); eu.cab.getWorldPosition(hA);
  // câmera: o mesmo plano por cima do ombro do começo → lateral do abraço, com push-in
  CI.trilho(cam, t, [[0, [0.52, 1.74, 1.55], [-0.14, 1.24, -1.9]], [3.2, [0.48, 1.72, 1.35], [-0.13, 1.25, -2.1]], [4.4, [1.55, 1.62, -0.6], [-0.1, 1.3, -2.25]], [6.63, [1.25, 1.6, -1.1], [-0.1, 1.33, -2.25]]], { mao: 1, seed: 3 });
  LP.focar(st, t < 3.6 ? hB : hA); CI.preenche(st, hB, { forca: 1.3 }); poe.update(t);
  st.draw();
  const c = st.ctx;
  E.sobreCabeca(c, 2999 + range(t, 4.5, 5.2), am, cam, range(t, 2.4, 2.7) * (1 - range(t, 4.3, 4.7)), { rotulo: "ENCONTROS", sobe: 0.27, ymin: 470, pulso: LP.mola(t, 2.85, 1, 2.2, 5) });
  E.titulo(c, "", ["Talvez valha", "*um abraço a mais.*"], range(t, 4.34, 4.8), { y: 968, tam: 54 });
}
