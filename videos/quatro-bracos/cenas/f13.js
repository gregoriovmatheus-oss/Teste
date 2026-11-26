/*META {"imports": ["lowpoly", "cinema", "quatro"], "rotulos": [], "D0": 6.23, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, Q4 = QUATRO;
        await Q4.prepara();
        const st = LP.palco(canvas, { foco: 1.6, faixa: 0.8, desfoque: 22, bloom: 1.0 });
        const { S, cam } = st;
        LP.luz(st, "por-do-sol"); st.exposicao = 1.15; st.quente.intensity = 2.0; st.quente.position.set(1.6, 2.2, 3.2);
        CI.cenario(S, "quarto"); st.sol(new THREE.Vector3(-2.94, 1.6, -0.8), 1.4);
        const ab = CI.luzPratica(S, "abajur", [-0.6, 0.5, -2.6], { forca: 1.2 });
        const poe = LP.poeira(S, { n: 160, centro: [-1.2, 1.7, -0.4], raio: [1.2, 0.9, 1.0], cor: 0xffc890 });
        LP.bokeh(S, { n: 26, seed: 4, y: [0.8, 2.6], z: [-6, -3], cores: [0xffb070, 0xffc88a] });
        const p = Q4.heroi(LP, { roupa: "pijama" }); p.root.position.set(0.2, 0, 0.6); p.root.rotation.y = 0.18; S.add(p.root);
        const R = new THREE.Vector3(0.24, 1.64, 0.66);
        function render(t) {
          // espreguiça de novo ("espreguiçaria", 1,6 s), os 4 braços no alto em "quatro" (3,5 s); caem cansados em "cansados" (4,3 s)
          const sobe = ease.inOutCubic(range(t, 1.4, 2.6)) * (1 - ease.inOutCubic(range(t, 4.3, 5.4)));
          LP.ator(p, t, { seed: 7, emocao: t < 4.2 ? ["alegre", "bocejo", range(t, 1.6, 2.4)] : ["bocejo", "sono", range(t, 4.3, 5.0)] });
          Q4.espreguica(p, sobe, { baixoK: ease.outBack(range(t, 3.3, 3.9)) * (1 - ease.inOutCubic(range(t, 4.3, 5.4))) });
          p.coluna.rotation.x += 0.12 * range(t, 4.5, 5.6); p.cab.rotation.x += 0.15 * range(t, 4.5, 5.6);
          // câmera: do plano aberto (fim da f01) volta ao close do quadro 0
          CI.trilho(cam, t, [[0, [1.15, 1.8, 4.25], [0.2, 1.6, 0.6]], [3.6, [0.95, 1.78, 3.7], [0.2, 1.55, 0.6]], [5.7, [0.62, 1.78, 2.75], [0.24, 1.22, 0.6]], [6.23, [0.61, 1.78, 2.72], [0.24, 1.22, 0.6]]], { mao: 1, seed: 2 });
          LP.focar(st, R); CI.preenche(st, R, { forca: 2.5 }); st.U.faixa.value = lerp(1.0, 0.4, range(t, 4.0, 6.0));
          poe.update(t); ab.update(t);
          st.draw();
          Q4.titulo(st.ctx, "", ["*quatro braços*,", "um foco só"], range(t, 5.0, 5.5), { y: 880, tam: 70 });
        }
