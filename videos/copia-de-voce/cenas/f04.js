/*META {"imports": ["copia"], "rotulos": [{"de": 0.95, "ate": 4.2, "texto": "Quem é o <span class=\"y\">original?</span>"}], "D0": 4.2} */
        // Palco escuro: as duas pessoas de pé, frente a frente, iguais. "ORIGINAL?" pisca sobre uma e outra.
        const st = T.createToyStage(canvas, { ceu: "#05070d", nevoa: [8, 26], fov: 50, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        COPIA.estudio(st);
        await COPIA.fontes();
        const EU = COPIA.pessoa({ fase: 0.1 }), CO = COPIA.pessoa({ fase: 0.1 });
        EU.emPe(-0.85, 0, 0); CO.emPe(0.85, 0, Math.PI); S.add(EU.p, CO.p);
        EU.olhos(1); CO.olhos(1);
        // poças de luz sob cada um
        const poca = (x) => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.9, 40), new THREE.MeshBasicMaterial({ map: COPIA.glowTex(), color: 0x7cc8ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
          m.rotation.x = -Math.PI / 2; m.position.set(x, 0.01, 0); S.add(m); return m; };
        const pA = poca(-0.85), pB = poca(0.85);
        const linha = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 3.2), new THREE.MeshBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0.5, toneMapped: false }));
        linha.position.set(0, 1.0, 0); S.add(linha);
        const v = new THREE.Vector3();
        function render(t) {
          EU.update(t, {}); CO.update(t, {});
          EU.olha(0, Math.sin(t * 0.9) * 0.03); CO.olha(0, Math.sin(t * 0.9) * 0.03);
          // órbita lenta e baixa, de trás de uma até o perfil das duas
          const e = ease.inOutSine(range(t, 0, 4.2)), ang = lerp(-0.95, 0.55, e), R = lerp(5.6, 4.4, e);
          cam.position.set(Math.sin(ang) * R, lerp(0.9, 1.35, e), Math.cos(ang) * R);
          cam.lookAt(0, lerp(1.25, 1.05, e), 0);
          // o rótulo pula de um para o outro: a luz acompanha
          const pis = t < 0.99 ? -1 : Math.floor((t - 0.99) / 0.32) % 2;
          pA.material.opacity = pis === 0 ? 0.42 : 0.16; pB.material.opacity = pis === 1 ? 0.42 : 0.16;
          linha.material.opacity = 0.25 + 0.25 * Math.sin(t * 6);
          st.sol(0, 0, 4);
          st.draw();
          const c = st.ctx, a = COPIA.vis(st);
          if (t > 0.99) {
            const fl = (k) => (pis === k ? 1 : 0.28);
            COPIA.tag(c, cam, EU.cabeca(0.3), "ORIGINAL?", { cor: COPIA.LARANJA, a: a * fl(0), dx: 0, dy: -150, tam: 30 });
            COPIA.tag(c, cam, CO.cabeca(0.3), "ORIGINAL?", { cor: COPIA.LARANJA, a: a * fl(1), dx: 0, dy: -150, tam: 30 });
          }
          COPIA.txt(c, "UM DEBATE DE SÉCULOS", 540, 1010 - 400, { tam: 24, cor: COPIA.AZUL, a: a * range(t, 1.85, 2.2) });
        }
