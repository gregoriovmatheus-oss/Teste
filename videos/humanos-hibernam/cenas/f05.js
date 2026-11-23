/*META {"imports": ["hiber"], "rotulos": [{"de": 0.39, "ate": 1.75, "texto": "Sem <span class=\"y\">comer</span>"}, {"de": 1.92, "ate": 5.08, "texto": "<span class=\"k\">RESERVA DO OUTONO</span><br><span class=\"y\">Gordura</span> vira combustível"}], "D0": 5.08, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        await HIBER.prepara();
        const st = T.createToyStage(canvas, { fov: 34, ceu: ["#0a0806", "#1a120c"], nevoa: [5, 18], corNevoa: "#120c08", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0xffd2a0); st.key.intensity = 2.2; st.hemi.intensity = 0.3;
        const mesa = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 3), T.M(0x4a3020, 0.55)); mesa.position.y = -0.05; mesa.receiveShadow = true; S.add(mesa);
        // prato vazio + garfo
        const prato = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.3, 0.05, 40), T.M(0xcfcac0, 0.5)); prato.position.set(-1.6, 0.03, 0.3); S.add(prato);
        const garfo = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.015, 0.6), T.M(0xc8ccd2, 0.2, { metalness: 0.9 })); garfo.position.set(-1.05, 0.01, 0.3); S.add(garfo);
        // tanque de vidro com gordura âmbar que escoa até o queimador
        const TX = 0.7, TH = 1.0;
        const vidro = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, TH, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0xd8ecff, roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }));
        vidro.position.set(TX, TH / 2, -0.3); S.add(vidro);
        const tampa = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 40), T.M(0x8a8f98, 0.3, { metalness: 0.8 })); tampa.position.set(TX, TH, -0.3); S.add(tampa);
        const base = tampa.clone(); base.position.y = 0.03; S.add(base);
        const fluido = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1, 40), T.M(0xf0a830, 0.25, { emissive: 0xc06010, emissiveIntensity: 0.5, transparent: true, opacity: 0.92 }));
        fluido.position.set(TX, 0, -0.3); S.add(fluido);
        const cano = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 8), T.M(0x8a8f98, 0.3, { metalness: 0.8 })); cano.rotation.z = Math.PI / 2; cano.position.set(TX + 0.55, 0.12, -0.3); S.add(cano);
        const queim = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.14, 20), T.M(0x2a2c30, 0.4, { metalness: 0.7 })); queim.position.set(TX + 0.9, 0.09, -0.3); S.add(queim);
        const chamas = [0, 1, 2].map((i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: HIBER.glowTex(), color: [0xff8a4c, 0xffc060, 0x7cc8ff][i], blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false })); s.position.set(TX + 0.9, 0.3 + i * 0.05, -0.3); S.add(s); return s; });
        const fogo = new THREE.PointLight(0xff9040, 0, 4, 1.5); fogo.position.set(TX + 0.9, 0.6, 0); S.add(fogo);
        // folhas de outono caindo
        const NF = 70, FP = new Float32Array(NF * 3), RR = mulberry32(55), FJ = Array.from({ length: NF }, () => [(RR() - 0.5) * 5, RR(), -1.5 - RR() * 2, 0.5 + RR()]);
        const fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.BufferAttribute(FP, 3));
        const fm = new THREE.PointsMaterial({ color: 0xd8742c, size: 0.07, transparent: true, opacity: 0.0 }); S.add(new THREE.Points(fg, fm));
        function render(t) {
          const nivel = lerp(0.95, 0.35, ease.inOutSine(range(t, 2.9, 5.08)));
          fluido.scale.y = TH * nivel; fluido.position.y = 0.06 + TH * nivel / 2;
          const ac = range(t, 3.4, 3.9);
          chamas.forEach((s, i) => { const f = 1 + 0.15 * Math.sin(t * 17 + i * 2) + 0.1 * Math.sin(t * 29 + i); s.scale.set((0.36 - i * 0.09) * ac * f, (0.65 - i * 0.15) * ac * f, 1); s.position.y = 0.22 + (0.65 - i * 0.15) * ac * 0.35; });
          fogo.intensity = 3 * ac;
          for (let i = 0; i < NF; i++) { const [x, o, z, v] = FJ[i], y = 3 - ((t * 0.4 * v + o * 3) % 3); FP[i * 3] = x + Math.sin(t * 2 + i) * 0.2; FP[i * 3 + 1] = y; FP[i * 3 + 2] = z; }
          fg.attributes.position.needsUpdate = true; fm.opacity = range(t, 2.4, 2.9) * 0.9;
          // travelling do prato vazio até o tanque e a chama
          const e = ease.inOutCubic(range(t, 0.9, 3.3)), e0 = ease.inOutSine(range(t, 0, 5.08));
          cam.position.set(lerp(-1.6, TX + 0.45, e), lerp(1.4, 1.1, e) - e0 * 0.1, lerp(4.2, 5.4, e) - e0 * 0.3);
          cam.lookAt(lerp(-1.55, TX + 0.45, e), lerp(-0.95, -0.65, e), lerp(0.0, -0.3, e));
          st.bloom = 0.45 + 0.4 * ac; st.sol(0, 0, 5);
          st.draw();
          const c = st.ctx, vv = HIBER.vis(st), [x, y] = HIBER.proj(new THREE.Vector3(TX, TH + 0.2, -0.3), cam);
          HIBER.txt(c, "GORDURA", x, Math.max(y, 260), { tam: 26, cor: HIBER.LARANJA, a: vv * range(t, 1.92, 2.3), esp: 0.3 });
          const [x2, y2] = HIBER.proj(new THREE.Vector3(TX + 0.9, 0.9, -0.3), cam);
          HIBER.txt(c, "COMBUSTÍVEL", x2, Math.max(y2, 260), { tam: 26, cor: HIBER.AZUL, a: vv * range(t, 3.53, 3.9), esp: 0.3 });
        }
