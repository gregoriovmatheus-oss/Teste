/*META {"imports": ["copia"], "rotulos": [{"de": 1.85, "ate": 3.42, "texto": "<span class=\"k\">UM EXPERIMENTO MENTAL</span><br>E se você acordasse com uma <span class=\"y\">cópia</span>?"}], "D0": 3.42} */
        // Gancho: quarto na luz azul do amanhecer. Você abre os olhos, vira, e ao lado está você mesmo dormindo.
        const st = T.createToyStage(canvas, { ceu: "#081120", nevoa: [6, 22], fov: 50, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        COPIA.amanhecer(st);
        await COPIA.fontes();
        const Q = COPIA.quarto(S);
        const EU = COPIA.pessoa({ fase: 0.1 }), CO = COPIA.pessoa({ fase: 0.6 });
        EU.deitar(-0.47, 0.9); CO.deitar(0.47, 0.9); S.add(EU.p, CO.p);
        const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
        function render(t) {
          // acorda (0,29 s), vira para o lado (0,69 s) e vê a cópia (1,83 s)
          EU.olhos(t > 0.32 ? 1 : 0);
          const vira = ease.inOutCubic(range(t, 0.69, 1.4));
          EU.olha(vira * 1.15, Math.sin(t * 1.3) * 0.02);
          CO.olha(-0.18 + Math.sin(t * 0.9) * 0.02, 0); CO.olhos(0);
          EU.update(t, {}); CO.update(t, {});
          Q.celA.tela(0); Q.celB.tela(0);
          // câmera: de rente ao rosto dele, sobe por cima da cama e revela a cópia; push-in lento até o fim
          const e1 = ease.inOutCubic(range(t, 0.55, 2.1)), e2 = ease.inOutSine(range(t, 1.9, 3.42));
          const p0 = v3(-0.62, 2.05, -0.35), p1 = v3(-0.05, 4.3, 0.75), p2 = v3(0.12, 3.6, 0.55);
          const l0 = v3(-0.47, 0.98, -0.78), l1 = v3(0.0, 0.8, -0.08), l2 = v3(0.12, 0.85, -0.22);
          const P = p0.clone().lerp(p1, e1).lerp(p2, e2), L = l0.clone().lerp(l1, e1).lerp(l2, e2);
          cam.position.copy(P); cam.position.x += Math.sin(t * 0.7) * 0.03; cam.lookAt(L);
          st.sol(0, 0, 4);
          st.draw();
          const c = st.ctx, a = COPIA.vis(st);
          COPIA.tag(c, cam, EU.cabeca(0.04, 0.2), "VOCÊ", { a: a * range(t, 0.35, 0.7) * (1 - range(t, 1.6, 1.9)), dx: -150, dy: -150 });
          COPIA.tag(c, cam, CO.cabeca(0.04, 0.2), "VOCÊ?", { cor: COPIA.LARANJA, a: a * range(t, 1.85, 2.15), dx: 120, dy: -170 });
        }
