/*META {"imports": ["lowpoly", "doissois"], "rotulos": [{"de": 2.15, "ate": 3.55, "texto": "a nossa<br><span class=\"y\">noite escura</span>"}, {"de": 3.6, "ate": 5.84, "texto": "é um<br><span class=\"y\">presente raro</span>"}], "D0": 5.84} */
        const LP = LOWPOLY, DS = DOISSOIS;
        const st = LP.palco(canvas, { fov: 34, foco: 48, faixa: 30, desfoque: 28, fundo: 0x1a120e });
        const { S, cam } = st;
        const Q = DS.quarto(S, LP);
        const p = LP.pessoa({ seed: 7, pele: 0xc08a6a, cabelo: 0x2a1a10, jaqueta: 0x56657a, camisa: 0xd8d2c6, barba: false, iris: 0x4a3420 });
        S.add(p.root);
        st.rim.color.set(0x8fb4ff); st.rim.intensity = 1.4; st.rim2.intensity = 0.6;
        const olho = new THREE.Vector3(), alvo = new THREE.Vector3();
        const A0 = new THREE.Vector3(0, 1.36, 0), A1 = new THREE.Vector3(-0.2, 1.4, 50);
        const DIA = new THREE.Color(1, 1, 1), NOITE = new THREE.Color(0.07, 0.09, 0.2), sol = new THREE.Color(0xffdca0), lua = new THREE.Color(0x8aa8e0);
        function render(t) {
          // a imagem do começo, ao contrário: os sóis se põem atrás dos morros e o céu escurece até a noite
          const n = ease.inOutSine(range(t, 0.1, 2.4));
          Q.SA.group.position.y = lerp(10.5, -9, ease.inCubic(range(t, 0, 2.2))); Q.SV.group.position.y = lerp(7.8, -8, ease.inCubic(range(t, 0.2, 2.3)));
          Q.SA.set(1, t); Q.SV.set(1, t);
          Q.ceuM.color.copy(DIA).lerp(NOITE, n); Q.noite.set(range(t, 1.2, 2.6), t);
          st.fria.color.copy(sol).lerp(lua, n); st.fria.intensity = lerp(3.0, 1.6, n);
          st.quente.color.set(0xff7a50); st.quente.intensity = 1.3 * (1 - n); st.hemi.intensity = lerp(0.35, 0.18, n);
          st.exposicao = lerp(1.1, 1.25, n);
          p.emocao("calmo", [0, 0.25 - 0.15 * range(t, 3, 5)]);
          p.cab.rotation.set(-0.1 + 0.06 * range(t, 3, 5.5), lerp(-0.06, 0.08, range(t, 2.4, 5.8)), 0.03);
          // câmera: atrás do ombro olhando a janela -> gira até o rosto (o mesmo quadro do início)
          const o = 1 - ease.inOutCubic(range(t, 1.7, 3.1));
          const a = lerp(lerp(-0.18, 0.12, ease.inOutSine(range(t, 3.1, 5.84))), Math.PI - 0.1, o);
          const r = lerp(1.62 - 0.08 * range(t, 3.1, 5.84), 0.8, o) - 0.75 * Math.sin(Math.PI * o);
          olho.set(Math.sin(a) * r, lerp(1.6, 1.82, o), Math.cos(a) * r);
          cam.position.copy(olho);
          alvo.lerpVectors(A0, A1, ease.inCubic(o)); cam.lookAt(alvo);
          const fz = ease.inOutCubic(range(t, 1.9, 2.8));
          st.U.foco.value = lerp(48, r, fz); st.U.faixa.value = lerp(30, 0.7, fz);
          st.draw();
        }
