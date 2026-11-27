/*META {"imports": ["lowpoly", "cinema", "sonho"], "rotulos": [], "D0": 5.21, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const LP = LOWPOLY, CI = CINEMA, SN = SONHO;
await SN.prepara();
const st = LP.palco(canvas, { foco: 2.2, faixa: 0.7, desfoque: 20, bloom: 1.0 });
const { S, cam } = st;
LP.luz(st, "noite"); st.exposicao = 1.15; st.hemi.intensity = 0.55;
CI.cenario(S, "quarto");
const ab = CI.luzPratica(S, "abajur", [-0.3, 0.5, -2.6], { forca: 0.7 });
const janela = new THREE.PointLight(0x8fb0ff, 2.5, 6, 1.5); janela.position.set(-2.4, 1.8, -0.8); S.add(janela);
const p = SN.heroi(LP); S.add(p.root);
// orbes do sonho: soltos e caóticos → em "controlar" formam um anel ordenado que gira sobre a cama
const N = 36, r = mulberry32(8), orb = [], C0 = new THREE.Vector3(0.8, 1.75, -1.75);
for (let i = 0; i < N; i++) { const s = SN.brilho([0xb08aff, 0x7cc8ff, 0xff9ad8, 0xffd27a][i % 4], 0.16 + r() * 0.12, "suave", 0.9); S.add(s); orb.push([s, new THREE.Vector3((r() - 0.5) * 2.6, (r() - 0.3) * 1.4, (r() - 0.5) * 2.2), r() * 6]); }
const v = new THREE.Vector3(), R = new THREE.Vector3(), al = new THREE.Vector3();
function render(t) {
  SN.deitado(LP, p, t, [0.8, 0.63, -0.72], { seed: 7, emocao: "dormindo", vida: { resp: 1.4 } });
  const k = ease.inOutCubic(range(t, 1.05, 1.9));
  orb.forEach(([s, d, f], i) => { const a = (i / N) * 6.283 + t * 0.6, rr = 0.55 + 0.05 * Math.sin(t * 2 + i);
    v.set(C0.x + d.x + 0.12 * Math.sin(t * 1.3 + f), C0.y + d.y + 0.1 * Math.sin(t + f), C0.z + d.z).lerp(R.set(C0.x + Math.cos(a) * rr, C0.y + 0.25, C0.z + Math.sin(a) * rr), k);
    s.position.copy(v); s.material.opacity = 0.6 + 0.35 * Math.sin(t * 3 + f); });
  CI.trilho(cam, t, [[0, [2.5, 1.5, 0.9], [0.8, 1.25, -1.9]], [2.6, [2.2, 1.65, 0.5], [0.8, 1.3, -1.9]], [5.21, [1.9, 1.85, 0.2], [0.8, 1.25, -1.95]]], { mao: 1, seed: 5 });
  LP.focar(st, al.set(0.8, 0.8, -2.0)); ab.update && ab.update(t);
  st.draw();
  const c = st.ctx, hk = ease.inOutCubic(range(t, 3.3, 4.2));
  SN.txt(c, "CONTROLAR TODOS", 540, 975, { tam: 32, cor: SN.AZUL, a: range(t, 1.05, 1.3) * (1 - range(t, 2.1, 2.3)), esp: 0.3 });
  SN.txt(c, "TODA NOITE", 540, 700, { tam: 28, cor: "#fff", a: range(t, 2.34, 2.55), esp: 0.34 });
  if (t > 3.2) { c.save(); c.globalAlpha = range(t, 3.2, 3.4); c.lineCap = "round";
    c.strokeStyle = "rgba(124,200,255,0.25)"; c.lineWidth = 10; c.beginPath(); c.arc(540, 850, 110, 0, 6.283); c.stroke();
    c.strokeStyle = "#ff8a4c"; c.shadowColor = "#ff8a4c"; c.shadowBlur = 20; c.beginPath(); c.arc(540, 850, 110, -Math.PI / 2, -Math.PI / 2 + hk * Math.PI * 2 * (2 / 8)); c.stroke(); c.restore(); }
  SN.numero(c, "2 h", 540, 852, range(t, 3.3, 3.5), { tam: 92 });
  SN.txt(c, "DE SONHO SÓ SEU", 540, 995, { tam: 28, cor: SN.LARANJA, a: range(t, 4.16, 4.4), esp: 0.28 });
}
