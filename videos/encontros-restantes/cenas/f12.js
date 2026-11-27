/*META {"imports": ["lowpoly", "cinema", "encontros"], "rotulos": [], "D0": 4.54} */
const LP = LOWPOLY, CI = CINEMA, E = ENCONTROS;
await E.prepara();
const st = LP.palco(canvas, { foco: 7, faixa: 3, desfoque: 12, bloom: 0.9, raios: 0.4 });
const { S, cam } = st;
LP.luz(st, "por-do-sol"); st.exposicao = 1.1;
CI.cenario(S, "rua", { seed: 17 }); CI.ceu(S, { topo: 0x1e2a58, horizonte: 0xff9a6a });
st.sol(new THREE.Vector3(0, 2, -30), 0.8);
// praça ao entardecer vista do alto: cada pessoa já tem o seu número; eles acendem e depois somem da vista
const F = E.multidao(LP, S, [[-1.6, -1.0, 91, 0x3d5a80, 0.5, 1], [1.2, -1.6, 92, 0x7a3b3b, 0], [-0.4, -3.0, 93, 0x4a6b4a, 0.6, -1], [1.9, -3.8, 94, 0x6b5a7a, 0],
  [-2.2, -4.6, 95, 0x8a6a3a, 0], [0.5, -5.4, 96, 0x2f4f6f, 0.5, 1], [-1.0, -6.6, 97, 0x5a3a5a, 0], [2.4, -6.8, 98, 0x3a5a5a, 0.6, -1], [0.0, -8.4, 99, 0x6a5040, 0]]);
const NUM = [3000, 412, 27, 95, 1800, 6, 230, 51, 740];
const lamp = CI.luzPratica(S, "poste", [-2.8, 0, -3], { forca: 0.5 });
const al = new THREE.Vector3();
function render(t) {
  E.andaMultidao(LP, F, t);
  const e = ease.inOutSine(range(t, 0, 4.54));
  cam.position.set(lerp(0.6, -0.3, e), lerp(2.3, 3.0, e), lerp(3.6, 4.2, e)); al.set(0, lerp(1.1, 0.8, e), -4.5); cam.lookAt(al); LP.camMao(cam, t, { seed: 12, intens: 0.6 });
  st.draw();
  const c = st.ctx;
  // aparecem em "número" (1,35 s); em "não consegue ver" (3,25 s) apagam um a um
  F.forEach((f, i) => E.sobreCabeca(c, NUM[i], f, cam, range(t, 1.3 + i * 0.05, 1.55 + i * 0.05) * (1 - range(t, 3.25 + i * 0.07, 3.6 + i * 0.07)), { tam: 36, sobe: 0.34, ymin: 520 }));
  E.txt(c, "JÁ EXISTE", 540, 985, { tam: 40, cor: "#fff", a: range(t, 1.93, 2.2), esp: 0.3 });
  E.txt(c, "A GENTE SÓ NÃO VÊ", 540, 935, { tam: 26, cor: E.AZUL, a: range(t, 3.5, 3.8), esp: 0.3 });
}
