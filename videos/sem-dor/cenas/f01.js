/*META {"imports": ["lowpoly", "dor"], "rotulos": [{"de": 0.0, "ate": 2.0, "top": 700, "texto": "<span class=\"k\">UM EXPERIMENTO MENTAL</span><br>E se você nunca mais sentisse <span class=\"y\">dor</span>?"}], "D0": 6.0} */
        const LP = LOWPOLY;
        const st = LP.palco(canvas, { foco: 1.6, faixa: 0.5, desfoque: 26 });
        const { S, cam } = st;
        S.background = new THREE.Color(0x1a1612);
        st.hemi.intensity = 0.9; st.quente.intensity = 2.6;
        const p = LP.pessoa({ seed: 4 }); S.add(p.root);
        const KZ = DOR.cozinhaR11(S, LP);
        KZ.cebola.position.set(0.27, 1.04, 0.47); KZ.cebola.rotation.y = -0.3;
        const esq = p.bracos[0];
        // corte no dedo da mão esquerda: risco escuro + gota discreta (sem sangue explícito)
        esq.cot.add(KZ.risco); KZ.risco.position.set(-0.025, -0.405, 0.022);
        esq.cot.add(KZ.gota); KZ.gota.position.set(-0.025, -0.41, 0.026);
        LP.bokeh(S, { n: 30, seed: 5, y: [1.2, 3], z: [-6, -2], cores: [0xffc070, 0xffe0b0, 0x7fb6ff] });
        const alvo = new THREE.Vector3(), mp = new THREE.Vector3();
        const ROSTO = [0.02, 1.64, 0.06];
        function render(t) {
          // picando ~2,2 vezes/s; a picada do corte cai em 2,1 s ("não sente nada")
          const ch = Math.pow(0.5 + 0.5 * Math.sin((t - 2.1) * Math.PI * 2 * 2.2 + Math.PI / 2), 2);
          DOR.poseCozinha(p, ch, KZ.faca, { inclina: 0.3 });
          p.emocao("calmo", [0.05, -0.45]);
          KZ.risco.scale.set(range(t, 2.1, 2.2) || 1e-4, 1, 1);
          const g = ease.outCubic(range(t, 2.3, 4.4));
          KZ.gota.scale.setScalar(g ? 0.5 + g : 1e-4); KZ.gota.position.y = -0.41 - g * 0.014;
          esq.cot.updateMatrixWorld(true); KZ.risco.getWorldPosition(mp);
          // câmera: rosto calmo (miniatura) → grua até as mãos no corte → sobe de volta ao rosto, ainda calmo
          const a = ease.inOutCubic(range(t, 1.55, 2.1)), b = ease.inOutSine(range(t, 3.9, 5.2));
          const c0 = [0.32, 1.66, 1.62], l0 = [0.04, 1.4, 0.06];
          const c1 = [mp.x - 0.02, mp.y + 0.3, mp.z + 0.46], l1 = [mp.x + 0.01, mp.y - 0.07, mp.z - 0.02];
          const c2 = [-0.34, 1.6, 1.4], l2 = [0.02, 1.36, 0.2];
          const P = [0, 1, 2].map((i) => lerp(lerp(c0[i], c1[i], a), c2[i], b)), L = [0, 1, 2].map((i) => lerp(lerp(l0[i], l1[i], a), l2[i], b));
          const dr = t * 0.025;
          cam.position.set(P[0] - dr, P[1] + dr * 0.3, P[2] - dr); cam.lookAt(L[0], L[1], L[2]);
          // foco: no rosto nas pontas, na mão no meio
          const dRosto = cam.position.distanceTo(alvo.set(...ROSTO)), dMao = cam.position.distanceTo(mp);
          st.U.foco.value = lerp(dRosto, dMao, a * (1 - b)); st.U.faixa.value = lerp(0.45, 0.18, a * (1 - b));
          st.T = Math.max(st.T, 0.18);   // miniatura: sem o dip de entrada no quadro 0
          st.draw();
          LP.etiqueta(st.ctx, "DOR: 0", mp, cam, range(t, 2.4, 2.65) * (1 - range(t, 3.85, 4.0)), { cor: "#ff8a4c", y0: 720, y1: 900, tam: 34 });
        }
