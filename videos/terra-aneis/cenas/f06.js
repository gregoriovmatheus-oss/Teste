/*META {"imports": ["lowpoly", "cinema", "aneis"], "rotulos": [], "D0": 4.53, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, AN = ANEIS;
        await AN.prepara();
        const st = LP.palco(canvas, { fov: 58, foco: 60, faixa: 60, desfoque: 8, fundo: 0x2a2440, bloom: 1.4, raios: 0.9, flare: 0.8 });
        const { S, cam } = st;
        LP.luz(st, "por-do-sol"); st.U.nevoa.value = 0.022; st.U.corNevoa.value.set(0.62, 0.42, 0.42); st.exposicao = 1.0;
        CI.ceu(S, { topo: 0x14204a, horizonte: 0xf08a4c, estrelas: 120, seed: 13 });
        // nascer do Sol no Brasil (23° S): Sol a leste (az 94°); o pé do anel nasce do horizonte a lés-nordeste (az 56–79°) e sobe em arco
        const C = AN.ceuAnel(S, { lat: -23, br: 2.6, op: 0.55, amb: 0.02, cor: 0xffd6ae, sombraA: 0.3 });
        AN.chao(S, LP, { cor: 0x3a3a28, morro: 0x2a2630, seed: 12, tufos: 700, raioTufo: 7, morros: 10 });
        const SOLP = new THREE.Vector3(), SOLD = new THREE.Vector3();
        const disco = AN.brilho(0xfff2d0, 9, "suave", 1), halo = AN.brilho(0xff9a50, 110, "suave", 0.55), halo2 = AN.brilho(0xffc890, 34, "raios", 0.6);
        S.add(disco, halo, halo2);
        const p = LP.pessoa({ seed: 7, feminina: true, pele: 0xc08a6a, cabelo: 0x24160e, jaqueta: 0x2f4f6f, camisa: 0xe8dcc8, iris: 0x5a3a20 });
        S.add(p.root); p.root.rotation.y = 1.66;
        st.fria.color.set(0xffa866); st.quente.color.set(0xffc090); st.quente.intensity = 0.5; st.rim.color.set(0x7088ff); st.rim.intensity = 1.4; st.rim.position.copy(AN.dir(290, 30)).multiplyScalar(6);
        st.rim2.intensity = 0.3; st.hemi.color.setHex(0x8a90c0); st.hemi.groundColor.setHex(0x3a2418); st.hemi.intensity = 0.35;
        const PO = LP.poeira(S, { n: 90, centro: [1.2, 1.4, 0.2], raio: [2.5, 1.0, 2.5], cor: 0xffc890, seed: 6, tam: 0.004 });
        const aves = [0, 1, 2].map((i) => { const b = CI.passaro({ seed: 31 + i, cor: 0x1a1418, corB: 0x2a2028 }); b.root.scale.setScalar(2.2); S.add(b.root); return b; });
        const cab = new THREE.Vector3(), olho = new THREE.Vector3(), pa = new THREE.Vector3(), pb = new THREE.Vector3(), la = new THREE.Vector3(), lb = new THREE.Vector3(), alvo = new THREE.Vector3();
        AN.semNaN(S);
        function render(t) {
          // o Sol sobe; com ele o pé do anel acende como uma ponte saindo do horizonte
          const el = lerp(-1.6, 3.4, ease.inOutSine(range(t, 0, 4.53)));
          C.dirSol(94, el, SOLD); C.u.uL.value.copy(SOLD);
          SOLP.copy(SOLD).multiplyScalar(150); disco.position.copy(SOLP); halo.position.copy(SOLP); halo2.position.copy(SOLP);
          const sobe = range(el, -1.2, 1.2);
          disco.material.opacity = 0.35 + 0.65 * sobe; halo2.material.opacity = 0.6 * sobe; halo.material.opacity = 0.35 + 0.35 * sobe;
          C.u.uBr.value = lerp(1.4, 2.6, range(t, 0.8, 2.6));
          st.fria.position.copy(SOLD).multiplyScalar(8); st.fria.position.y = Math.max(0.4, st.fria.position.y); st.fria.intensity = lerp(1.2, 3.6, sobe);
          st.exposicao = lerp(0.9, 1.08, range(t, 0, 3));
          aves.forEach((b, i) => { const d = b.voar(t + i * 0.37, { vel: 0.8, planar: 0.4 }); b.root.position.copy(AN.dir(70 + i * 5 - d * 0.9, 6 + i * 1.5)).multiplyScalar(38 + i * 6); b.root.rotation.y = Math.PI * 0.5; });
          PO.update(t);
          olho.copy(AN.dir(lerp(82, 70, range(t, 1.2, 3.0)), lerp(4, 22, range(t, 1.3, 3.6)))).multiplyScalar(40);
          LP.ator(p, t, { seed: 7, olharPara: olho, emocao: ["calmo", "alegre", ease.inOutSine(range(t, 1.6, 3.4))] });
          p.cab.getWorldPosition(cab);
          // A: por cima do ombro, olhando o horizonte leste → B: gira para a frente dela (rosto dourado) e sobe para o arco
          const o = ease.inOutCubic(range(t, 1.9, 4.4)), push = ease.inOutSine(range(t, 0, 2.2));
          pa.copy(cab).addScaledVector(AN.dir(265, -4), 1.5 - 0.35 * push).addScaledVector(AN.dir(175, 0), 0.55); pa.y = Math.max(pa.y, 0.5);
          pb.copy(cab).addScaledVector(AN.dir(134, -8), 1.75);
          cam.position.lerpVectors(pa, pb, o); cam.position.addScaledVector(AN.dir(200, 0), 0.9 * Math.sin(Math.PI * o));
          la.copy(cab).addScaledVector(AN.dir(80, 3.5 + 2 * push), 60);
          lb.copy(cab).addScaledVector(AN.dir(314, 24), 40);
          alvo.lerpVectors(la, lb, o); cam.lookAt(alvo);
          cam.fov = lerp(58, 70, o); cam.updateProjectionMatrix(); LP.camMao(cam, t, { seed: 8, intens: 0.6 });
          st.U.foco.value = lerp(60, cam.position.distanceTo(cab), range(t, 2.6, 3.8)); st.U.faixa.value = lerp(80, 4, range(t, 2.6, 3.8));
          st.sol(SOLP, lerp(0.5, 1.0, sobe));
          st.draw();
        }
