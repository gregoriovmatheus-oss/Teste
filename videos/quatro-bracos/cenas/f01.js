/*META {"imports": ["lowpoly", "cinema", "quatro"], "rotulos": [], "D0": 4.67, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, Q4 = QUATRO;
        await Q4.prepara();
        const st = LP.palco(canvas, { foco: 1.0, faixa: 0.4, desfoque: 22, bloom: 0.9 });
        const { S, cam } = st;
        LP.luz(st, "interior"); st.exposicao = 1.12;
        CI.cenario(S, "quarto"); st.sol(new THREE.Vector3(-2.94, 1.6, -0.8), 1.2);
        const poe = LP.poeira(S, { n: 160, centro: [-1.2, 1.7, -0.4], raio: [1.2, 0.9, 1.0] });
        LP.bokeh(S, { n: 26, seed: 4, y: [0.8, 2.6], z: [-6, -3], cores: [0xfff0d0, 0xffc88a] });
        const p = Q4.heroi(LP, { roupa: "pijama" }); p.root.position.set(0.2, 0, 0.6); p.root.rotation.y = 0.18; S.add(p.root);
        const R = new THREE.Vector3(0.24, 1.64, 0.66);
        function render(t) {
          // bocejo → espreguiça (de cima em "espreguiçar", 1,05 s) → os de baixo abrem em "quatro" (2,94 s) → surpresa
          LP.ator(p, t, { seed: 7, emocao: t < 2.7 ? ["sono", "bocejo", range(t, 0.2, 1.4)] : ["bocejo", "surpresa", range(t, 2.75, 3.3)], olhar: t > 3 ? [0.55, -0.1] : null });
          Q4.espreguica(p, ease.inOutCubic(range(t, 1.0, 2.4)), { baixoK: ease.outBack(range(t, 2.85, 3.6)) });
          if (t > 3) LP.olharPara(p, new THREE.Vector3(1.0, 1.2, 1.2), 0.5 * range(t, 3.1, 3.8));
          CI.trilho(cam, t, [[0, [0.55, 1.72, 1.85], [0.24, 1.42, 0.6]], [1.6, [0.62, 1.74, 2.2], [0.24, 1.45, 0.6]], [3.2, [0.95, 1.78, 3.7], [0.2, 1.55, 0.6]], [4.67, [1.15, 1.8, 4.25], [0.2, 1.6, 0.6]]], { mao: 1, seed: 2 });
          LP.focar(st, R); CI.preenche(st, R, { forca: 0.7 }); st.U.faixa.value = lerp(0.35, 1.0, range(t, 1.5, 3.2));
          poe.update(t);
          st.draw();
          Q4.titulo(st.ctx, "UM EXPERIMENTO MENTAL", ["E se você tivesse", "*quatro braços*?"], 1 - range(t, 1.9, 2.3), { y: 830, tam: 78 });
        }
