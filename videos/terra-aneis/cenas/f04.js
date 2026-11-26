/*META {"imports": ["lowpoly", "cinema", "aneis"], "rotulos": [{"de": 1.5, "ate": 2.95, "top": 520, "texto": "um <span class=\"y\">arco enorme</span><br>ao norte"}, {"de": 3.95, "ate": 5.52, "top": 520, "texto": "<span class=\"k\">NO EQUADOR</span><br>só uma <span class=\"y\">linha fina</span>"}], "D0": 5.52, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, AN = ANEIS;
        await AN.prepara();
        const st = LP.palco(canvas, { fov: 60, foco: 3, faixa: 3, desfoque: 6, fundo: 0x9fc4e8, bloom: 0.8 });
        const { S, cam } = st;
        LP.luz(st, "dia"); st.U.nevoa.value = 0.002; st.exposicao = 1.05;
        CI.ceu(S, { topo: 0x0e2a62, horizonte: 0x9ab8d8, nuvens: 6, corNuvem: 0xf4f0ea, seed: 9 });
        const C = AN.ceuAnel(S, { lat: -23, br: 3.2, op: 0.85, amb: 0.35, sombraA: 0.4 });
        C.u.uL.value.copy(C.dirSol(300, 38));
        AN.chao(S, LP, { cor: 0x6a7a3a, morro: 0x4a5a3a, seed: 6, tufos: 700, raioTufo: 7 });
        st.fria.position.copy(AN.dir(300, 38)).multiplyScalar(8); st.fria.intensity = 3.0;
        const pai = LP.pessoa({ seed: 31, pele: 0x8a5a40, cabelo: 0x1a120c, jaqueta: 0x8a3a2a, camisa: 0xe8e0d0 });
        const fil = LP.pessoa({ seed: 33, idade: "crianca", pele: 0x8a5a40, cabelo: 0x1a120c, jaqueta: 0xf0b030, camisa: 0x2c4a6a });
        S.add(pai.root, fil.root); pai.root.rotation.y = Math.PI - 0.1; fil.root.position.set(0.62, 0, 0.12); fil.root.rotation.y = Math.PI + 0.15;
        const olho = new THREE.Vector3(), alvo = new THREE.Vector3(), cab = new THREE.Vector3(), mao = new THREE.Vector3();
        function render(t) {
          // a latitude "viaja" do Brasil (23° S) ao equador: o arco sobe e afina até virar uma linha no alto
          const kl = ease.inOutCubic(range(t, 2.9, 4.6));
          C.setLat(lerp(-23, -0.35, kl));
          olho.copy(AN.dir(lerp(-5, 0, kl), lerp(32, 80, kl))).multiplyScalar(40);
          LP.ator(pai, t, { seed: 31, olharPara: olho, emocao: "surpresa" });
          LP.ator(fil, t, { seed: 33, olharPara: olho, emocao: "alegre", pose: [["apontar", range(t, 1.4, 1.9) * (1 - range(t, 2.9, 3.3))]] });
          if (t > 1.4 && t < 3.3) { fil.root.updateMatrixWorld(true); mao.copy(AN.dir(-8, 30)).multiplyScalar(20); LP.alcancar(fil, 0, fil.cab.getWorldPosition(cab).add(mao.normalize().multiplyScalar(0.55)), range(t, 1.4, 1.9) * (1 - range(t, 2.9, 3.3))); }
          // câmera atrás deles, grua subindo → no equador, olha para o zênite
          const e = ease.inOutSine(range(t, 0, 2.9));
          cam.position.set(lerp(0.9, 0.5, e), lerp(0.7, 1.2, e), lerp(3.6, 3.0, e));
          cam.position.lerp(new THREE.Vector3(0.45, 0.55, 1.1), kl);
          alvo.set(0.2, 1.0, 0).add(AN.dir(0, lerp(lerp(14, 22, e), 84, kl)).multiplyScalar(30));
          cam.lookAt(alvo); cam.fov = lerp(60, 74, kl); cam.updateProjectionMatrix(); LP.camMao(cam, t, { seed: 4 });
          st.U.foco.value = lerp(3.2, 300, range(t, 0.6, 1.6)); st.U.faixa.value = 200;
          st.draw();
          const c = st.ctx;
          AN.etq(c, "BRASIL · OLHANDO PARA O NORTE", pai.cab.getWorldPosition(cab), cam, range(t, 0.25, 0.6) * (1 - range(t, 1.3, 1.5)), { dy: -260 });
        }
