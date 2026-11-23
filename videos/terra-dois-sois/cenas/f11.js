/*META {"imports": ["doissois"], "rotulos": [{"de": 1.5, "ate": 2.9, "texto": "<span class=\"k\">TODO QUARTO</span><br>cortina <span class=\"y\">blackout</span>"}, {"de": 3.0, "ate": 5.45, "texto": "o <span class=\"y\">relógio</span> diz a hora,<br>não o céu"}], "D0": 5.45} */
        const DS = DOISSOIS;
        const st = T.createToyStage(canvas, { fov: 42, ceu: "#0b0a10", nevoa: null, nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        S.environment = null; S.add(new THREE.AmbientLight(0x5a6c90, 0.55));
        const parede = T.M(0x8a7a6c, 0.9), box = (w, h, d, m, x, y, z, sombra = true) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = sombra; b.receiveShadow = true; S.add(b); return b; };
        box(10, 0.1, 10, T.M(0x5a4232, 0.7), 0, -0.05, 0);
        box(3.8, 3.2, 0.15, parede, -3.1, 1.6, -4); box(3.8, 3.2, 0.15, parede, 3.1, 1.6, -4); box(2.4, 0.8, 0.15, parede, 0, 0.4, -4); box(2.4, 0.6, 0.15, parede, 0, 2.9, -4);
        box(0.15, 3.2, 9, parede, -4.2, 1.6, 0.5); box(0.15, 3.2, 9, parede, 4.2, 1.6, 0.5); box(9, 0.1, 9, parede, 0, 3.2, 0.5, false);
        // lá fora: dia claro com dois sóis (mesmo de "noite")
        const ceu = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), new THREE.MeshBasicMaterial({ map: DS.ceuTex([[0, "#6a9fe0"], [0.6, "#cfe4f6"], [1, "#f6dcb0"]]), fog: false })); ceu.position.set(0, 10, -40); S.add(ceu);
        const SA = DS.estrela(S, { r: 1.4, tipo: "amarelo", halo: 7, pos: [-2.8, 6.5, -36] }), SV = DS.estrela(S, { r: 0.7, tipo: "vermelho", halo: 8, pos: [2.6, 4.6, -36] });
        // cortinas pregueadas que fecham (0,9 → 1,9 s)
        const cm = T.M(0x22202a, 0.95);
        const mkC = () => { const g = new THREE.Group(); for (let i = 0; i < 8; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.5, 0.06), cm); b.position.set(-0.6 + i * 0.17, 1.55, (i % 2) * 0.06); b.castShadow = true; g.add(b); } S.add(g); return g; };
        const CE = mkC(), CD = mkC();
        // cama, criado-mudo, relógio digital, pessoa na janela
        box(2.0, 0.5, 2.6, T.M(0x3d5a80, 0.9), 2.6, 0.25, -1.6); box(2.0, 0.15, 0.6, T.M(0xe0dad0, 0.9), 2.6, 0.58, -2.6);
        box(0.6, 0.6, 0.5, T.M(0x6a4a34, 0.6), 1.25, 0.3, -2.2);
        box(0.42, 0.18, 0.14, T.M(0x18181c, 0.4), 1.25, 0.69, -2.15);
        const tc = document.createElement("canvas"); tc.width = 256; tc.height = 96; const g = tc.getContext("2d");
        g.fillStyle = "#050505"; g.fillRect(0, 0, 256, 96); g.fillStyle = "#ff3a2a"; g.font = "600 72px 'JetBrains Mono', monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("22:00", 128, 52);
        const visor = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.14), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(tc), color: new THREE.Color(2.2, 2.2, 2.2), toneMapped: false }));
        visor.position.set(1.25, 0.69, -2.079); S.add(visor);
        const gl = DS.brilho(0xff3a2a, 0.9, "suave", 0.5); gl.position.set(1.25, 0.69, -2.0); S.add(gl);
        const h = A.createAnimal("humano", { cor: 0x6a6f78, cor2: 0x2a2a30 }); A.face(h.group, 0.3, -1); h.group.position.set(-1.9, 0, -3.1); S.add(h.group);
        h.group.traverse((m) => { if (m.isMesh) m.castShadow = true; });
        st.sol(0, -2, 7);
        st.key.color.set(0xfff0d8); st.key.position.set(-1.5, 6, -16); st.key.target.position.set(0, 0, -1);
        st.rim.color.set(0xff6a4a); st.rim.position.set(2, 4, -16); st.rim.target.position.set(0, 0, -1);
        const alvo = new THREE.Vector3(), CLK = new THREE.Vector3(1.25, 0.69, -2.1);
        function render(t) {
          h.update(t, {});
          SA.set(1, t); SV.set(1, t);
          const f = ease.inOutCubic(range(t, 0.85, 1.95));
          CE.position.x = lerp(-2.0, -0.62, f); CD.position.x = lerp(2.0, 0.78, f);
          const ab = 1 - 0.93 * f;
          st.key.intensity = 3.4 * (0.25 + 0.75 * ab); st.rim.intensity = 1.0 * ab; st.hemi.intensity = 0.2 + 0.4 * ab; st.hemi.color.set(0x8aa0d0);
          gl.material.opacity = 0.2 + 0.6 * f;
          // da janela (contraluz) até o relógio
          const e = ease.inOutSine(range(t, 0, 2.1)), d = ease.inOutCubic(range(t, 2.0, 4.6));
          cam.position.set(lerp(0.4, 0.1, e), lerp(1.55, 1.5, e), lerp(3.4, 2.6, e)).lerp(new THREE.Vector3(1.05, 0.92, -1.15), d);
          alvo.set(0, lerp(1.4, 1.75, e), -4).lerp(CLK.clone().add(new THREE.Vector3(0.05, -0.42, -0.2)), d);
          cam.lookAt(alvo);
          st.bloom = 0.55 + 0.25 * f;
          st.draw();
        }
