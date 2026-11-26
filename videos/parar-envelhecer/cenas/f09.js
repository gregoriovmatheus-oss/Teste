/*META {"imports": ["lowpoly", "cinema", "idade"], "rotulos": [], "D0": 5.83, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const LP = LOWPOLY, CI = CINEMA, ID = IDADE;
await ID.prepara();
const st = LP.palco(canvas, { foco: 1.9, faixa: 0.8, desfoque: 18, bloom: 0.8 });
const { S, cam } = st;
// 4 cenários (um por profissão), cortes secos; o mesmo rosto em todos
const SETS = [["escritorio", { roupa: "jaqueta", camisa: 0xe8e4dc, jaqueta: 0x2a2f3a }, 0, "interior", "medio", 1], ["laboratorio", { roupa: "jaleco", camisa: 0x3e6a8a, oculos: true }, 2.0, "frio", "close", -1],
  ["cozinha", { roupa: "uniforme", camisa: 0xf2efe8 }, 3.3, "interior", "close", 1], ["rua", { roupa: "casaco", camisa: 0x8a4a3a, bone: true }, 3.95, "por-do-sol", "medio", -1]];
const G = SETS.map(([cen, roupa], i) => { const g = new THREE.Group(); g.position.x = i * 30; S.add(g); CI.cenario(g, cen, { seed: 4 });
  const p = ID.heroi(LP, roupa); p.root.position.set(0, i === 3 ? 0.11 : 0, -0.4); g.add(p.root); return { g, p }; });
const v = new THREE.Vector3();
function render(t) {
  let i = 0; SETS.forEach((s, j) => { if (t >= s[2]) i = j; });
  const [, , t0, luz, tipo, lado] = SETS[i], t1 = i < 3 ? SETS[i + 1][2] : 5.83, u = t - t0;
  G.forEach((x, j) => (x.g.visible = j === i)); LP.luz(st, luz); st.exposicao = 1.2;
  const { g, p } = G[i];
  LP.ator(p, u, { seed: 12 + i, gestos: i !== 1, emocao: i === 0 ? ["duvida", "surpresa", range(t, 1.3, 1.7)] : i === 3 ? ["calmo", "alegre", range(t, 4.1, 4.6)] : "foco", olhar: i === 1 ? [0.2, -0.3] : null });
  const R = g.localToWorld(v.set(0, (i === 3 ? 0.11 : 0) + 1.62, -0.34));
  CI.plano(st, R, u, u / (t1 - t0), tipo, { lado, seed: i + 2 });
  st.draw();
  const c = st.ctx, n = i < 3 ? i + 1 : Math.min(10, 4 + Math.floor(6 * range(t, 3.95, 4.3)));
  ID.lista(c, [["APOSENTADORIA", 0.1, 1.55]], t, 540, 700, { w: 560 });
  ID.txt(c, "TRABALHAR POR SÉCULOS", 540, 700, { tam: 30, cor: ID.LARANJA, a: range(t, 3.01, 3.2) * (1 - range(t, 3.85, 3.95)), esp: 0.25 });
  ID.txt(c, "PROFISSÃO " + n + " / 10", 540, 960, { tam: 34, cor: n === 10 ? ID.LARANJA : ID.AZUL, a: range(t, 2.0, 2.2), esp: 0.25 });
}
