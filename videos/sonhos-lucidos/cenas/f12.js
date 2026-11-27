/*META {"imports": ["lowpoly", "cinema", "sonho"], "rotulos": [], "D0": 4.4, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const LP = LOWPOLY, CI = CINEMA, SN = SONHO;
await SN.prepara();
const st = LP.palco(canvas, { foco: 2.0, faixa: 1.0, desfoque: 18, bloom: 0.8 });
const { S, cam } = st;
LP.luz(st, "dia"); st.exposicao = 1.1;
CI.cenario(S, "rua", { seed: 3 }); CI.ceu(S, { topo: 0x5a8ad8, horizonte: 0xd8e8ff, nuvens: 5, seed: 7 });
// a rua inteira olhando para as próprias mãos: 2 pessoas na frente contando, figurantes atrás com a mão erguida
const PA = LP.pessoa({ seed: 81, feminina: true, roupa: "casaco", camisa: 0xe8e0d0, jaqueta: 0xb84a3a, pele: 0xe0b090, cabelo: 0x5a3018 });
const PB = LP.pessoa({ seed: 91, roupa: "jaqueta", camisa: 0xf2f0ea, jaqueta: 0x2f4a6a, pele: 0x8a5a3a, cabelo: 0x120a06, oculos: true });
PA.root.position.set(-0.45, 0, 0.2); PA.root.rotation.y = 0.35; PB.root.position.set(0.75, 0, -1.3); PB.root.rotation.y = -0.4; S.add(PA.root, PB.root);
const F = [], r = mulberry32(12);
for (let i = 0; i < 12; i++) { const f = LP.figurante({ seed: 100 + i, roupa: [0x3d5a80, 0x8a3a3a, 0x4a6a3a, 0x6a5a8a, 0xb08a3a][i % 5], pele: [0xd8a07a, 0x8a5a3a, 0xc08060, 0xf0c8a0][i % 4] });
  f.root.position.set((r() - 0.5) * 6, 0, -3 - r() * 12); f.root.rotation.y = r() < 0.5 ? 0 : Math.PI; S.add(f.root); F.push([f, r() * 3, r() < 0.6, f.root.position.z]); }
const v = new THREE.Vector3(), R = new THREE.Vector3(), H = new THREE.Vector3();
const mao = (p, lado, k, n) => { const b = LP.pontoCabeca(p, "boca", lado); p.root.updateMatrixWorld(true); H.set(lado ? -0.12 : 0.12, -0.12, 0.3).applyQuaternion(p.root.quaternion).add(b);
  LP.alcancar(p, lado, H, k, { polo: new THREE.Vector3(lado ? 1 : -1, -1, 0), maoGira: lado ? 1.2 : -1.2 }); if (n !== null) SN.contarDedos(p, lado, n, k); };
function render(t) {
  const nA = Math.min(4, Math.floor(range(t, 0.4, 3.6) * 5)), nB = Math.min(4, Math.floor(range(t, 0.9, 3.9) * 5));
  LP.ator(PA, t, { seed: 81, emocao: ["foco", "duvida", range(t, 2.6, 3.2)] }); mao(PA, 0, 1, nA); LP.olharPara(PA, H, 0.8);
  LP.ator(PB, t, { seed: 91, emocao: "foco" }); mao(PB, 1, 1, nB); LP.olharPara(PB, H, 0.8);
  F.forEach(([f, ph, ergue, z0], i) => { const d = LP.ator(f, t + ph, { seed: 100 + i, andar: { vel: 0.7 } }); f.root.position.z = z0 + (f.root.rotation.y ? -1 : 1) * (d - 0) * 0.5; if (ergue) { f.root.updateMatrixWorld(true); const c = f.cab.getWorldPosition(v); LP.alcancar(f, 0, v.set(c.x + 0.05, c.y - 0.1, c.z + (f.root.rotation.y ? -0.3 : 0.3)), 1); } });
  PA.root.updateMatrixWorld(true); R.copy(LP.pontoCabeca(PA, "testa"));
  CI.plano(st, R, t, t / 4.4, "medio", { lado: 1, seed: 9 }); st.U.faixa.value = 1.2;
  LP.focar(st, R);
  st.draw();
  const c = st.ctx, n = Math.max(1, nA + 1);
  SN.numero(c, String(n), 540, 760, range(t, 0.4, 0.55) * (1 - range(t, 3.9, 4.1)), { tam: 110, cor: n === 5 ? "#ffd27a" : null });
  SN.txt(c, "CONTANDO OS DEDOS", 540, 880, { tam: 30, cor: SN.AZUL, a: range(t, 1.98, 2.2), esp: 0.3 });
  SN.txt(c, "SÓ PARA TER CERTEZA", 540, 975, { tam: 30, cor: SN.LARANJA, a: range(t, 3.47, 3.7), esp: 0.24 });
}
