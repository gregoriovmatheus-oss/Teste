/*META {"imports": ["lowpoly", "cinema", "vulcoes"], "rotulos": [{"de": 1.6, "ate": 2.75, "texto": "o <span class=\"y\">peso</span> da cinza"}, {"de": 3.4, "ate": 4.95, "texto": "Na rua, só de <span class=\"y\">máscara</span>"}, {"de": 5.2, "ate": 6.01, "texto": "água <span class=\"y\">filtrada</span>"}], "D0": 6.01, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, V = VULCOES;
        await V.prepara();
        const st = LP.palco(canvas, { fov: 36, foco: 2.0, faixa: 0.8, desfoque: 18, bloom: 0.6 });
        const { S, cam } = st; cam.near = 0.1; cam.updateProjectionMatrix();
        LP.luz(st, "frio"); CI.clima(st, "pesadelo");
        S.background = new THREE.Color(0x6a645c); st.U.corNevoa.value.set(0.42, 0.4, 0.37); st.U.nevoa.value = 0.022;
        st.fria.color.set(0xd8c8b0); st.fria.intensity = 1.6; st.fria.position.set(-2, 6, 4); st.hemi.color.set(0xa8a098); st.hemi.intensity = 0.7;
        Object.assign(st.fria.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 30 }); st.fria.shadow.camera.updateProjectionMatrix();
        CI.ceu(S, { topo: 0x4a4440, horizonte: 0x8a8076 });
        const mk = LP.mat;
        const chao = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), mk(0x8a847a, 1)); chao.rotation.x = -Math.PI / 2; S.add(chao);
        // casas com o telhado coberto de cinza; a da frente desaba
        const casa = (x, z, cor, ry = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g);
          const p = new THREE.Mesh(new THREE.BoxGeometry(4, 2.6, 4), mk(cor, 0.9)); p.position.y = 1.3; g.add(p);
          const porta = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.05), mk(0x3a2a20)); porta.position.set(0.8, 0.8, 2.02); g.add(porta);
          const jan = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.05), mk(0x1a1e24, 0.2)); jan.position.set(-0.9, 1.5, 2.02); g.add(jan);
          const L = Math.hypot(2.1, 1.2), metades = [1, -1].map((s) => { const piv = new THREE.Group(); piv.position.set(-s * 2.1, 2.6, 0); g.add(piv);
            const tel = new THREE.Mesh(new THREE.BoxGeometry(L, 0.1, 4.4), mk(0x7a3a2a, 0.8)); tel.position.set(s * L / 2, 0, 0); piv.add(tel);
            const cz = new THREE.Mesh(LP.facetado(1, (v) => { v.y = Math.max(-0.2, v.y) * 0.25; }, 3 + s, 0.3), mk(0xb0aaa0, 1)); cz.scale.set(L * 0.52, 0.5, 2.3); cz.position.set(s * L / 2, 0.08, 0); piv.add(cz);
            piv.rotation.z = s * Math.atan2(1.2, 2.1); return [piv, s]; });
          return { g, metades }; };
        const C1 = casa(-3.4, -7, 0xc8b89a, 0.25), C2 = casa(5, -11, 0xa8b0b8, -0.3), C3 = casa(-9, -16, 0xb89a8a, 0.4);
        const PO = CI.fumaca(S, { pos: [-3.4, 1.6, -7], n: 30, cor: 0xb8b0a4, sobe: 3, largura: 3.5, tam: 1.6, opac: 0.55, seed: 12 });
        const CZ = V.cinza(S, { n: 1600, area: [8, 10], centro: [-1, 0, -5], alt: 8, cor: 0xc8c2b8, tam: 0.04, vel: 0.45, op: 0.8 });
        // ele: máscara e garrafa de água filtrada
        const p = LP.pessoa({ seed: 81, roupa: "casaco", jaqueta: 0x34485a, pele: 0xa87458, cabelo: 0x1e140c, iris: 0x3a2a18, bone: 0x2a2c30 });
        S.add(p.root); p.reset(); p.root.updateMatrixWorld(true);
        const boca = p.cab.worldToLocal(LP.pontoCabeca(p, "boca"));
        const masc = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mk(0xeef0f2, 0.7)); masc.rotation.x = Math.PI / 2; masc.scale.set(0.075, 0.05, 0.06);
        masc.position.copy(boca).add(new THREE.Vector3(0, 0.008, -0.03)); p.cab.add(masc);
        [1, -1].forEach((s) => { const al = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.012, 0.1), mk(0xdfe2e6)); al.position.copy(boca).add(new THREE.Vector3(s * 0.072, 0.02, -0.06)); al.rotation.y = s * 0.5; p.cab.add(al); });
        const garr = new THREE.Group(); const gv = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.24, 12), new THREE.MeshStandardMaterial({ color: 0x9ad0ff, roughness: 0.05, transparent: true, opacity: 0.55 })); garr.add(gv);
        const ag = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.17, 12), new THREE.MeshStandardMaterial({ color: 0x5ab0f0, roughness: 0.1, emissive: 0x1a4a7a, emissiveIntensity: 0.6 })); ag.position.y = -0.03; garr.add(ag);
        const tp = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 8), mk(0x2a6ac0)); tp.position.y = 0.135; garr.add(tp);
        LP.segurar(p, 0, garr, { pos: [0, -0.12, 0.04] });
        const rosto = new THREE.Vector3(), alvo = new THREE.Vector3(), mao = new THREE.Vector3(), gw = new THREE.Vector3(), cA = new THREE.Vector3(), cB = new THREE.Vector3();
        const voltaAbas = V.guardaAbas(p);
        function render(t) {
          // o telhado cede (0,6–1,5 s): cai para dentro com um quique; poeira de cinza
          const k = range(t, 0.6, 1.45), cai = k * k, q = Math.max(0, Math.sin(Math.PI * range(t, 1.45, 1.75))) * 0.06;
          C1.metades.forEach(([piv, s]) => { piv.rotation.z = s * (lerp(0.519, -0.42, cai) + q); piv.position.y = 2.6 - 0.5 * cai; });
          PO.update(t * 0.8 + 0.3);
          PO.g.children.forEach((sp) => (sp.material.opacity *= range(t, 1.2, 1.5) * (1 - range(t, 3.6, 4.4))));
          CZ.update(t);
          // ele anda pela rua de máscara; em "água" ergue a garrafa
          p.reset(); voltaAbas();
          const d = LP.andar(p, t, { vel: 0.6, amp: 0.8 });
          p.root.position.set(0.6, 0, -4.6 + d * 0.5); p.root.rotation.y = -0.15;
          p.root.updateMatrixWorld(true); p.cab.getWorldPosition(rosto);
          const sobe = ease.inOutCubic(range(t, 4.1, 4.7));
          mao.copy(rosto).add(cA.set(0.12, -0.38, 0.32)); LP.alcancar(p, 0, mao, sobe * 0.95);
          LP.olharPara(p, garr.getWorldPosition(gw), 0.5 * sobe);
          p.emocao("nervoso", [0.15 * (1 - sobe), -0.25 * sobe]);
          LP.vida(p, t, { seed: 81, balanco: 0.2, olhos: false });
          // câmera: casa desabando (plano aberto) → panorâmica até ele (rosto no terço de cima) → garrafa
          const pan = ease.inOutCubic(range(t, 2.5, 3.5)), e = ease.inOutSine(range(t, 0, 6.01));
          p.cab.getWorldPosition(rosto); garr.getWorldPosition(gw);
          cA.set(lerp(3.2, 2.2, e), lerp(2.0, 2.4, e), lerp(3.4, 2.6, e));
          cB.set(rosto.x + 0.6, rosto.y - 0.1, rosto.z + 2.2 - 0.4 * range(t, 3.5, 6.01));
          cam.position.lerpVectors(cA, cB, pan);
          alvo.set(-3.4, 2.4, -7).lerp(rosto.clone().add(new THREE.Vector3(0, -0.42, 0)), pan);
          alvo.lerp(gw.clone().add(new THREE.Vector3(0, 0.25, 0)), 0.35 * sobe);
          cam.lookAt(alvo); LP.camMao(cam, t, { intens: 1 + 2 * Math.sin(Math.PI * range(t, 1.3, 2.0)), seed: 11 });
          st.U.foco.value = lerp(cam.position.distanceTo(new THREE.Vector3(-3.4, 2.4, -7)), cam.position.distanceTo(rosto), pan); st.U.faixa.value = lerp(4, 0.9, pan);
          st.draw();
          V.etq(st.ctx, "FILTRADA", gw, cam, V.vis(st) * range(t, 5.25, 5.5), { cor: V.AZUL, dy: 260, dx: 160 });
        }
