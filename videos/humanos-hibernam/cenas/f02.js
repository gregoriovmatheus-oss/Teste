/*META {"imports": ["hiber"], "rotulos": [{"de": 0.25, "ate": 2.25, "texto": "<span class=\"k\">URSO-NEGRO · INVERNO</span><br>Todo ano, <span class=\"y\">hibernando</span>"}], "D0": 6.65} */
        await HIBER.prepara();
        const st = T.createToyStage(canvas, { fov: 38, ceu: ["#070b16", "#1d2a40"], nevoa: [8, 40], corNevoa: "#141e30", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0xa9c4ee); st.key.intensity = 1.6; st.hemi.intensity = 0.35; st.rim.color.set(0x7cc8ff); st.rim.intensity = 0.9;
        const chao = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), T.M(0xdfe8f2, 0.9)); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; S.add(chao);
        // toca: meia cúpula de terra e pedra com a boca virada para a câmera (+z), neve no topo
        const toca = new THREE.Mesh(new THREE.SphereGeometry(2.3, 40, 16, Math.PI / 2 + 0.75, Math.PI * 2 - 1.5, 0, Math.PI / 2), T.M(0x3b3029, 0.95, { side: THREE.DoubleSide }));
        toca.scale.set(1.15, 0.85, 1); S.add(toca);
        const capa = new THREE.Mesh(new THREE.SphereGeometry(2.38, 40, 12, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, 0, Math.PI / 3.2), T.M(0xeef3f8, 0.8)); capa.scale.set(1.15, 0.87, 1); S.add(capa);
        const R = mulberry32(21);
        for (let i = 0; i < 9; i++) { const pd = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25 + R() * 0.35, 0), T.M(0x4a4440, 0.9)); const a = Math.PI / 2 + (R() - 0.5) * 1.5; pd.position.set(Math.cos(a) * 2.5 + (R() - 0.5), 0.1, Math.sin(a) * 2.4); S.add(pd); }
        const u = HIBER.urso(T.M); u.g.rotation.y = -0.7; u.g.position.set(-0.1, 0, 0.1); S.add(u.g);
        const dentro = new THREE.PointLight(0x9fb8e0, 2.5, 5, 1.5); dentro.position.set(0.8, 1.2, 1.6); S.add(dentro);
        for (let i = 0; i < 16; i++) { const p = HIBER.pinheiro(T.M, 1.4 + R() * 1.6, true); const a = R() * 6.283, d = 6 + R() * 16; p.position.set(Math.cos(a) * d, 0, -Math.abs(Math.sin(a)) * d - 2); S.add(p); }
        const nv = HIBER.neve(S, { n: 1400, x: [-8, 8], y: [0, 7], z: [-8, 9], seed: 22, tam: 0.06, vel: 0.5 });
        // batimentos: 50 bpm até "50" (3,8 s), depois cai até 10 em "10" (6,19 s)
        const bpm = (t) => lerp(50, 10, ease.inOutSine(range(t, 4.1, 6.15)));
        const DT = 1 / 60, PH = [0]; for (let i = 1; i < 6.65 / DT + 2; i++) PH.push(PH[i - 1] + bpm(i * DT) / 60 * DT);
        const fase = (t) => { const k = Math.max(0, t / DT), i = Math.floor(k); return lerp(PH[i] || 0, PH[i + 1] || 0, k - i); };
        function render(t) {
          nv.update(t, 0.12);
          u.respira(t, 1.4, lerp(8, 3, range(t, 4, 6.2)));
          // dolly baixo na neve até a boca da toca
          const e = ease.inOutSine(range(t, 0, 6.65));
          cam.position.set(lerp(2.6, 1.25, e), lerp(1.1, 0.85, e), lerp(8.5, 3.3, e));
          cam.lookAt(lerp(0.2, 0.55, e), lerp(1.6, 1.1, e), 0);
          st.bloom = 0.5; st.sol(0, 0, 10);
          st.draw();
          // monitor cardíaco (aparece em "coração", 2,4 s)
          const c = st.ctx, a = HIBER.vis(st) * range(t, 2.3, 2.7);
          if (a > 0) {
            const x0 = 140, y0 = 720, w = 680, h = 230;
            HIBER.painel(c, x0, y0, w, h, a);
            HIBER.txt(c, "FREQUÊNCIA CARDÍACA", x0 + 28, y0 + 34, { tam: 22, cor: HIBER.AZUL, al: "left", a, esp: 0.2 });
            c.save(); c.globalAlpha = a; c.strokeStyle = t > 4.1 ? HIBER.LARANJA : "#9fe8b0"; c.lineWidth = 4; c.lineJoin = "round"; c.beginPath();
            const W2 = 380, J = 2.6;
            for (let i = 0; i <= W2; i += 2) { const tau = t - (W2 - i) / W2 * J; if (tau < 0) continue; const yy = y0 + 160 - HIBER.ecg(fase(tau)) * 95; if (i === 0 || tau - 2 / W2 * J < 0) c.moveTo(x0 + 28 + i, yy); else c.lineTo(x0 + 28 + i, yy); }
            c.stroke(); c.restore();
            const n = t < 3.8 ? "--" : String(Math.round(bpm(t)));
            HIBER.txt(c, n, x0 + w - 40, y0 + 130, { tam: 110, cor: t > 4.1 ? HIBER.LARANJA : "#fff", al: "right", a, esp: 0 });
            HIBER.txt(c, "BPM", x0 + w - 40, y0 + 200, { tam: 24, cor: "#cfe6ff", al: "right", a, esp: 0.3 });
          }
        }
