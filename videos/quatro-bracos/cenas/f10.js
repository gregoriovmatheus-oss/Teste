/*META {"imports": ["lowpoly", "cinema", "quatro"], "rotulos": [], "D0": 5.47, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, Q4 = QUATRO;
        await Q4.prepara();
        const st = LP.palco(canvas, { foco: 2.4, faixa: 1.0, desfoque: 18, bloom: 0.8 });
        const { S, cam } = st;
        const v = new THREE.Vector3(), box = (w, h, d, c, x, y, z, r = 0.7, g = S) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), LP.mat(c, r)); m.position.set(x, y, z); g.add(m); return m; };
        // ---- plano GA (0–2,95 s): camiseta com 4 mangas na arara + cadeira de braços apertada
        const GA = new THREE.Group(); S.add(GA); CI.cenario(GA, "escritorio");
        box(0.62, 0.08, 0.56, 0x2a2c32, 0, 0.46, 0.05, 0.6, GA); box(0.62, 0.62, 0.08, 0x2a2c32, 0, 0.8, -0.24, 0.6, GA);
        [-1, 1].forEach((s) => { box(0.06, 0.05, 0.42, 0x1a1a1e, s * 0.3, 0.68, 0.08, 0.5, GA); box(0.04, 0.22, 0.04, 0x1a1a1e, s * 0.3, 0.57, 0.12, 0.5, GA); });
        const pA = Q4.heroi(LP, { camisa: 0x3e6a8a }); pA.root.position.set(0, 0, 0.12); GA.add(pA.root);
        // ---- plano GB (3,0–5,47 s): dormir de lado
        const GB = new THREE.Group(); GB.position.x = 20; S.add(GB); CI.cenario(GB, "quarto");
        box(2.2, 0.42, 1.1, 0x3a3a48, 0, 0.21, 0.3, 0.8, GB); box(2.1, 0.12, 1.05, 0xe8e4f0, 0, 0.48, 0.3, 0.9, GB);
        const trav = box(0.42, 0.14, 0.62, 0xf4f0f8, 0.88, 0.6, 0.3, 0.9, GB);
        const pB = Q4.heroi(LP, { roupa: "pijama" }); GB.add(pB.root);
        const ab = CI.luzPratica(GB, "abajur", [1.4, 0.4, -0.6], { forca: 1.2 }); box(0.5, 0.4, 0.4, 0x5a4030, 1.4, 0.2, -0.6, 0.7, GB);
        function render(t) {
          const b = t >= 2.98; GA.visible = !b; GB.visible = b;
          if (!b) {
            LP.luz(st, "interior"); st.exposicao = 1.15;
            LP.ator(pA, t, { seed: 7, pose: "sentado", emocao: ["duvida", "nervoso", range(t, 1.6, 2.3)], olharPara: v.set(0.5, 0.6, 0.4), olharK: 0.6 * range(t, 1.9, 2.4) });
            // braços de baixo espremidos contra os braços da cadeira; os de cima abertos, sem lugar
            Q4.baixo(pA, LP, [0.27, 0.74, 0.2], [-0.27, 0.74, 0.2], 1);
            [0, 1].forEach((i) => { const bb = pA.bracos[i]; bb.om.rotation.z = bb.s * (0.55 + 0.05 * Math.sin(t * 3 + i)); bb.om.rotation.x = -0.35; bb.cot.rotation.x = -1.0; });
            pA.root.position.x = 0.015 * Math.sin(t * 6) * range(t, 1.8, 2.2);
            CI.trilho(cam, t, [[0, [1.2, 1.5, 2.7], [0, 0.95, 0.1]], [2.98, [0.5, 1.45, 2.4], [0, 0.95, 0.1]]], { mao: 1, seed: 2 }); LP.focar(st, v.set(0, 1.3, 0.2));
          } else {
            const u = t - 2.98; LP.luz(st, "noite"); st.exposicao = 1.25; st.hemi.intensity = 0.5;
            LP.ator(pB, u, { seed: 7, emocao: ["sono", "dor", range(u, 0.6, 1.4)], vida: { balanco: 0 } });
            // deitado de lado (gira no eixo z): pernas dobradas, o braço de baixo preso sob o corpo
            pB.root.position.set(-0.82, 0.7, 0.3); pB.root.rotation.set(0, 0, -Math.PI / 2);
            pB.pernas.forEach((l) => { l.q.rotation.x = -0.9; l.j.rotation.x = 1.3; });
            pB.bracos.forEach((bb, i) => { if (i === 0 || i === 2) { bb.om.rotation.x = -1.25 + (i === 2 ? 0.3 : 0); bb.om.rotation.z = 0; bb.cot.rotation.x = -0.7; }
              else { bb.om.rotation.x = -0.25 - 0.3 * (i === 3) + 0.06 * Math.sin(u * 2 + i); bb.om.rotation.z = -0.25; bb.cot.rotation.x = -0.6; } });
            pB.cab.rotation.z = -0.1 + 0.04 * Math.sin(u * 1.5);
            ab.update(u);
            CI.trilho(cam, u, [[0, [22.3, 1.35, 1.7], [20.55, 0.62, 0.3]], [2.49, [22.0, 1.55, 2.2], [20.45, 0.6, 0.3]]], { mao: 1, seed: 5 }); LP.focar(st, v.set(20.85, 0.85, 0.3));
          }
          st.draw();
          const c = st.ctx;
          if (!b) { Q4.tag(c, "ROUPAS NOVAS", GA.localToWorld(v.set(0.22, 1.25, 0.2)), cam, range(t, 1.34, 1.6), { cor: Q4.LARANJA, dx: 150, dy: -330 });
            Q4.tag(c, "CADEIRAS NOVAS", GA.localToWorld(v.set(-0.3, 0.7, 0.1)), cam, range(t, 2.1, 2.35), { cor: Q4.LARANJA, dx: -120, dy: -280 }); }
          else Q4.tag(c, "DORMIR DE LADO?", GB.localToWorld(v.set(0.2, 0.85, 0.3)), cam, range(t, 3.1, 3.4), { cor: Q4.LARANJA, dy: -260, dx: -80 });
        }
