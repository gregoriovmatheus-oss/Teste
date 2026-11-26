/*META {"imports": ["lowpoly", "cinema", "idade"], "rotulos": [], "D0": 5.0, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const LP = LOWPOLY, CI = CINEMA, ID = IDADE;
await ID.prepara();
const st = LP.palco(canvas, { foco: 3, faixa: 1.0, desfoque: 18, bloom: 0.9 });
const { S, cam } = st;
LP.luz(st, "dia"); st.exposicao = 1.15;
CI.cenario(S, "quarto"); const ab = CI.luzPratica(S, "abajur", [-1.6, 0.5, -2.4], { forca: 1.0 });
// avó, pai e neto: todos com corpo de 25 anos; a tataraneta (criança) chega em "tataranetos"
const F = [[{ seed: 31, feminina: true, roupa: "casaco", camisa: 0x7a3b5a, cabelo: 0x3a2214, pele: 0xc89070 }, -0.75, "AVÓ · 25"],
  [{ seed: 12, roupa: "camiseta", camisa: 0x2f6f9a, pele: 0xc89070, barba: false, cabeloTipo: "topete" }, 0, "PAI · 25"],
  [{ seed: 44, roupa: "jaqueta", camisa: 0x3a3a40, jaqueta: 0xd9a21e, pele: 0xc89070, barba: false }, 0.75, "NETO · 25"]].map(([o, x, s]) => { const p = LP.pessoa(o); p.root.position.set(x, 0, 0); S.add(p.root); return { p, x, s }; });
const k = LP.pessoa({ seed: 52, idade: "crianca", roupa: "camiseta", camisa: 0xff8a4c, pele: 0xc89070 }); S.add(k.root);
const v = new THREE.Vector3(), T0 = [0.1, 0.4, 0.84];
function render(t) {
  const dk = LP.ator(k, t, { seed: 52, andar: t < 3.6 ? { vel: 1.1 } : null, emocao: "alegre" });
  k.root.position.set(1.6 - Math.min(dk, 1.6) * 0.55, 0, 0.75); k.root.rotation.y = t < 3.6 ? -Math.PI / 2 : lerp(-Math.PI / 2, -0.2, range(t, 3.6, 4.0));
  const kc = k.cab.getWorldPosition(new THREE.Vector3());
  F.forEach(({ p, x }, i) => { LP.ator(p, t, { seed: 20 + i, emocao: t < 2.6 ? "alegre" : ["alegre", "surpresa", range(t, 2.7, 3.1) * (1 - range(t, 3.9, 4.4))], olharPara: t > 2.6 ? kc : null, olharK: range(t, 2.6, 3.0) }); });
  ab.update(t);
  // câmera: passa pelos 3 rostos (avó → pai → neto), abre em "mesma cara", desce até a criança
  CI.trilho(cam, t, [[0, [-0.75, 1.65, 1.3], [-0.75, 1.55, 0]], [0.45, [-0.1, 1.65, 1.35], [0, 1.55, 0]], [0.95, [0.6, 1.65, 1.4], [0.75, 1.55, 0]], [2.1, [0.2, 1.7, 4.2], [0.05, 1.3, 0]], [3.0, [0.25, 1.6, 4.4], [0.2, 1.2, 0.2]], [5.0, [0.6, 1.35, 3.6], [0.4, 1.15, 0.3]]], { mao: 1, seed: 8 });
  LP.focar(st, v.set(0.1, 1.5, 0));
  st.draw();
  const c = st.ctx;
  F.forEach(({ p, x, s }, i) => ID.tag(c, s, v.set(x, 1.25, 0.15), cam, range(t, T0[i], T0[i] + 0.2) * (1 - range(t, 2.4, 2.6)), { cor: i === 0 ? ID.LARANJA : ID.AZUL, dy: 0 }));
  ID.txt(c, "A MESMA CARA", 540, 700, { tam: 34, cor: "#fff", a: range(t, 1.74, 2.0) * (1 - range(t, 3.3, 3.5)), esp: 0.3 });
  ID.tag(c, "TATARANETA", v.set(k.root.position.x, 0.75, 0.8), cam, range(t, 4.06, 4.3), { cor: ID.LARANJA, dy: -60 });
}
