/*META {"imports": ["lowpoly", "doissois"], "rotulos": [{"de": 0.0, "ate": 2.9, "texto": "<span class=\"k\">UM EXPERIMENTO MENTAL</span><br>E se a Terra tivesse <span class=\"y\">dois sóis?</span>"}], "D0": 5.84} */
        const LP = LOWPOLY, DS = DOISSOIS;
        await DS.fontes();
        const st = LP.palco(canvas, { fov: 34, foco: 1.7, faixa: 0.7, desfoque: 28, fundo: 0x1a120e });
        const { S, cam } = st;
        const Q = DS.quarto(S, LP);
        const p = LP.pessoa({ seed: 7, pele: 0xc08a6a, cabelo: 0x2a1a10, jaqueta: 0x56657a, camisa: 0xd8d2c6, barba: false, iris: 0x4a3420 });
        S.add(p.root);
        // luz dos dois sóis entrando pela janela: amarela (com sombra) e vermelha
        st.fria.color.set(0xffdca0); st.fria.intensity = 3.0; st.fria.position.set(-1.2, 3.6, 6);
        st.quente.color.set(0xff7a50); st.quente.intensity = 1.3; st.quente.position.set(2.6, 2.3, 6);
        st.rim.color.set(0x8fb4ff); st.rim.intensity = 1.4; st.rim2.intensity = 0.6; st.hemi.intensity = 0.35;
        const v3 = new THREE.Vector3(), olho = new THREE.Vector3(), alvo = new THREE.Vector3();
        const A0 = new THREE.Vector3(0, 1.45, 0), A1 = new THREE.Vector3(-0.2, 1.4, 50);
        function render(t) {
          st.T = Math.max(st.T, 0.17);   // frame 0 = miniatura: sem dip de entrada
          // rosto: espanto crescendo; em "vê dois sóis" (1,65 s) a boca abre
          p.emocao(t < 1.6 ? "medo" : t < 3.4 ? "panico" : "medo", [lerp(0.05, -0.12, range(t, 0.4, 1.4)), 0.35]);
          p.cab.rotation.set(-0.12 - 0.05 * ease.inOutSine(range(t, 1.4, 2.2)), lerp(0.1, -0.06, ease.inOutSine(range(t, 0, 2))), 0.03);
          Q.SA.set(1, t); Q.SV.set(1, t * 1.3);
          const pul = 1 + 0.06 * Math.sin(t * 2.1);
          Q.SV.halo.scale.setScalar(9 * pul);
          // câmera: rosto de frente (dentro do quarto) -> gira por trás do ombro -> empurra para a janela
          const o = ease.inOutCubic(range(t, 1.85, 3.15));
          const a = lerp(lerp(-0.18, 0.12, ease.inOutSine(range(t, 0, 1.85))), Math.PI - 0.1, o);
          const r = lerp(1.55, 1.15, o) - 0.75 * Math.sin(Math.PI * o) - 0.35 * ease.inOutSine(range(t, 3.15, 5.84));
          olho.set(Math.sin(a) * r, lerp(1.6, 1.82, o), Math.cos(a) * r);
          cam.position.copy(olho);
          alvo.lerpVectors(A0, A1, ease.inCubic(o));
          cam.lookAt(alvo);
          st.U.foco.value = lerp(r, 48, ease.inOutCubic(range(t, 2.4, 3.3)));
          st.U.faixa.value = lerp(0.7, 30, range(t, 2.4, 3.3));
          st.draw();
          const c = st.ctx;
          DS.etq(c, "AMARELO", Q.SA.group.position, cam, range(t, 3.06, 3.36), { cor: "#ffd27a", dy: 150 });
          DS.etq(c, "VERMELHO · MENOR", Q.SV.group.position, cam, range(t, 4.65, 4.95), { cor: DS.LARANJA, dy: 150 });
        }
