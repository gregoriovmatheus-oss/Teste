/*META {"imports": ["lowpoly", "cinema", "deserto"], "rotulos": [{"de": 4.2, "ate": 7.4, "top": 600, "texto": "ele também segura<br>o <span class=\"y\">equilíbrio</span> do planeta"}], "D0": 7.4} */
        const LP = LOWPOLY, CI = CINEMA, DS = DESERTO;
        await DS.prepara();
        const st = LP.palco(canvas, { fov: 30, foco: 1.1, faixa: 0.6, desfoque: 12, fundo: 0xe9cfa0, bloom: 0.9, raios: 0.5 });
        const { S, cam } = st; cam.far = 300; cam.updateProjectionMatrix();
        LP.luz(st, "dia"); st.U.nevoa.value = 0.018; st.U.corNevoa.value.set(0.93, 0.8, 0.62); st.exposicao = 1.05; st.U.split.value = 0.45;
        CI.ceu(S, { topo: 0x3a78c4, horizonte: 0xf4d9a8, nuvens: 0 });
        st.fria.color.set(0xfff0d0); st.fria.intensity = 3.6; st.fria.position.set(-2.5, 5, 4);
        st.quente.color.set(0xffc890); st.quente.intensity = 0.9; st.rim.color.set(0xbfd8ff); st.rim.intensity = 2.2; st.rim2.color.set(0xffb070); st.rim2.intensity = 1.2;
        st.hemi.color.setHex(0xcfe0ff); st.hemi.groundColor.setHex(0xc89a5a); st.hemi.intensity = 0.75;
        const SOL = DS.brilho(0xfff0c8, 40, "suave", 0.95); SOL.position.set(-60, 70, 90); S.add(SOL);
        const DU = DS.dunas(S, LP.mat, { tam: 220, seg: 84, amp: 1.3, plano: 3, centro: [0, -60] });
        const y0 = DU.h(0, 0);
        const p = DS.viajante(LP); p.root.position.y = y0; S.add(p.root);
        const voltaAbas = DS.guardaAbas(p);
        const PO = LP.poeira(S, { n: 140, centro: [0, y0 + 0.6, -1], raio: [4, 0.6, 4], cor: 0xffd8a0, seed: 6, tam: 0.01 });
        // o deserto não é vazio: um feneco sobe na duna ao lado e um escorpião passa
        const FN = DS.feneco(LP); FN.root.scale.setScalar(1.6); S.add(FN.root);
        const ES = DS.escorpiao(LP); ES.root.scale.setScalar(2.2); S.add(ES.root);
        const alvo = new THREE.Vector3(), rosto = new THREE.Vector3(), olhoA = new THREE.Vector3(9, y0 + 1.9, 30), fnP = new THREE.Vector3();
        const quente = new THREE.Color(0xffa45a), base = new THREE.Color(0xfff0d0);
        function render(t) {
          p.reset(); voltaAbas();
          p.root.rotation.y = 0.25;
          p.root.updateMatrixWorld(true);
          // olha o horizonte; depois baixa os olhos para o feneco (2,4 s) e volta, em paz
          const ve = range(t, 2.3, 2.8) * (1 - range(t, 3.8, 4.4));
          FN.root.getWorldPosition(fnP);
          LP.olharPara(p, olhoA, 0.8 * (1 - ve)); LP.olharPara(p, fnP, 0.6 * ve);
          p.bracos[1].om.rotation.x = -0.15; p.bracos[0].om.rotation.x = 0.1;
          const paz = { br: -0.04, by: 0.32, bo: [1.05, 0.4], ab: 0.5, ol: [0.2, 0.05], so: 0.45, su: 0.15 };
          p.emocaoMix({ br: 0.24, by: 0.3, bo: [0.85, 0.35], ab: 0.4, ol: [0.2, 0.08], so: -0.12, su: 0.25, pu: 0.7 }, paz, ease.inOutSine(range(t, 0.4, 1.6)));
          LP.vida(p, t, { seed: 21, balanco: 0.6, olhos: false });
          PO.update(t * 2.2);
          const fx = 1.3, fz = lerp(-0.2, 0.9, ease.outCubic(range(t, 1.9, 2.8)));
          FN.root.position.set(fx, DU.h(fx, fz) - 0.02, fz); FN.root.rotation.y = -1.2; FN.set(t, { olhar: [0.3, 0.2] });
          const ex = lerp(-1.6, -0.4, range(t, 2.6, 6.5)); ES.root.position.set(ex, DU.h(ex, 1.1), 1.1); ES.root.rotation.y = 1.5; ES.update(t);
          // luz caminha para o fim de tarde
          const k = range(t, 1, 7.4); st.fria.color.lerpColors(base, quente, k); st.exposicao = 1.05 - 0.08 * k;
          // câmera: mesmo close da abertura → recua e sobe até o plano aberto da duna
          p.cab.getWorldPosition(rosto);
          const o = ease.inOutCubic(range(t, 1.2, 7.4));
          const ang = lerp(0.42, 0.75, o), r = lerp(2.05, 9.5, o);
          cam.position.set(rosto.x + Math.sin(ang) * r, rosto.y + lerp(-0.05, 2.6, o), rosto.z + Math.cos(ang) * r);
          alvo.copy(rosto); alvo.y -= lerp(0.3, 1.6, o);
          cam.lookAt(alvo);
          LP.camMao(cam, t, { intens: 0.8, seed: 2 });
          st.U.foco.value = cam.position.distanceTo(rosto); st.U.faixa.value = lerp(0.6, 4, o);
          st.sol(SOL.position, 0.45);
          st.draw();
          DS.etq(st.ctx, "O DESERTO NÃO É VAZIO", fnP, cam, range(t, 2.4, 2.7) * (1 - range(t, 3.9, 4.1)), { dy: -200, cor: "#ffd27a" });
        }
