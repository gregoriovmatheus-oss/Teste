/*META {"imports": ["lowpoly", "cinema", "aneis"], "rotulos": [{"de": 1.9, "ate": 2.8, "top": 520, "texto": "refletindo a<br><span class=\"y\">luz do Sol</span>"}, {"de": 2.85, "ate": 5.44, "top": 520, "texto": "nenhuma noite<br><span class=\"y\">totalmente escura</span>"}], "D0": 5.44, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, AN = ANEIS;
        await AN.prepara();
        const st = LP.palco(canvas, { fov: 34, foco: 1.6, faixa: 0.6, desfoque: 8, fundo: 0x070c1a, bloom: 1.2 });
        const { S, cam } = st;
        LP.luz(st, "noite"); st.U.nevoa.value = 0.01; st.exposicao = 1.1;
        CI.ceu(S, { topo: 0x03060f, horizonte: 0x101c34, estrelas: 700, seed: 11 });
        const C = AN.ceuAnel(S, { lat: -23, br: 1.9, op: 0.5, amb: 0.01, sombraA: 0.55 });
        AN.chao(S, LP, { cor: 0x2a3424, morro: 0x161c18, seed: 7, tufos: 600, raioTufo: 6 });
        const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 2.2, 8), LP.mat(0x4a3424, 0.95)); tronco.rotation.z = Math.PI / 2; tronco.position.set(0, 0.22, 0.4); S.add(tronco);
        // luar do anel: luz fria vinda do norte alto
        st.fria.position.copy(AN.dir(10, 45)).multiplyScalar(6); st.fria.color.set(0xb8ccff); st.fria.intensity = 2.0;
        st.quente.intensity = 0.0; st.rim.position.copy(AN.dir(200, 20)).multiplyScalar(6); st.rim.intensity = 1.6; st.hemi.intensity = 0.25;
        const ela = LP.pessoa({ seed: 7, feminina: true, pele: 0xc08a6a, cabelo: 0x24160e, jaqueta: 0x2f4f6f, camisa: 0xe8dcc8, iris: 0x5a3a20 });
        const ele = LP.pessoa({ seed: 41, pele: 0x9a6a4a, cabelo: 0x1c120a, jaqueta: 0x4a4a52, camisa: 0xc8b89a });
        S.add(ela.root, ele.root); ela.root.position.set(-0.36, 0, 0.32); ele.root.position.set(0.38, 0, 0.32); ela.root.rotation.y = ele.root.rotation.y = Math.PI;
        const olho = new THREE.Vector3(), alvo = new THREE.Vector3(), r1 = new THREE.Vector3(), r2 = new THREE.Vector3(), mid = new THREE.Vector3(), pa = new THREE.Vector3(), pb = new THREE.Vector3(), v = new THREE.Vector3(), sol = new THREE.Vector3();
        AN.semNaN(S);
        function render(t) {
          C.u.uL.value.copy(C.dirSol(255, lerp(-22, -30, t / 5.44), sol));   // a sombra da Terra avança devagar pelo anel
          olho.copy(AN.dir(-4, 38)).multiplyScalar(40);
          LP.ator(ela, t, { seed: 7, pose: "sentado", olharPara: olho, emocao: ["calmo", "alegre", range(t, 0.8, 2.0)] });
          LP.ator(ele, t, { seed: 41, pose: [["sentado", 1], ["apontar", range(t, 0.7, 1.2) * (1 - range(t, 3.4, 3.9))]], olharPara: olho, emocao: "surpresa" });
          ela.cab.getWorldPosition(r1); ele.cab.getWorldPosition(r2); mid.addVectors(r1, r2).multiplyScalar(0.5);
          // rostos iluminados pelo anel → a câmera sobe por cima das cabeças e mostra o arco aceso
          const o = ease.inOutCubic(range(t, 2.2, 4.4));
          pa.copy(mid).add(v.set(0.3, -0.3, -3.1));
          pb.copy(mid).add(v.set(0.2, 0.5, 1.5));
          cam.position.lerpVectors(pa, pb, o); cam.position.y += 0.6 * Math.sin(Math.PI * o);
          alvo.copy(mid); alvo.y -= 0.5; v.copy(AN.dir(0, 30)).multiplyScalar(40); alvo.lerp(v, ease.inOutCubic(range(t, 2.2, 3.3)));
          const k2 = ease.inOutCubic(range(t, 2.2, 3.3)); cam.fov = lerp(34, 80, k2); cam.updateProjectionMatrix(); cam.lookAt(alvo); LP.camMao(cam, t, { seed: 5, intens: 0.6 });
          st.U.foco.value = lerp(cam.position.distanceTo(mid), 380, k2); st.U.faixa.value = lerp(0.8, 300, k2);
          st.draw();
        }
