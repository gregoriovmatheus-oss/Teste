/*META {"imports": ["lowpoly", "cinema", "vulcoes"], "rotulos": [{"de": 3.9, "ate": 6.48, "texto": "<span class=\"k\">O SOL</span><br>segura a <span class=\"y\">nossa vida</span>"}], "D0": 6.48, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, V = VULCOES, pose = LP.pose;
        await V.prepara();
        const st = LP.palco(canvas, { fov: 30, foco: 1.6, faixa: 0.45, desfoque: 22, fundo: 0x1a120c, bloom: 1.1 });
        const { S, cam } = st; cam.near = 0.1; cam.updateProjectionMatrix();
        LP.luz(st, "por-do-sol"); st.U.nevoa.value = 0.0; S.background = new THREE.Color(0x1a120c); st.exposicao = 1.12;
        const Q = V.quarto(S, LP, { manha: true });
        const p = LP.pessoa({ seed: 12, roupa: "pijama", jaqueta: 0x46587a, pele: 0xb98060, cabelo: 0x24160c, iris: 0x4a3020 });
        S.add(p.root);
        // o sol de volta: luz dourada entrando pela mesma janela
        st.fria.color.set(0xffd49a); st.fria.position.set(1.2, 3.2, 9); st.fria.intensity = 3.6;
        Object.assign(st.fria.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 20 }); st.fria.shadow.camera.updateProjectionMatrix();
        st.quente.color.set(0xffc890); st.quente.intensity = 0.6; st.quente.position.set(-2, 1.6, 2);
        st.rim.color.set(0xffd8a8); st.rim.intensity = 1.4; st.rim.position.set(-1.5, 1.8, -3); st.rim2.intensity = 0.4; st.hemi.intensity = 0.35;
        const SOLW = new THREE.Vector3(); Q.sol.getWorldPosition(SOLW);
        const v3 = new THREE.Vector3(), rosto = new THREE.Vector3();
        const MA = new THREE.Vector3(-0.36, 0.52, 0.1), MB = new THREE.Vector3(0.18, 0.66, 0.45), polo = new THREE.Vector3(-0.4, 0, -0.3);
        const voltaAbas = V.guardaAbas(p);
        function render(t) {
          p.reset(); voltaAbas();
          pose(p, "sentado", 1);
          p.pernas.forEach((l) => { l.q.rotation.x = -1.5; l.j.rotation.x = 0.06; });
          p.coluna.rotation.x = 0.06 - 0.04 * range(t, 0, 3);
          p.root.updateMatrixWorld(true);
          LP.alcancar(p, 1, MA, 1, { polo });
          LP.alcancar(p, 0, MB, 1 - 0.0 * t);
          LP.olharPara(p, SOLW, 0.55);
          // mesmo enquadramento da abertura: agora alívio, quase choro de alegria
          const k = ease.inOutSine(range(t, 0.4, 2.6));
          p.emocaoMix("surpresa", "alegre", k, [0.06, 0.12]);
          if (t > 2.6) p.emocaoMix("alegre", { br: -0.2, by: 0.34, bo: [1.15, 1.0], ab: 0.45, ol: [0.06, 0.12], so: 0.85 }, range(t, 2.6, 3.6), [0.06, 0.12]);
          LP.vida(p, t, { seed: 12, balanco: 0.5, olhos: false });
          // câmera: o close do começo → órbita por trás do ombro até o sol na janela (espelho da f01)
          p.cab.getWorldPosition(rosto);
          const o = ease.inOutCubic(range(t, 2.9, 4.1)), push = range(t, 0, 2.9), push2 = ease.inOutSine(range(t, 4.1, 6.48));
          const ang = lerp(0.18, Math.PI - 0.42, o), r = lerp(1.95 - 0.2 * push, 0.78, o) + 0.25 * Math.sin(Math.PI * o);
          cam.position.set(rosto.x + Math.sin(ang) * r, rosto.y + lerp(0.02, 0.2, o), rosto.z + Math.cos(ang) * r);
          v3.copy(rosto); v3.y -= 0.22 * (1 - o);
          v3.lerp(Q.janela, o); v3.y += 0.95 * o;
          cam.position.lerp(Q.janela, 0.12 * push2);
          cam.lookAt(v3);
          LP.camMao(cam, t, { intens: 0.6, seed: 3 });
          st.U.foco.value = lerp(cam.position.distanceTo(rosto), 45, ease.inOutCubic(range(t, 3.4, 4.0)));
          st.U.faixa.value = lerp(0.45, 30, range(t, 3.4, 4.0));
          st.sol(SOLW, 0.6 + 0.8 * o);
          st.draw();
        }
