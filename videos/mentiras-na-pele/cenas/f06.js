/*META {"imports": ["pele"], "rotulos": [{"de": 0.1, "ate": 1.9, "top": 470, "texto": "Hoje, quase<br><span class=\"y\">ninguém percebe</span>"}, {"de": 5.44, "ate": 8.71, "top": 470, "texto": "<span class=\"k\">QUEM MENTE?</span><br>Acertamos só <span class=\"y\">54%</span>"}], "D0": 8.71} */
        await PELE.fontes();
        const st = T.createToyStage(canvas, { fov: 36, ceu: ["#06080d", "#18202c"], nevoa: [12, 70], corNevoa: "#0c1118", nuvens: 0, luz: 0.85 });
        const S = st.scene, cam = st.cam;
        st.rim.color.set(0x8fc4ff); st.rim.intensity = 2; st.hemi.intensity = 0.35;
        const piso = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x15181e, roughness: 0.35, metalness: 0.25 }));
        piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; S.add(piso);
        // parte 1: duas pessoas conversando; quem ouve tenta "ler" quem fala (varredura azul que não acha nada)
        const Aa = PELE.corpo({ cor: 0x2f5c8a, cor2: 0x2c3550, cabelo: 0x111111, pele: 0x8a5a3c, esc: 14 });
        const Bp = PELE.corpo({ cor: 0xe07a5f, cor2: 0x3a3a3e, cabelo: 0x6b4a2e, pele: 0xe2ad85, mulher: true, esc: 14 });
        Aa.group.position.set(-0.75, 0, 0); Aa.group.rotation.y = Math.PI / 2; Bp.group.position.set(0.75, 0, 0); Bp.group.rotation.y = -Math.PI / 2;
        S.add(Aa.group, Bp.group);
        const scan = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.05), new THREE.MeshBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
        scan.rotation.y = Math.PI / 2; S.add(scan);
        const scanG = PELE.brilho(0x7cc8ff, 1.6, "suave", 0); S.add(scanG);
        // parte 2: moeda em câmera lenta (cara ou coroa genérica)
        const CX = 40;
        const face = (txt) => { const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
          g.fillStyle = "#c9a24a"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#8a6a26"; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 112, 0, 6.283); g.stroke();
          g.lineWidth = 3; g.beginPath(); g.arc(128, 128, 96, 0, 6.283); g.stroke(); g.fillStyle = "#7a5a1e"; g.font = "800 110px Inter"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, 128, 134);
          const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
        const mOuro = new THREE.MeshStandardMaterial({ color: 0xd8b25a, metalness: 0.95, roughness: 0.28 });
        const moeda = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.12, 64), [mOuro,
          new THREE.MeshStandardMaterial({ map: face("1"), metalness: 0.85, roughness: 0.3 }), new THREE.MeshStandardMaterial({ map: face("★"), metalness: 0.85, roughness: 0.3 })]);
        moeda.castShadow = true; S.add(moeda);
        const halo = PELE.brilho(0xffd59a, 7, "suave", 0.25); S.add(halo);
        const pts = PELE.bokeh(S, { n: 20, seed: 66, centro: [CX, 3, -14], area: [26, 14, 6], tam: [1.5, 4], cores: [0x7cc8ff, 0xffd49a], op: 0.3 });
        const TC = 4.3;
        function render(t) {
          Aa.pose(t, { cabeca: [0.1 * Math.sin(t), 0.05], bracoD: [0.3, 0.9, 0.1] });
          Bp.pose(t, { cabeca: [0.15 * Math.sin(t * 1.3), -0.02], bracoE: [0.5 + 0.3 * Math.sin(t * 3), 1.3, 0.25], fase: 0.4 });
          const ks = range(t, 2.0, 3.6);
          scan.position.set(0.75, lerp(2.0, 0.1, ks), 0); scan.material.opacity = Math.sin(Math.PI * ks) * 0.9;
          scanG.position.copy(scan.position); scanG.material.opacity = Math.sin(Math.PI * ks) * 0.5;
          // moeda: sobe e gira devagar
          const u = t - TC;
          moeda.position.set(CX, 1.9 + Math.sin(clamp(u / 4.4) * Math.PI) * 0.6, 0);
          moeda.rotation.set(Math.PI / 2 + u * 2.1, 0.35, 0.15);
          halo.position.set(CX, moeda.position.y, -0.6);
          st.vel = 0.7 * Math.max(0, 1 - Math.abs(t - TC) / 0.25); st.velT = t;
          if (t < TC) {
            const e = ease.inOutSine(range(t, 0, TC));
            cam.position.set(lerp(-1.6, 2.6, e), lerp(1.9, 1.6, e), lerp(4.6, 3.4, e));
            cam.lookAt(lerp(0, 0.5, e), 1.45, 0);
            st.sol(0, 0, 5);
          } else {
            const e = ease.outCubic(range(u, 0, 8.71 - TC)), a = lerp(-0.5, 0.25, e), R = lerp(6.5, 4.6, e);
            cam.position.set(CX + Math.sin(a) * R, lerp(1.0, 1.5, e), Math.cos(a) * R);
            cam.lookAt(CX, 1.65, 0);
            st.sol(CX, 0, 5);
          }
          st.bloom = 0.55;
          st.draw();
          const c = st.ctx;
          if (t < TC) {
            const v = new THREE.Vector3(0, 1.75, 0); Bp.group.localToWorld(v); const [x, y] = PELE.proj(v, cam);
            PELE.tag(c, x, y, x + 120, y - 160, "MENTINDO? ???", { cor: PELE.AZUL, a: PELE.fade(t, 2.3, TC - 0.1, 0.3) });
          }
          const aM = range(t, 7.5, 7.9);
          if (aM > 0) {
            const k = ease.outCubic(range(t, 7.55, 8.4)), x0 = 300, W = 430;
            c.save(); c.globalAlpha = aM; c.fillStyle = "rgba(255,255,255,0.15)"; c.fillRect(x0, 1300, W, 18); c.fillRect(x0, 1370, W, 18);
            c.fillStyle = "#ff8a4c"; c.fillRect(x0, 1300, W * 0.54 * k, 18); c.fillStyle = "#7cc8ff"; c.fillRect(x0, 1370, W * 0.5 * k, 18);
            c.fillStyle = "rgba(255,255,255,0.7)"; c.fillRect(x0 + W * 0.5 - 1, 1285, 2, 118); c.restore();
            PELE.txt(c, "NÓS", x0 - 20, 1309, { tam: 24, al: "right", a: aM });
            PELE.txt(c, "MOEDA", x0 - 20, 1379, { tam: 24, al: "right", a: aM });
            PELE.txt(c, Math.round(54 * k) + "%", x0 + W + 20, 1309, { tam: 26, cor: PELE.LARANJA, al: "left", a: aM });
            PELE.txt(c, Math.round(50 * k) + "%", x0 + W + 20, 1379, { tam: 26, cor: PELE.AZUL, al: "left", a: aM });
          }
        }
