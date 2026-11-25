/*META {"imports": ["lowpoly", "cinema", "deserto"], "rotulos": [{"de": 3.45, "ate": 5.26, "top": 600, "texto": "perderiam <span class=\"y\">a casa</span>"}], "D0": 5.26, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, DS = DESERTO;
        await DS.prepara();
        const st = LP.palco(canvas, { fov: 34, foco: 1.0, faixa: 0.4, desfoque: 16, fundo: 0x3a2236, bloom: 1.0 });
        const { S, cam } = st; cam.near = 0.02; cam.far = 260; cam.updateProjectionMatrix();
        LP.luz(st, "por-do-sol"); st.U.nevoa.value = 0.02;
        CI.ceu(S, { topo: 0x2a3a78, horizonte: 0xffa060, nuvens: 4, corNuvem: 0xffb890 });
        st.fria.position.set(-6, 3, -14); st.fria.intensity = 3.8;
        Object.assign(st.fria.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, far: 40 }); st.fria.shadow.camera.updateProjectionMatrix();
        const SOL = DS.brilho(0xffc070, 36, "suave", 1); SOL.position.set(-60, 14, -120); S.add(SOL);
        const DU = DS.dunas(S, LP.mat, { tam: 160, seg: 72, amp: 1.0, plano: 2.5, areia: 0xd89a58, verde: 0x3a6a2a, centro: [0, -50] });
        // árvores que vão invadindo a duna
        const FL = DS.floresta(S, LP.mat, { n: 160, area: [[-30, 30], [-60, 2]], seed: 12, h: DU.h, alt: [2.0, 3.8], cor: 0x2f6428 });
        const MU = DS.floresta(S, LP.mat, { n: 50, area: [[-2.5, 2.5], [-2.5, 2.2]], seed: 13, h: DU.h, alt: [0.25, 0.45], cor: 0x4a8a34, tipo: "muda", detalhe: 1 });
        const h0 = DU.h(0, 0);
        // toca do feneco, feneco, escorpião, camelos na crista
        const toca = new THREE.Mesh(new THREE.CircleGeometry(0.16, 12), new THREE.MeshBasicMaterial({ color: 0x1a0e08 })); toca.rotation.x = -Math.PI / 2 + 0.5; toca.position.set(-0.05, DU.h(-0.05, -0.2) + 0.06, -0.2); S.add(toca);
        const FN = DS.feneco(LP); FN.root.position.set(0.15, DU.h(0.15, 0.05), 0.05); FN.root.rotation.y = 0.5; FN.root.scale.setScalar(1.4); S.add(FN.root);
        const ES = DS.escorpiao(LP); ES.root.scale.setScalar(1.8); S.add(ES.root);
        const CM = [DS.camelo(LP), DS.camelo(LP, { seed: 52, cor: 0xb88850 })]; CM.forEach((c, i) => { c.root.scale.setScalar(i ? 0.85 : 1); S.add(c.root); });
        const alvo = new THREE.Vector3(), esP = new THREE.Vector3(), fnP = new THREE.Vector3(), cmP = new THREE.Vector3();
        let ultK = -1;
        function render(t) {
          // camelos andando na crista ao fundo
          const para = range(t, 3.2, 4.2);
          CM.forEach((c, i) => { const x = lerp(-7 - i * 2.6, -2.2 - i * 2.6, range(t, 0, 3.6)) , z = -9 - i * 0.8; c.root.position.set(x, DU.h(x, z), z); c.root.rotation.y = Math.PI / 2; c.andar(t + i * 0.4, 1 - para); });
          const ex = lerp(0.75, 0.45, range(t, 0, 5)); ES.root.position.set(ex, DU.h(ex, 0.9), 0.9); ES.root.rotation.y = -2.2; ES.update(t, range(t, 2.3, 2.6));
          // verde invade a partir de "perderiam" (2,8 s): mudas brotam em volta da toca, mata cresce atrás
          const K = ease.inOutSine(range(t, 2.75, 4.9));
          if (Math.abs(K - ultK) > 0.004 || ultK < 0) { DU.pintar((x, z) => (K * 70 - Math.hypot(x + 10, z + 55) + 4 * Math.sin(x + z)) / 8); ultK = K; }
          FL.crescer((x, z, i, q) => LP.passa(clamp((K * 70 - Math.hypot(x + 10, z + 55) - 5 * q.v) / 6)));
          MU.crescer((x, z, i, q) => LP.passa(range(K, 0.35 + q.v * 0.4, 0.55 + q.v * 0.4)));
          FN.set(t, { triste: ease.inOutSine(range(t, 3.2, 4.0)), olhar: [lerp(0.2, -0.3, range(t, 3, 3.5)), 0.1] });
          FN.root.rotation.y = lerp(0.5, -0.3, ease.inOutSine(range(t, 3.0, 3.8)));
          // câmera: camelos (1,5 s) → feneco (1,85) → escorpião (2,3) → sobe e recua com a duna virando mata
          ES.root.getWorldPosition(esP); FN.cab.getWorldPosition(fnP); CM[0].root.getWorldPosition(cmP); cmP.y += 1.6;
          const k1 = ease.inOutCubic(range(t, 1.45, 1.95)), k2 = ease.inOutCubic(range(t, 2.05, 2.5)), k3 = ease.inOutCubic(range(t, 2.75, 5.26));
          cam.position.set(lerp(lerp(0.9, 0.75, k1), 1.4, k2) + 1.6 * k3, h0 + lerp(lerp(0.35, 0.3, k1), 0.28, k2) + 2.2 * k3, lerp(lerp(1.6, 1.25, k1), 1.65, k2) + 3.6 * k3);
          alvo.copy(cmP).lerp(fnP, k1).lerp(esP, k2).lerp(new THREE.Vector3(-1.5, h0 + 0.6, -4), k3);
          cam.lookAt(alvo);
          LP.camMao(cam, t, { intens: 0.8, seed: 11 });
          st.U.foco.value = cam.position.distanceTo(k3 > 0.5 ? fnP : alvo); st.U.faixa.value = lerp(0.45, 5, k3);
          st.sol(SOL.position, 0.6);
          st.draw();
          const c = st.ctx;
          DS.etq(c, "CAMELO", cmP, cam, range(t, 1.5, 1.75) * (1 - range(t, 2.65, 2.8)), { dy: -40 });
          DS.etq(c, "RAPOSA-DO-DESERTO", fnP, cam, range(t, 1.85, 2.1) * (1 - range(t, 2.65, 2.8)), { dy: -220, dx: -40 });
          DS.etq(c, "ESCORPIÃO", esP, cam, range(t, 2.3, 2.55) * (1 - range(t, 2.65, 2.8)), { dy: -260, dx: 80, cor: DS.LARANJA });
        }
