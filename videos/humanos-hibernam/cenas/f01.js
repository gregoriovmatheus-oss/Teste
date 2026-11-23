/*META {"imports": ["lowpoly", "hiber"], "rotulos": [{"de": 0.0, "ate": 2.75, "texto": "<span class=\"k\">UM EXPERIMENTO MENTAL</span><br>E se a gente pudesse <span class=\"y\">hibernar</span>?"}, {"de": 4.32, "ate": 5.96, "texto": "<span class=\"y\">3 meses</span> depois"}], "D0": 5.96} */
        await HIBER.prepara();
        const LP = LOWPOLY, Q = HIBER.QUARTO;
        const st = LP.palco(canvas, { foco: 1.0, faixa: 0.35, desfoque: 24 });
        const { S, cam } = st;
        S.background = new THREE.Color(0x0b1220); st.exposicao = 1.15;
        st.hemi.intensity = 0.35; st.fria.intensity = 1.6; st.fria.position.set(-1.6, 3.5, -2.5); st.quente.intensity = 0.9; st.quente.position.set(-2.5, 1.2, 1.5);
        const q = HIBER.quarto(S, { mk: LP.mat, estacao: "inverno" });
        const p = LP.pessoa({ seed: 7, pele: 0xc08a6a, cabelo: 0x2a1a10, jaqueta: 0x3c4c62, camisa: 0x8a9ab0, barba: false, iris: 0x4a3020 });
        p.root.rotation.z = Math.PI / 2; p.root.position.set(Q.cabeca.x + 1.65, Q.cabeca.y, Q.cabeca.z); S.add(p.root);
        p.bracos.forEach((b) => { b.om.rotation.x = -1.1; b.cot.rotation.x = -1.2; });
        const alvo = new THREE.Vector3();
        function render(t) {
          q.neve.update(t, 0.08);
          // olhos pesados: piscada em 0,9 s; fecham em "deita" (2,56 s) e ficam fechados
          const fecha = ease.inOutSine(range(t, 2.2, 2.95)), pisc = Math.max(0, 1 - Math.abs(t - 0.95) / 0.12);
          const ab = lerp(0.55, 0.0, fecha) * (1 - pisc * 0.9);
          p.emocao({ br: lerp(-0.12, 0.05, fecha), by: 0.33, bo: [0.9, 0.25], ab, ol: [lerp(-0.25, 0, range(t, 0, 1.2)), 0.08] });
          p.cab.rotation.set(0.0, 0.12, lerp(0.05, -0.03, fecha));
          // câmera: close no rosto (empurra devagar) e depois sobe e abre para a janela e o calendário
          const e1 = ease.inOutSine(range(t, 0, 2.9)), e2 = ease.inOutCubic(range(t, 2.75, 4.3));
          cam.position.set(lerp(lerp(-0.62, -0.7, e1), 0.05, e2), lerp(lerp(0.98, 0.95, e1), 1.38, e2), lerp(lerp(0.42, 0.3, e1), 1.55, e2));
          alvo.set(lerp(-1.0, 0.05, e2), lerp(0.66, 1.62, e2), lerp(-0.6, -1.4, e2));
          cam.lookAt(alvo);
          st.U.foco.value = lerp(0.95, cam.position.distanceTo(new THREE.Vector3(0.55, 1.7, -1.5)), e2);
          st.U.faixa.value = lerp(0.3, 0.8, e2);
          // calendário: dezembro → março em "acorda em março" (3,2–3,9 s)
          q.cal.set(3 * ease.inOutSine(range(t, 3.1, 3.95)));
          st.draw();
        }
