/*META {"imports": ["lowpoly", "hiber"], "rotulos": [], "D0": 5.43, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        await HIBER.prepara();
        const LP = LOWPOLY, Q = HIBER.QUARTO;
        const st = LP.palco(canvas, { foco: 1.0, faixa: 0.35, desfoque: 24 });
        const { S, cam } = st;
        S.background = new THREE.Color(0x2a3442); st.exposicao = 1.25;
        st.hemi.intensity = 0.6; st.fria.color.set(0xfff0d8); st.fria.intensity = 2.2; st.fria.position.set(-1.6, 3.5, -2.5); st.quente.intensity = 1.2; st.quente.position.set(-2.5, 1.2, 1.5);
        const q = HIBER.quarto(S, { mk: LP.mat, estacao: "primavera" });
        q.cal.set(3);
        const p = LP.pessoa({ seed: 7, pele: 0xc08a6a, cabelo: 0x2a1a10, jaqueta: 0x3c4c62, camisa: 0x8a9ab0, barba: 0x3a2618, iris: 0x4a3020 });
        p.root.rotation.z = Math.PI / 2; p.root.position.set(Q.cabeca.x + 1.65, Q.cabeca.y, Q.cabeca.z); S.add(p.root);
        p.bracos.forEach((b) => { b.om.rotation.x = -1.1; b.cot.rotation.x = -1.2; });
        const alvo = new THREE.Vector3(), up = new THREE.Vector3(), v3 = new THREE.Vector3();
        const NOT = [["MENSAGENS NÃO LIDAS", 3.07], ["CONTAS DO TRIMESTRE", 3.38], ["RESULTADOS DO CAMPEONATO", 3.75], ["PREVISÃO: PRIMAVERA", 3.94], ["3 MESES DE NOTÍCIAS", 4.48]];
        function render(t) {
          // acordar devagar: pálpebras pesadas (músculos lentos), piscadas, sobrancelhas confusas, boca abre na "fome"
          const abre = ease.inOutSine(range(t, 0.1, 1.9)), pisc = Math.max(0, 1 - Math.abs(t - 2.6) / 0.14);
          const ab = lerp(lerp(-1.05, 0.42, abre), -1.0, pisc);
          const conf = range(t, 1.0, 1.6), fome = Math.sin(Math.PI * range(t, 2.2, 3.1));
          p.emocao({ br: lerp(0, -0.34, conf), by: lerp(0.31, 0.39, conf), bo: [lerp(0.9, 0.85, fome), lerp(0.3, 1.25, fome)], ab, ol: [Math.sin(t * 1.3) * 0.3 * conf, 0.1] });
          p.cab.rotation.set(0, 0.12 + Math.sin(t * 0.9) * 0.05, -0.04 + 0.08 * conf);
          // câmera inclinada (deitado), recua e endireita devagar
          const e = ease.inOutSine(range(t, 0, 5.43));
          up.set(lerp(-0.85, -0.5, e), lerp(0.55, 0.85, e), 0).normalize(); cam.up.copy(up);
          cam.position.set(lerp(-0.82, -0.55, e), lerp(0.86, 0.95, e), lerp(0.5, 0.85, e));
          alvo.set(lerp(-0.96, -0.85, e), lerp(0.66, 0.6, e), -0.6); cam.lookAt(alvo);
          st.U.foco.value = cam.position.distanceTo(Q.cabeca);
          st.draw();
          const c = st.ctx, vv = HIBER.vis(st);
          [["MÚSCULOS LENTOS", 1.25, HIBER.AZUL, 760], ["FOME ENORME", 2.2, HIBER.LARANJA, 850]].forEach(([s, t0, cor, y]) => {
            const a = vv * range(t, t0, t0 + 0.25) * (1 - range(t, 2.9, 3.05)); if (a <= 0) return;
            HIBER.painel(c, 290, y - 32, 500, 64, a, { borda: cor }); HIBER.txt(c, s, 540, y, { tam: 30, cor, a, esp: 0.15 });
          });
          // notícias acumuladas caindo em pilha
          NOT.forEach(([s, t0], i) => {
            const k = ease.outBack ? ease.outBack(range(t, t0, t0 + 0.35)) : ease.outCubic(range(t, t0, t0 + 0.35)), a = vv * range(t, t0, t0 + 0.15);
            if (a <= 0) return;
            const y = lerp(560, 940 - i * 64, k), rot = (i % 2 ? 1 : -1) * 0.025 * (i + 1), ult = i === NOT.length - 1;
            c.save(); c.translate(540, y); c.rotate(rot);
            HIBER.painel(c, -300, -28, 600, 56, a, { borda: ult ? HIBER.LARANJA : HIBER.AZUL });
            HIBER.txt(c, s, 0, 0, { tam: ult ? 30 : 24, cor: ult ? HIBER.LARANJA : "#e8f2ff", a, esp: 0.12 });
            c.restore();
          });
        }
