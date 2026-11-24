/*META {"imports": ["regen"], "css": "    [data-composition-id=\"f11\"] .rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }\n    [data-composition-id=\"f11\"] .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    [data-composition-id=\"f11\"] .rot-t .r { font-weight: 800; color: #ff8a4c; }\n    [data-composition-id=\"f11\"] .rot-t .k { font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 28px; letter-spacing: 0.3em; color: #7cc8ff; margin-bottom: 18px; -webkit-text-stroke: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    [data-composition-id=\"f11\"] .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n", "rotulos": [{"de": 0.1, "ate": 1.7, "texto": "E nem tudo<br><span class=\"y\">voltaria</span>"}], "D0": 5.35} */
        const RG = REGEN;
        const st = T.createToyStage(canvas, { fov: 38, ceu: ["#05040c", "#1a1430"], nevoa: [4, 14], corNevoa: "#08060f", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        st.hemi.intensity = 0.5; st.key.intensity = 2.4; st.rim.color.set(0x9f8cff); st.rim.intensity = 2.6; st.sol(0, 0, 3, 1.5);
        const C = RG.cerebro(); C.g.position.set(0, 1.5, 0); C.g.scale.setScalar(0.55); S.add(C.g);
        const fant = new THREE.Group(); C.g.add(fant);
        const fm = new THREE.MeshBasicMaterial({ color: 0x7cc8ff, wireframe: true, transparent: true, opacity: 0, depthWrite: false, fog: false });
        C.g.children.forEach((o) => { if (o.isMesh) { const w = new THREE.Mesh(o.geometry, fm); w.scale.setScalar(1.01); fant.add(w); } });
        const nucleo = RG.glowSprite(0xffc8a0, 1.4, 0.4); nucleo.position.set(0, 1.5, 0); S.add(nucleo);
        // memórias: cartões em órbita, presos por fios de luz
        const NM = 6, cartas = [];
        for (let i = 0; i < NM; i++) { const m = new THREE.MeshStandardMaterial({ map: RG.texMemoria(i), roughness: 0.6, emissive: 0xffffff, emissiveMap: RG.texMemoria(i), emissiveIntensity: 0.5, transparent: true, side: THREE.DoubleSide });
          const q = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.25), m); S.add(q); cartas.push({ q, m, ph: (i / NM) * 6.283, alt: (i % 3 - 1) * 0.22 }); }
        const fioG = new THREE.BufferGeometry(); const FP = new Float32Array(NM * 6); fioG.setAttribute("position", new THREE.BufferAttribute(FP, 3));
        const fio = new THREE.LineSegments(fioG, new THREE.LineBasicMaterial({ color: 0xffc8a0, transparent: true, opacity: 0.4 })); S.add(fio);
        const cinza = new THREE.Color(0x3a3a44), bra = new THREE.Color(0xffffff), v = new THREE.Vector3();
        function render(t) {
          const perde = ease.inOutCubic(range(t, 1.9, 2.7)), volta = ease.inOutSine(range(t, 2.9, 4.3)), apaga = ease.inOutSine(range(t, 2.0, 3.2));
          const op = Math.max(0.02, 1 - perde + volta);
          C.mats.forEach((m) => { m.opacity = Math.min(1, op); m.transparent = op < 0.99; m.depthWrite = op > 0.5; });
          fm.opacity = 0.35 * perde * (1 - volta * 0.6);
          C.g.rotation.y = 0.3 * t;
          nucleo.material.opacity = 0.4 * (1 - apaga);
          cartas.forEach((c, i) => {
            const a = c.ph + t * 0.45, r = 0.85 + 0.5 * apaga;
            c.q.position.set(Math.cos(a) * r, 1.5 + c.alt + 0.05 * Math.sin(t + i), Math.sin(a) * r); c.q.lookAt(cam.position);
            c.m.color.copy(bra).lerp(cinza, apaga); c.m.emissiveIntensity = 0.5 * (1 - apaga); c.m.opacity = 1 - 0.75 * range(t, 3.2, 4.4);
            FP.set([0, 1.5, 0, c.q.position.x, c.q.position.y, c.q.position.z], i * 6);
          });
          fioG.attributes.position.needsUpdate = true; fio.material.opacity = 0.4 * (1 - apaga);
          // câmera: órbita baixa, aproximando
          const e = ease.inOutSine(range(t, 0, 5.35)), an = -0.4 + 0.6 * e;
          cam.position.set(Math.sin(an) * lerp(2.9, 2.4, e), lerp(1.85, 1.6, e), Math.cos(an) * lerp(2.9, 2.4, e)); cam.lookAt(0, 1.2, 0);
          st.bloom = 0.55;
          st.draw();
          const c = st.ctx, vv = RG.vis(st); RG.quadro();
          v.set(0, 1.25, 0); RG.frase(c, cam, v, "CÉREBRO PERDIDO", ease.outCubic(range(t, 1.9, 2.2)) * (1 - range(t, 3.4, 3.7)) * vv, { cor: RG.AZUL, tam: 30, dy: 300 });
          cartas[1].q.getWorldPosition(v); RG.frase(c, cam, v, "MEMÓRIAS NÃO VOLTAM", ease.outCubic(range(t, 4.52, 4.8)) * vv, { cor: RG.LARANJA, tam: 30, dy: 340 });
        }
