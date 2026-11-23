/*META {"imports": ["hiber"], "rotulos": [{"de": 0.3, "ate": 2.15, "texto": "<span class=\"k\">MEDICINA</span><br>Isso mudaria <span class=\"y\">tudo</span>"}, {"de": 2.42, "ate": 3.95, "texto": "Um paciente <span class=\"y\">grave</span>"}, {"de": 4.03, "ate": 5.66, "texto": "<span class=\"y\">Pausado</span><br><span class=\"p\">até a cirurgia</span>"}], "D0": 5.66, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        await HIBER.prepara();
        const st = T.createToyStage(canvas, { fov: 36, ceu: ["#0c1418", "#16242a"], nevoa: [7, 22], corNevoa: "#0e1a20", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0xe0f4ff); st.key.intensity = 1.1; st.hemi.intensity = 0.3; st.rim.color.set(0x7cc8ff);
        const piso = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), T.M(0x5e6e70, 0.3, { metalness: 0.2 })); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; S.add(piso);
        const parede = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), T.M(0x5a6c70, 0.8)); parede.position.set(0, 4, -3); S.add(parede);
        // câmara fria de vidro com o paciente
        const leito = new THREE.Mesh(T.roundBox(2.4, 0.7, 1.0, 0.1), T.M(0xaab6bc, 0.4)); S.add(leito);
        const h = A.createAnimal("humano", { cor: 0xbfd8e8, cor2: 0xbfd8e8 }); h.group.rotation.z = -Math.PI / 2; h.group.position.set(-0.95, 0.92, 0); S.add(h.group);
        const lenc = new THREE.Mesh(T.roundBox(1.5, 0.22, 0.85, 0.1), T.M(0xb8c8d4, 0.9)); lenc.position.set(0.25, 0.72, 0); S.add(lenc);
        const cam_ = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.3, 1.3), new THREE.MeshStandardMaterial({ color: 0xbfe4ff, roughness: 0.05, transparent: true, opacity: 0.18, depthWrite: false }));
        cam_.position.set(0, 1.35, 0); S.add(cam_);
        const quadro = new THREE.Mesh(new THREE.BoxGeometry(2.74, 1.34, 1.34), new THREE.MeshBasicMaterial({ color: 0x7cc8ff, wireframe: true, transparent: true, opacity: 0.5, toneMapped: false })); quadro.position.copy(cam_.position); S.add(quadro);
        const frio = new THREE.PointLight(0x7cc8ff, 0, 4, 1.5); frio.position.set(0, 1.7, 0.3); S.add(frio);
        // monitor ao lado
        const mon = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.08), T.M(0x1a1e22, 0.4)); mon.position.set(1.9, 1.9, -0.4); mon.rotation.y = -0.4; S.add(mon);
        const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.7, 8), T.M(0x8a9098, 0.3, { metalness: 0.8 })); haste.position.set(1.9, 0.85, -0.45); S.add(haste);
        // geada: partículas finas dentro da câmara
        const NP = 500, P = new Float32Array(NP * 3), RR = mulberry32(77), J = Array.from({ length: NP }, () => [(RR() - 0.5) * 2.6, RR() * 1.2 + 0.75, (RR() - 0.5) * 1.2, RR() * 6.28]);
        const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(P, 3));
        const pm = new THREE.PointsMaterial({ map: HIBER.glowTex(), color: 0xcfeaff, size: 0.04, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }); S.add(new THREE.Points(pg, pm));
        function render(t) {
          const fr = range(t, 3.0, 4.6);
          for (let i = 0; i < NP; i++) { const [x, y, z, p] = J[i]; P[i * 3] = x + Math.sin(t * 0.4 + p) * 0.05; P[i * 3 + 1] = y + Math.sin(t * 0.3 + p * 2) * 0.04; P[i * 3 + 2] = z; }
          pg.attributes.position.needsUpdate = true; pm.opacity = 0.15 + 0.75 * fr;
          cam_.material.opacity = 0.14 + 0.2 * fr; frio.intensity = 2.5 * fr;
          // dolly lateral ao longo da câmara
          const e = ease.inOutSine(range(t, 0, 5.66));
          cam.position.set(lerp(-2.6, 2.2, e), lerp(3.0, 2.7, e), lerp(5.4, 5.0, e));
          cam.lookAt(lerp(-0.5, 0.4, e), -0.45, 0);
          st.bloom = 0.5 + 0.3 * fr; st.sol(0, 0, 6);
          st.draw();
          const c = st.ctx, vv = HIBER.vis(st), [x, y] = HIBER.proj(new THREE.Vector3(1.9, 2.25, -0.4), cam);
          HIBER.txt(c, t < 4.03 ? "ESTÁVEL" : "PAUSADO", x, y - 30, { tam: 26, cor: t < 4.03 ? "#9fe8b0" : HIBER.LARANJA, a: vv * range(t, 0.4, 0.8), esp: 0.25 });
        }
