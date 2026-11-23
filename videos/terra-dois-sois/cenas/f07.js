/*META {"imports": ["lowpoly", "doissois"], "rotulos": [{"de": 1.3, "ate": 2.45, "texto": "o corpo precisa<br>de <span class=\"y\">escuro</span>"}, {"de": 2.55, "ate": 4.4, "texto": "<span class=\"k\">MELATONINA</span><br>o hormônio<br>do <span class=\"y\">sono</span>"}, {"de": 5.25, "ate": 6.69, "top": 600, "texto": "o sono vira <span class=\"y\">bagunça</span>"}], "D0": 6.69} */
        const LP = LOWPOLY, DS = DOISSOIS;
        await DS.fontes();
        const st = LP.palco(canvas, { fov: 34, foco: 1.5, faixa: 0.5, desfoque: 20, fundo: 0x0c0a10 });
        const { S, cam } = st;
        const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); S.add(b); return b; };
        // cama, travesseiro, coberta, criado-mudo e celular
        box(1.5, 0.5, 2.4, LP.mat(0x4a3a30, 0.8), 0, 0.25, 0.7); box(1.45, 0.08, 2.35, LP.mat(0xd8d2c8, 0.9), 0, 0.54, 0.7);
        const trav = new THREE.Mesh(LP.facetado(2, (v) => { v.y *= 0.3; v.x *= 1.5; }, 3, 0.12), LP.mat(0xe8e2d8, 0.9)); trav.scale.setScalar(0.3); trav.position.set(0, 0.64, -0.08); S.add(trav);
        const p = LP.pessoa({ seed: 7, pele: 0xc08a6a, cabelo: 0x2a1a10, jaqueta: 0x56657a, camisa: 0xd8d2c6, barba: false, iris: 0x4a3420 });
        p.root.rotation.x = -Math.PI / 2; p.root.position.set(0, 0.8, 1.65); S.add(p.root);
        const cob = new THREE.Mesh(LP.facetado(2, (v) => { v.y *= 0.22; v.x *= 0.75; v.z *= 1.15; }, 11, 0.16), LP.mat(0x3d5a80, 0.9)); cob.position.set(0, 0.78, 1.25); S.add(cob);
        box(0.5, 0.62, 0.45, LP.mat(0x6a4a34, 0.6), 0.75, 0.31, -0.05);
        box(0.08, 0.01, 0.16, LP.mat(0x15161a, 0.3), 0.7, 0.625, -0.05);
        const tc = document.createElement("canvas"); tc.width = 128; tc.height = 256; const g = tc.getContext("2d");
        g.fillStyle = "#06070c"; g.fillRect(0, 0, 128, 256); g.fillStyle = "#e8f0ff"; g.font = "600 44px Inter, sans-serif"; g.textAlign = "center";
        g.fillText("03:12", 64, 96); g.font = "500 15px Inter, sans-serif"; g.fillStyle = "#ff8a4c"; g.fillText("☀ ☀  céu claro", 64, 130);
        const tela = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.145), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(tc), color: new THREE.Color(1.6, 1.6, 1.6) }));
        tela.rotation.x = -Math.PI / 2; tela.position.set(0.7, 0.631, -0.05); S.add(tela);
        // cortina com fresta: a luz dos sóis (madrugada clara) corta o rosto numa faixa
        const cort = LP.mat(0x2a2430, 0.9);
        box(0.05, 3, 1.6, cort, 1.4, 1.2, -0.86); box(0.05, 3, 1.6, cort, 1.4, 1.2, 0.9);
        st.fria.color.set(0xffb070); st.fria.intensity = 4.2; st.fria.position.set(3.2, 2.4, 0.15);
        st.quente.color.set(0xff6a40); st.quente.intensity = 0.25; st.hemi.intensity = 0.22; st.rim.intensity = 0.35; st.rim2.intensity = 0.3;
        st.exposicao = 1.15;
        const alvo = new THREE.Vector3();
        function render(t) {
          const agit = range(t, 4.54, 5.0);
          const ox = agit > 0 ? [0.45, -0.4, 0.2, -0.5, 0.35][Math.floor(t * 3.2) % 5] : lerp(0.1, 0, range(t, 0, 2));
          p.emocao(agit > 0.5 ? "medo" : "triste", [ox, agit > 0 ? 0.25 : 0.4]);
          p.cab.rotation.set(0, 0, agit * 0.12 * Math.sin(t * 3.1));
          // do celular (03:12, céu claro) até o rosto acordado; depois desce e gira
          const e = ease.inOutCubic(range(t, 0.9, 2.6)), d = ease.inOutSine(range(t, 2.6, 6.69));
          cam.position.set(lerp(0.7, 0.0, e), lerp(1.35, 2.45, e) - 0.35 * d, lerp(-0.02, 0.27, e));
          alvo.set(cam.position.x, 0.6, cam.position.z - 0.001);
          const r = 0.12 * d + agit * 0.05 * Math.sin(t * 4);
          cam.up.set(Math.sin(r), 0, -Math.cos(r));
          cam.lookAt(alvo);
          st.U.foco.value = cam.position.y - lerp(0.63, 0.92, e);
          st.draw();
          // medidor de melatonina esvaziando sem noite
          const c = st.ctx, a = range(t, 4.4, 4.7);
          if (a > 0) {
            const k = 1 - 0.88 * ease.inOutSine(range(t, 4.6, 5.9));
            DS.pilula(c, 540, 985, 640, 56, a);
            DS.txt(c, "MELATONINA", 280, 985, { tam: 24, cor: DS.AZUL, a, al: "left" });
            c.save(); c.globalAlpha = a; c.fillStyle = "rgba(124,200,255,0.18)"; c.fillRect(530, 979, 300, 12);
            c.fillStyle = k < 0.5 ? DS.LARANJA : DS.AZUL; c.fillRect(530, 979, 300 * k, 12); c.restore();
          }
        }
