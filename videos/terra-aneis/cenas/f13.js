/*META {"imports": ["lowpoly", "cinema", "aneis"], "rotulos": [], "D0": 6.45, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, AN = ANEIS;
        await AN.prepara();
        const st = LP.palco(canvas, { fov: 36, foco: 1.1, faixa: 0.5, desfoque: 5, fundo: 0x18223e, bloom: 1.0, raios: 0.25 });
        const { S, cam } = st;
        LP.luz(st, "por-do-sol"); st.U.nevoa.value = 0.006; st.exposicao = 1.05;
        CI.ceu(S, { topo: 0x060f2c, horizonte: 0x8a4a52, estrelas: 260, seed: 5 });
        const NO = 0;                                   // norte em -z; o arco vai do horizonte leste ao oeste passando alto ao norte
        const C = AN.ceuAnel(S, { lat: -8, norte: NO, br: 1.7, op: 0.5 });
        C.u.uL.value.copy(C.dirSol(262, -5));           // logo depois do pôr do sol: chão na penumbra, anel ainda iluminado
        AN.chao(S, LP, { cor: 0x3a4628, morro: 0x252e22, seed: 4 });
        const p = LP.pessoa({ seed: 7, feminina: true, pele: 0xc08a6a, cabelo: 0x24160e, jaqueta: 0x2f4f6f, camisa: 0xe8dcc8, iris: 0x5a3a20 });
        S.add(p.root); p.root.rotation.y = 1.75;        // de frente para o leste
        st.fria.position.copy(AN.dir(10, 55, NO)).multiplyScalar(6); st.fria.color.set(0xcfe0ff); st.fria.intensity = 2.2;   // luz do anel, de cima
        st.rim.position.copy(AN.dir(262, 8, NO)).multiplyScalar(6); st.rim.color.set(0xff9a5a); st.rim.intensity = 3.4;      // resto do pôr do sol
        st.quente.position.copy(AN.dir(100, 10, NO)).multiplyScalar(6); st.quente.color.set(0x9aa8ff); st.quente.intensity = 0.7;
        st.rim2.intensity = 0.6; st.hemi.intensity = 0.4;
        const rosto = new THREE.Vector3(), olho = new THREE.Vector3(), alvo = new THREE.Vector3(), pa = new THREE.Vector3(), pb = new THREE.Vector3(), v = new THREE.Vector3();
        AN.semNaN(S);
        function render(t) {
          // "hoje o céu é limpo": começa no céu vazio; em "imagine" o arco acende e a câmera desce até o rosto do começo (mesma imagem da f01)
          C.u.uVis.value = ease.inOutSine(range(t, 1.75, 3.7));
          C.u.uBr.value = lerp(1.2, 1.7, range(t, 1.75, 3.7));
          p.cab.getWorldPosition(rosto);
          olho.copy(rosto).addScaledVector(AN.dir(lerp(20, 70, ease.inOutSine(range(t, 1.2, 3.6))), lerp(30, 34, range(t, 1.2, 3.6)), NO), 10);
          LP.ator(p, t, { seed: 7, olharPara: olho, emocao: ["calmo", "alegre", ease.inOutSine(range(t, 2.6, 4.4))] });
          p.cab.getWorldPosition(rosto);
          const o = 1 - ease.inOutCubic(range(t, 0.6, 3.6)), push = 0.25 * (1 - range(t, 3.6, 6.45));
          pa.copy(rosto).addScaledVector(AN.dir(104, -16, NO), 1.75 - 0.25 * push);
          pb.copy(rosto).addScaledVector(AN.dir(185, -36, NO), 1.5);
          cam.position.lerpVectors(pa, pb, o); cam.position.y += 0.25 * Math.sin(Math.PI * o);
          alvo.copy(rosto); alvo.y -= 0.32;
          v.copy(rosto).addScaledVector(AN.dir(5, 50, NO), 30); alvo.lerp(v, o);
          cam.fov = lerp(36, 72, o); cam.updateProjectionMatrix();
          cam.lookAt(alvo); LP.camMao(cam, t, { intens: 0.7, seed: 3 });
          st.U.foco.value = lerp(cam.position.distanceTo(rosto), 380, o); st.U.faixa.value = lerp(1.2, 300, o);
          st.draw();
          AN.titulo(st.ctx, "IMAGINE", ["um arco de luz", "*todos os dias*"], range(t, 4.15, 4.6), { y: 880, tam: 80 });
        }
