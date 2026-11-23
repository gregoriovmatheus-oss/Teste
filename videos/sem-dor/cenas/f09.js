/*META {"imports": ["dor"], "css": "    [data-composition-id=\"f09\"] .rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }\n    [data-composition-id=\"f09\"] .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    [data-composition-id=\"f09\"] .rot-t .r { font-weight: 800; color: #ff8a4c; }\n    [data-composition-id=\"f09\"] .rot-t .k { font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; -webkit-text-stroke: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    [data-composition-id=\"f09\"] .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n", "rotulos": [{"de": 0.8, "ate": 3.51, "sai": false, "texto": "<span class=\"k\">NA FORMA MAIS GRAVE</span><br>muitos não chegam à <span class=\"y\">vida adulta</span>"}], "D0": 3.51} */
        const st = T.createToyStage(canvas, { fov: 38, ceu: ["#05070c", "#121a28"], nevoa: [8, 20], corNevoa: "#0a0f18", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        st.hemi.intensity = 0.4; st.key.intensity = 1.4; st.rim.color.set(0x9fd6ff); st.rim.intensity = 2.6;
        const chao = new THREE.Mesh(new THREE.PlaneGeometry(30, 10).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x06080c, roughness: 0.7, metalness: 0.1 })); S.add(chao);
        const ESC = [0.42, 0.52, 0.64, 0.76, 0.88, 1.0], X0 = -1.65, DX = 0.66;
        const gente = ESC.map((s, i) => {
          const h = A.createAnimal("humano", { cor: 0x3a4456, cor2: 0x262c38, cabelo: 0x15181e, mulher: i % 2 === 1 });
          const m = new THREE.MeshStandardMaterial({ color: 0x2c3442, roughness: 0.6, transparent: true, opacity: 1 });
          h.group.traverse((o) => { if (o.isMesh) o.material = m; });
          h.group.scale.setScalar(s); h.group.position.set(X0 + i * DX, 0, 0); h.update(0, {}); S.add(h.group); return { h, m };
        });
        // linha do tempo no chão, com o marco da vida adulta
        const lin = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.01, 0.02), DOR.emiss(0x7cc8ff, 1.2)); lin.position.set(0, 0.01, 0.45); S.add(lin);
        const marco = new THREE.Mesh(new THREE.BoxGeometry(0.015, 2.1, 0.015), DOR.emiss(0xff8a4c, 1.5)); marco.position.set(X0 + 2.5 * DX, 1.05, 0.2); S.add(marco);
        const mg = DOR.glowSprite(0xff8a4c, 0.6, 0); mg.position.set(marco.position.x, 0.02, 0.2); S.add(mg);
        const v = new THREE.Vector3();
        function render(t) {
          // os adultos viram contorno fraco, um a um, em "não chega" (1,9 s)
          gente.forEach(({ h, m }, i) => { h.update(t, {}); const f = i < 3 ? 0 : ease.inOutSine(range(t, 1.9 + (i - 3) * 0.25, 2.6 + (i - 3) * 0.25)); m.opacity = 1 - f * 0.85; m.depthWrite = f < 0.5; });
          marco.scale.y = ease.outCubic(range(t, 2.5, 2.9)) || 1e-4; marco.position.y = 1.05 * marco.scale.y; mg.material.opacity = range(t, 2.5, 2.9) * 0.8;
          const e = ease.inOutSine(range(t, 0, 3.51));
          cam.position.set(lerp(-0.5, 0.4, e), 0.5, lerp(10.4, 9.6, e));
          cam.lookAt(lerp(-0.3, 0.25, e), -1.32, 0);
          st.bloom = 0.55;
          st.sol(0, 0, 4, 1);
          st.draw();
          const c = st.ctx, vv = DOR.vis(st); DOR.quadro();
          v.set(marco.position.x, 2.2, 0.2); const [px, py] = DOR.proj(v, cam);
          DOR.txt(c, "VIDA ADULTA", Math.min(880, Math.max(160, px)), Math.max(240, py - 26), { tam: 26, cor: DOR.LARANJA, a: range(t, 2.6, 2.9) * vv, esp: 0.2 });
        }
