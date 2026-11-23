/*META {"imports": ["lowpoly", "hiber"], "rotulos": [{"de": 0.0, "ate": 2.75, "texto": "<span class=\"k\">UM EXPERIMENTO MENTAL</span><br>E se a gente pudesse <span class=\"y\">hibernar</span>?"}, {"de": 4.32, "ate": 5.96, "texto": "<span class=\"y\">3 meses</span> depois"}], "D0": 5.96, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        await HIBER.prepara();
        const LP = LOWPOLY, Q = HIBER.QUARTO;
        const st = LP.palco(canvas, { foco: 1.0, faixa: 0.35, desfoque: 24 });
        const { S, cam } = st;
        S.background = new THREE.Color(0x0b1220); st.exposicao = 1.2;
        st.hemi.intensity = 0.45; st.fria.intensity = 1.8; st.fria.position.set(-1.6, 3.5, -2.5); st.quente.intensity = 1.1; st.quente.position.set(-2.5, 1.2, 1.5);
        const q = HIBER.quarto(S, { mk: LP.mat, estacao: "inverno" });
        const p = LP.pessoa({ seed: 7, pele: 0xc08a6a, cabelo: 0x2a1a10, jaqueta: 0x3c4c62, camisa: 0x8a9ab0, barba: false, iris: 0x4a3020 });
        p.root.rotation.z = Math.PI / 2; p.root.position.set(Q.cabeca.x + 1.65, Q.cabeca.y, Q.cabeca.z); S.add(p.root);
        p.bracos.forEach((b) => { b.om.rotation.x = -1.1; b.cot.rotation.x = -1.2; });
        const alvo = new THREE.Vector3(), upD = new THREE.Vector3(-0.8, 0.6, 0).normalize(), up0 = new THREE.Vector3(0, 1, 0);
        const CAL = new THREE.Vector3(0.8, 1.7, -1.52);
        function render(t) {
          q.neve.update(t, 0.08);
          // olhos pesados: piscada em 0,9 s; fecham em "deita" (2,56 s) e ficam fechados
          const fecha = ease.inOutSine(range(t, 2.2, 2.95)), pisc = Math.max(0, 1 - Math.abs(t - 0.95) / 0.12);
          const ab = lerp(lerp(0.5, -1.05, pisc), -1.05, fecha);
          p.emocao({ br: lerp(-0.14, 0.04, fecha), by: 0.33, bo: [0.9, 0.25], ab, ol: [lerp(-0.25, 0, range(t, 0, 1.2)), 0.08] });
          p.cab.rotation.set(0.0, 0.15, lerp(0.05, -0.03, fecha));
          // câmera: rosto (deitado, câmera inclinada junto) empurra devagar; depois sobe, endireita e abre para o calendário
          const e1 = ease.inOutSine(range(t, 0, 2.9)), e2 = ease.inOutCubic(range(t, 2.8, 4.3));
          cam.up.copy(upD).lerp(up0, e2).normalize();
          cam.position.set(lerp(lerp(-0.6, -0.7, e1), 0.5, e2), lerp(lerp(0.88, 0.86, e1), 1.5, e2), lerp(lerp(0.75, 0.55, e1), 0.95, e2));
          alvo.set(lerp(-0.92, 0.78, e2), lerp(0.64, 1.36, e2), lerp(-0.6, -1.5, e2));
          cam.lookAt(alvo);
          st.U.foco.value = lerp(cam.position.distanceTo(Q.cabeca), cam.position.distanceTo(CAL), e2);
          st.U.faixa.value = lerp(0.35, 0.9, e2);
          // calendário: dezembro → março em "acorda em março" (3,2–3,9 s)
          q.cal.set(3 * ease.inOutSine(range(t, 3.15, 3.95)));
          st.T = Math.max(t, 0.17);   // frame 0 = miniatura: sem o dip de entrada
          st.draw();
        }
