/*META {"imports": ["deserto"], "rotulos": [{"de": 0.1, "ate": 1.95, "top": 600, "texto": "<span class=\"y\">bilhões</span> de árvores novas"}], "D0": 6.38, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const DS = DESERTO;
        await DS.prepara();
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#7d93a8", "#e6d6b8"], nevoa: [25, 150], corNevoa: "#d8cdb6", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0xffe6c0); st.key.intensity = 2.6; st.hemi.intensity = 0.7; st.sol(0, -10, 40);
        const DU = DS.dunas(S, T.M, { tam: 220, seg: 64, amp: 0.5, areia: 0xc8a064, verde: 0x4a7a30, centro: [0, -60] });
        DU.pintar((x, z) => 0.6 + 0.3 * Math.sin(x * 0.15 + z * 0.1));
        const FL = DS.floresta(S, T.M, { n: 520, area: [[-40, 40], [-110, 12]], seed: 15, h: DU.h, alt: [2.0, 3.6], cor: 0x3a7430 });
        // CO2: carbono escuro + dois oxigênios (InstancedMesh)
        const NM = 70, r = mulberry32(17), geo = new THREE.IcosahedronGeometry(1, 1);
        const IC = new THREE.InstancedMesh(geo, T.M(0x2a2c30, 0.4), NM), IO = new THREE.InstancedMesh(geo, T.M(0xd85a48, 0.35), NM * 2);
        IC.frustumCulled = IO.frustumCulled = false; S.add(IC, IO);
        const MD = []; for (let i = 0; i < NM; i++) MD.push({ x: (r() - 0.5) * 22, y: 5 + r() * 9, z: -14 + r() * 22, ax: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), v: r(), d: 0.5 + r() * 1.3 });
        const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3(), o3 = new THREE.Vector3(), alvo = new THREE.Vector3();
        const ceuA = new THREE.Color("#d8cdb6"), ceuB = new THREE.Color("#bcd6ea");
        function render(t) {
          // a floresta nasce de mudas (0–2 s)
          FL.crescer((x, z, i, qq) => LP_passa(range(t, 0.05 + qq.v * 1.6 + Math.max(0, -z) * 0.004, 0.75 + qq.v * 1.6 + Math.max(0, -z) * 0.004)));
          // moléculas flutuam; em "puxariam" (2,0 s) descem para as copas e somem
          MD.forEach((m, i) => {
            const k = ease.inQuad(range(t, 1.95 + m.v * 0.6, 1.95 + m.v * 0.6 + m.d));
            p3.set(m.x + 0.4 * Math.sin(t * 0.7 + i), lerp(m.y + 0.3 * Math.sin(t + i * 2), DU.h(m.x, m.z) + 2.5, k), m.z);
            const sc = 0.32 * (1 - range(k, 0.75, 1));
            q.setFromAxisAngle(m.ax, t * 0.6 + i);
            s3.setScalar(sc); m4.compose(p3, q, s3); IC.setMatrixAt(i, m4);
            for (const sg of [1, -1]) { o3.set(sg * 0.95 * sc / 0.32 * 0.32, 0, 0).applyQuaternion(q).multiplyScalar(1).add(p3); s3.setScalar(sc * 0.82); m4.compose(o3, q, s3); IO.setMatrixAt(i * 2 + (sg > 0 ? 0 : 1), m4); }
          });
          IC.instanceMatrix.needsUpdate = true; IO.instanceMatrix.needsUpdate = true;
          S.fog.color.lerpColors(ceuA, ceuB, range(t, 2.5, 5.5));
          // câmera: grua descendo da névoa até as copas
          const e = ease.inOutSine(range(t, 0, 6.38));
          cam.position.set(lerp(-3, 3, e), lerp(16, 8.5, e), lerp(26, 15, e));
          alvo.set(lerp(-1, 1, e), lerp(5, 3, e), lerp(-8, -6, e)); cam.lookAt(alvo);
          st.bloom = 0.4;
          st.draw();
          const c = st.ctx;
          p3.set(MD[3].x, MD[3].y, MD[3].z);
          DS.etq(c, "CO₂ · GÁS CARBÔNICO", p3, cam, range(t, 2.45, 2.75) * (1 - range(t, 3.7, 3.9)), { dy: 60 });
          // painel: ritmo do aquecimento (sem números) — a curva entorta para baixo com as florestas
          const a = range(t, 3.85, 4.2) * DS.vis(st);
          if (a > 0) {
            const x0 = 150, y0 = 690, w = 780, h = 290; DS.painel(c, x0, y0, w, h, a);
            DS.txt(c, "AQUECIMENTO GLOBAL", x0 + 30, y0 + 36, { tam: 22, cor: DS.AZUL, al: "left", a, esp: 0.22 });
            c.save(); c.globalAlpha = a; c.lineWidth = 2; c.strokeStyle = "rgba(255,255,255,0.35)";
            c.beginPath(); c.moveTo(x0 + 40, y0 + 70); c.lineTo(x0 + 40, y0 + h - 40); c.lineTo(x0 + w - 40, y0 + h - 40); c.stroke();
            const X = (u) => x0 + 40 + u * (w - 90), Yc = (v) => y0 + h - 40 - v * (h - 120);
            const pk = range(t, 4.0, 4.9), qk = range(t, 4.9, 5.9);
            c.lineWidth = 6; c.lineCap = "round"; c.strokeStyle = DS.LARANJA; c.beginPath();
            for (let u = 0; u <= 0.5 * pk + 1e-6; u += 0.01) { const v = 0.08 + 1.1 * u * u * 2; u === 0 ? c.moveTo(X(u), Yc(v)) : c.lineTo(X(u), Yc(v)); } c.stroke();
            if (qk > 0) {
              c.setLineDash([10, 12]); c.strokeStyle = "rgba(255,138,76,0.45)"; c.lineWidth = 4; c.beginPath();
              for (let u = 0.5; u <= 0.5 + 0.5 * qk; u += 0.01) { const v = 0.08 + 2.2 * u * u; u === 0.5 ? c.moveTo(X(u), Yc(Math.min(1, v))) : c.lineTo(X(u), Yc(Math.min(1, v))); } c.stroke(); c.setLineDash([]);
              c.strokeStyle = "#8fe08a"; c.lineWidth = 6; c.beginPath();
              for (let u = 0.5; u <= 0.5 + 0.5 * qk; u += 0.01) { const v = 0.63 + 0.55 * (u - 0.5) - 0.3 * (u - 0.5) * (u - 0.5); u === 0.5 ? c.moveTo(X(u), Yc(v)) : c.lineTo(X(u), Yc(v)); } c.stroke();
              DS.txt(c, "COM AS FLORESTAS", X(0.98), Yc(0.86) + 34, { tam: 20, cor: "#8fe08a", al: "right", a: a * range(t, 5.3, 5.6), esp: 0.18 });
            }
            DS.txt(c, "desacelera", x0 + w - 30, y0 + 36, { tam: 30, fonte: "inter", peso: 800, cor: "#fff", al: "right", a: a * range(t, 5.4, 5.7), esp: 0 });
            c.restore();
          }
        }
        function LP_passa(x) { const k = 1.5; x = Math.min(1, Math.max(0, x)) - 1; return 1 + (k + 1) * x * x * x + k * x * x; }
