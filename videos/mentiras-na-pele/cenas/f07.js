/*META {"imports": ["pele"], "rotulos": [{"de": 0.3, "ate": 1.85, "top": 470, "texto": "Nem o <span class=\"y\">polígrafo</span><br>resolve"}], "D0": 4.56} */
        await PELE.fontes();
        const st = T.createToyStage(canvas, { fov: 34, ceu: ["#0a0b0e", "#1d1f24"], nevoa: null, nuvens: 0, luz: 0.9 });
        const S = st.scene, cam = st.cam;
        st.rim.color.set(0x9fc8ff); st.hemi.intensity = 0.4;
        const mesa = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), T.M(0x2b2017, 0.55)); mesa.rotation.x = -Math.PI / 2; mesa.receiveShadow = true; S.add(mesa);
        // aparelho: caixa, rolo de papel e 3 agulhas
        const caixa = new THREE.Mesh(T.roundBox(7.4, 0.9, 3.6, 0.12), T.M(0x3a3f46, 0.5, { metalness: 0.35 })); caixa.position.set(0, 0, -0.3); S.add(caixa); caixa.castShadow = caixa.receiveShadow = true;
        const CW = 1400, CH = 420, cv = document.createElement("canvas"); cv.width = CW; cv.height = CH; const g = cv.getContext("2d");
        const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
        const PW = 7, PH = PW * CH / CW;
        const papel = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
        papel.rotation.x = -Math.PI / 2; papel.position.set(0, 0.93, 0.35); papel.receiveShadow = true; S.add(papel);
        for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, PH + 0.3, 24), T.M(0xd8d4cc, 0.6)); r.rotation.x = Math.PI / 2; r.position.set(s * 3.7, 1.0, 0.35); S.add(r); }
        const XN = 0.62; // agulhas a 62% da largura do papel
        const fx = [
          (X) => 0.5 * Math.sin(X * 0.012) + 0.15 * Math.sin(X * 0.031),                                        // respiração
          (X) => 0.25 * Math.sin(X * 0.004) + 0.55 * clamp((X - 1500) / 260) - 0.3,                            // suor (pele conduz mais)
          (X) => { const p = (X % 70) / 70; return (p < 0.08 ? Math.sin(p / 0.08 * Math.PI) * 1.4 : 0) - (p > 0.08 && p < 0.14 ? 0.4 : 0) + 0.12 * Math.sin(X * 0.05); }, // pulso
        ];
        const yT = [95, 215, 335];
        const agulhas = yT.map((y, i) => {
          const a = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 2.0), T.M(0x1b1d22, 0.4, { metalness: 0.6 })); b.position.z = -1.0; a.add(b);
          const ponta = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), T.M(i === 1 ? 0xff8a4c : 0x7cc8ff, 0.4, { emissive: i === 1 ? 0xff8a4c : 0x7cc8ff, emissiveIntensity: 0.8 })); a.add(ponta);
          S.add(a); return a;
        });
        const vel = 330; // px de papel por segundo
        function render(t) {
          const s = t * vel + 1000;
          g.fillStyle = "#ece6da"; g.fillRect(0, 0, CW, CH);
          g.strokeStyle = "rgba(124,160,200,0.35)"; g.lineWidth = 1;
          for (let x = -(s % 40); x < CW; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, CH); g.stroke(); }
          for (let y = 20; y < CH; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(CW, y); g.stroke(); }
          const xn = CW * XN;
          fx.forEach((f, i) => {
            g.strokeStyle = i === 1 ? "#c4501e" : "#1d2b44"; g.lineWidth = 3.5; g.beginPath();
            for (let x = 0; x <= xn; x += 3) { const y = yT[i] - f(s - (xn - x)) * 48; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
          });
          g.fillStyle = "#3a4656"; g.font = '600 22px "JetBrains Mono"'; ["RESPIRAÇÃO", "SUOR", "PULSO"].forEach((n, i) => g.fillText(n, 14, yT[i] - 52));
          tex.needsUpdate = true;
          // pontas das agulhas acompanham o traço
          agulhas.forEach((a, i) => {
            const y = yT[i] - fx[i](s) * 48;
            const px = (xn / CW - 0.5) * PW, pz = 0.35 + (y / CH - 0.5) * PH;
            a.position.set(px, 0.97, pz); a.rotation.y = -0.5 + (pz - 0.35) * 0.2;
          });
          // dolly baixo ao longo do papel
          const e = ease.inOutSine(range(t, 0, 4.56));
          cam.position.set(lerp(3.6, -0.6, e), lerp(3.2, 4.4, e), lerp(5.8, 4.4, e));
          cam.lookAt(lerp(0.4, 0.6, e), 0.9, 0.3);
          st.sol(0, 0, 6);
          st.bloom = 0.35;
          st.draw();
          const c = st.ctx, v = new THREE.Vector3();
          [[1, "SUOR", 2.42], [2, "PULSO", 2.86]].forEach(([i, n, t0], k) => {
            agulhas[i].getWorldPosition(v); const [x, y] = PELE.proj(v, cam);
            PELE.tag(c, x, y, 640, 1290 + k * 80, n, { cor: PELE.AZUL, a: range(t, t0, t0 + 0.3), tam: 36 });
          });
          const aN = range(t, 3.48, 3.75);
          PELE.veu(c, aN * 0.9, 640, 500, 150);
          PELE.txt(c, "NÃO MEDE", 540, 600, { tam: 64, cor: PELE.LARANJA, a: aN, esp: 0.08 });
          PELE.txt(c, "A MENTIRA", 540, 680, { tam: 64, cor: PELE.LARANJA, a: aN, esp: 0.08 });
        }
