/*META {"imports": ["deserto"], "rotulos": [{"de": 2.95, "ate": 4.3, "top": 560, "texto": "<span class=\"k\">SAARA VERDE</span><br>há <span class=\"y\">6 mil anos</span>"}], "D0": 6.29, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const DS = DESERTO;
        await DS.prepara();
        const st = T.createToyStage(canvas, { fov: 36, ceu: ["#5b93cf", "#f2dcb0"], nevoa: [30, 140], corNevoa: "#d9d4b8", nuvens: 6, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0xffe2b8); st.key.intensity = 3.0; st.hemi.intensity = 0.7; st.rim.intensity = 0.9; st.sol(0, -6, 40);
        // savana verde com lago
        const DU = DS.dunas(S, T.M, { tam: 200, seg: 64, amp: 0.3, areia: 0xb89a5a, verde: 0x6d8c34, centro: [0, -50] });
        DU.pintar((x, z) => 0.75 + 0.25 * Math.sin(x * 0.2 + z * 0.13));
        const lago = new THREE.Mesh(new THREE.CircleGeometry(9, 40), T.M(0x3b7a92, 0.08, { metalness: 0.2 })); lago.rotation.x = -Math.PI / 2; lago.scale.set(1.6, 1, 1); lago.position.set(-1, 0.32, -16); S.add(lago);
        const FL = DS.floresta(S, T.M, { n: 70, area: [[-45, 45], [-80, -6]], seed: 8, h: DU.h, tipo: "acacia", alt: [3, 5.5], cor: 0x557a2a, detalhe: 1 });
        FL.crescer((x, z) => (Math.hypot((x + 1) / 1.6, z + 16) < 10.5 ? 0 : 1));
        // girafas e hipopótamos (estilizados)
        const gir = [A.createAnimal("girafa", { fase: 0.1 }), A.createAnimal("girafa", { fase: 0.6 })];
        gir.forEach((g, i) => { g.group.scale.setScalar(i ? 0.85 : 1); S.add(g.group); });
        const hipo = (x, z, s, ry) => { const g = new THREE.Group(), m = T.M(0x6e5a60, 0.55), mr = T.M(0xc88a8a, 0.6);
          const b = new THREE.Mesh(T.SPH, m); b.scale.set(1.5, 0.75, 0.85); g.add(b);
          const c = new THREE.Mesh(T.SPH, m); c.scale.set(0.62, 0.42, 0.5); c.position.set(1.55, 0.2, 0); g.add(c);
          const f = new THREE.Mesh(T.SPH, mr); f.scale.set(0.42, 0.3, 0.46); f.position.set(2.0, 0.05, 0); g.add(f);
          for (const sz of [1, -1]) { const o = new THREE.Mesh(T.SPH, m); o.scale.setScalar(0.12); o.position.set(1.4, 0.62, sz * 0.25); g.add(o);
            const ol = new THREE.Mesh(T.SPH, T.M(0x16100c, 0.3)); ol.scale.setScalar(0.07); ol.position.set(1.85, 0.42, sz * 0.24); g.add(ol); }
          g.position.set(x, 0.05, z); g.scale.setScalar(s); g.rotation.y = ry; S.add(g); return g; };
        const H1 = hipo(-4, -14, 0.9, 0.5), H2 = hipo(1.5, -18, 0.75, 2.4);
        // paredão de arenito com pintura rupestre (girafas, gado, gente) em ocre
        const pc = document.createElement("canvas"); pc.width = 768; pc.height = 512; const g = pc.getContext("2d");
        g.fillStyle = "#b98a5c"; g.fillRect(0, 0, 768, 512);
        const rr = mulberry32(5); for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${rr() < 0.5 ? "70,40,20" : "240,210,170"},${0.06 + rr() * 0.1})`; g.fillRect(rr() * 768, rr() * 512, 2 + rr() * 10, 2 + rr() * 6); }
        const oc = "rgba(140,46,22,0.88)", br = "rgba(242,232,214,0.85)";
        const girafa = (x, y, s, cor) => { g.fillStyle = cor; g.strokeStyle = cor; g.lineWidth = 7 * s; g.lineCap = "round";
          g.beginPath(); g.ellipse(x, y, 52 * s, 22 * s, -0.15, 0, 6.283); g.fill();
          g.beginPath(); g.moveTo(x + 36 * s, y - 12 * s); g.lineTo(x + 70 * s, y - 120 * s); g.stroke();
          g.beginPath(); g.ellipse(x + 80 * s, y - 124 * s, 16 * s, 8 * s, 0.3, 0, 6.283); g.fill();
          for (const dx of [-38, -24, 24, 38]) { g.beginPath(); g.moveTo(x + dx * s, y + 8 * s); g.lineTo(x + dx * s * 1.05, y + 80 * s); g.stroke(); } };
        const boi = (x, y, s, cor) => { g.fillStyle = cor; g.strokeStyle = cor; g.lineWidth = 6 * s; g.lineCap = "round";
          g.beginPath(); g.ellipse(x, y, 46 * s, 20 * s, 0, 0, 6.283); g.fill(); g.beginPath(); g.ellipse(x + 50 * s, y - 10 * s, 14 * s, 10 * s, 0, 0, 6.283); g.fill();
          g.beginPath(); g.arc(x + 56 * s, y - 24 * s, 16 * s, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
          for (const dx of [-30, -18, 22, 34]) { g.beginPath(); g.moveTo(x + dx * s, y + 8 * s); g.lineTo(x + dx * s, y + 50 * s); g.stroke(); } };
        const gente = (x, y, s, cor) => { g.strokeStyle = cor; g.fillStyle = cor; g.lineWidth = 5 * s; g.lineCap = "round";
          g.beginPath(); g.arc(x, y - 52 * s, 8 * s, 0, 6.283); g.fill(); g.beginPath(); g.moveTo(x, y - 44 * s); g.lineTo(x, y - 8 * s); g.lineTo(x - 12 * s, y + 22 * s); g.moveTo(x, y - 8 * s); g.lineTo(x + 14 * s, y + 22 * s);
          g.moveTo(x, y - 34 * s); g.lineTo(x + 22 * s, y - 50 * s); g.moveTo(x, y - 34 * s); g.lineTo(x - 18 * s, y - 20 * s); g.stroke(); };
        girafa(220, 300, 1.15, oc); girafa(470, 250, 0.8, oc); boi(560, 400, 0.9, br); boi(380, 430, 0.8, oc); gente(120, 440, 1, oc); gente(160, 450, 0.9, br); gente(660, 300, 0.9, oc);
        const tx = new THREE.CanvasTexture(pc); tx.colorSpace = THREE.SRGBColorSpace;
        const rocha = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), T.M(0xa8784c, 0.95, { flatShading: true })); rocha.scale.set(1.4, 3.2, 5.5); rocha.position.set(-4.3, 1.4, 3.2); S.add(rocha);
        const pin = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.8), T.M(0xffffff, 0.95, { map: tx })); pin.rotation.y = Math.PI / 2; pin.position.set(-3.02, 1.9, 3.2); S.add(pin);
        const alvo = new THREE.Vector3(), lagoP = new THREE.Vector3(-1, 0.4, -16), gP = new THREE.Vector3(), hP = new THREE.Vector3();
        const P = [[0, [-0.45, 1.95, 3.55], [-3.02, 1.85, 3.2]], [2.6, [-0.05, 2.0, 3.85], [-3.02, 1.8, 3.0]], [4.1, [1.2, 2.6, 7.5], [0, 1.0, -12]], [6.29, [1.8, 2.3, 4.6], [-0.5, 1.2, -14]]];
        const pt = (k, j) => new THREE.Vector3(...P[k][j]);
        function render(t) {
          // passeio da girafa à beira do lago; hipopótamos boiando
          gir.forEach((G, i) => { const x = lerp(6 + i * 3, 2.5 + i * 3, range(t, 0, 6.29)); G.group.position.set(x, DU.h(x, -11 - i * 3), -11 - i * 3); A.face(G.group, -1, 0.15); G.update(t, { passo: 0.9, pescoco: i ? 0.4 * range(t, 3, 4) : 0 }); });
          H1.position.y = 0.0 + 0.05 * Math.sin(t * 1.3); H2.position.y = 0.0 + 0.05 * Math.sin(t * 1.1 + 1);
          H1.rotation.z = 0.08 * range(t, 5.2, 5.6) * Math.sin(t * 4);
          // câmera: rente à pintura → recua e gira para o vale verde (em "Há seis mil anos")
          let k = 0; while (k < P.length - 2 && t > P[k + 1][0]) k++;
          const u = ease.inOutCubic(range(t, P[k][0], P[k + 1][0]));
          cam.position.lerpVectors(pt(k, 1), pt(k + 1, 1), u); alvo.lerpVectors(pt(k, 2), pt(k + 1, 2), u); cam.lookAt(alvo);
          st.bloom = 0.45;
          st.draw();
          const c = st.ctx;
          DS.etq(c, "PINTURA RUPESTRE · SAARA", pin.position, cam, range(t, 0.5, 0.8) * (1 - range(t, 2.5, 2.75)), { dy: 120 });
          DS.etq(c, "LAGOS", lagoP, cam, range(t, 4.3, 4.6), { dy: -60, dx: -120 });
          gir[0].group.getWorldPosition(gP); gP.y += 4;
          DS.etq(c, "GIRAFAS", gP, cam, range(t, 4.7, 5.0), { dy: -20, dx: 80 });
          H1.getWorldPosition(hP);
          DS.etq(c, "HIPOPÓTAMOS", hP, cam, range(t, 5.3, 5.6), { dy: 90, dx: -60 });
        }
