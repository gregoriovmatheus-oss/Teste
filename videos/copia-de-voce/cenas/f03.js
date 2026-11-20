/*META {"imports": ["copia"], "rotulos": [{"de": 1.6, "ate": 3.3, "texto": "<span class=\"k\">NO CORPO HUMANO</span><br><span class=\"y\">30 trilhões</span> de células"}, {"de": 3.35, "ate": 5.56, "texto": "As mesmas, <span class=\"y\">uma por uma</span>"}], "D0": 5.56} */
        // Zoom dos dois corpos (nuvens de células fluorescentes, um espelho do outro) até o mar de células do braço.
        const st = T.createToyStage(canvas, { ceu: "#04060d", nevoa: null, fov: 40, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.bloom = 0.85;
        await COPIA.fontes();
        // textura de célula fluorescente: membrana + núcleo
        const ct = document.createElement("canvas"); ct.width = ct.height = 128;
        { const g = ct.getContext("2d");
          let gr = g.createRadialGradient(64, 64, 30, 64, 64, 62); gr.addColorStop(0, "rgba(255,255,255,0.05)"); gr.addColorStop(0.75, "rgba(255,255,255,0.55)"); gr.addColorStop(0.9, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)");
          g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 62, 0, 6.283); g.fill();
          gr = g.createRadialGradient(58, 60, 0, 60, 62, 24); gr.addColorStop(0, "rgba(150,190,255,1)"); gr.addColorStop(1, "rgba(90,120,255,0)");
          g.fillStyle = gr; g.beginPath(); g.arc(60, 62, 24, 0, 6.283); g.fill(); }
        const tex = new THREE.CanvasTexture(ct); tex.colorSpace = THREE.SRGBColorSpace;
        const partes = [[0, 1.2, 0, 0.27, 0.36, 0.2, 1], [0, 1.76, 0, 0.2, 0.22, 0.2, 1], [0.11, 0.44, 0, 0.1, 0.44, 0.1, 1], [-0.11, 0.44, 0, 0.1, 0.44, 0.1, 1],
          [0.32, 1.14, 0, 0.075, 0.33, 0.075, 4], [-0.32, 1.14, 0, 0.075, 0.33, 0.075, 4]];
        const vol = partes.map((p) => p[3] * p[4] * p[5] * p[6]), tot = vol.reduce((a, b) => a + b, 0);
        const rr = mulberry32(303), base = [];
        partes.forEach((p, k) => {
          const n = Math.round((7000 * vol[k]) / tot);
          for (let i = 0; i < n; i++) {
            let x, y, z; do { x = rr() * 2 - 1; y = rr() * 2 - 1; z = rr() * 2 - 1; } while (x * x + y * y + z * z > 1);
            base.push([p[0] + x * p[3], p[1] + y * p[4], p[2] + z * p[5], rr() * 6.283, rr(), k]);
          }
        });
        const N = base.length, pos = new Float32Array(N * 6), col = new Float32Array(N * 6);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
        const cor1 = new THREE.Color(0xff6f9e), cor2 = new THREE.Color(0xffb36b), cc = new THREE.Color();
        base.forEach((b, i) => { cc.copy(cor1).lerp(cor2, b[4] * 0.6); for (const j of [i, i + N]) { col[j * 3] = cc.r * 0.8; col[j * 3 + 1] = cc.g * 0.8; col[j * 3 + 2] = cc.b * 0.8; } });
        const mat = new THREE.PointsMaterial({ size: 0.034, map: tex, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, toneMapped: false });
        const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; S.add(pts);
        // pares para ligar "uma por uma": células do braço direito de você (de frente para a câmera)
        const pares = [];
        base.forEach((b, i) => { if (b[5] === 4 && b[2] > 0.01 && b[1] > 1.0 && b[1] < 1.24 && pares.length < 14) pares.push(i); });
        const P = (i, t, out) => { const b = base[i % N], m = i >= N; const dx = Math.sin(t * 0.9 + b[3]) * 0.004, dy = Math.cos(t * 0.7 + b[3]) * 0.004;
          return out.set(m ? 0.45 - (b[0] + dx) : -0.45 + b[0] + dx, b[1] + dy, b[2]); };
        const v = new THREE.Vector3(), v2 = new THREE.Vector3();
        const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        function render(t) {
          for (let i = 0; i < 2 * N; i++) { P(i, t, v); pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z; }
          geo.attributes.position.needsUpdate = true;
          // zoom: dos dois corpos inteiros até o vão entre os braços (um espelho do outro)
          const e = ease.inOutCubic(range(t, 0.3, 3.4)), e2 = range(t, 3.4, 5.56);
          const d = lerp(6.4, 0.95, e) - e2 * 0.12;
          cam.position.set(Math.sin(t * 0.25) * 0.05 * (1 - e), lerp(1.05, 1.13, e), d);
          cam.lookAt(0, lerp(1.0, 1.12, e), 0);
          cam.rotateZ(lerp(-0.04, 0.03, e));
          st.draw();
          const c = st.ctx, a = COPIA.vis(st);
          COPIA.tag(c, cam, v.set(-0.45, 2.0, 0), "VOCÊ", { a: a * range(t, 0.15, 0.4) * (1 - range(t, 1.2, 1.5)), dx: -60, dy: -110 });
          COPIA.tag(c, cam, v.set(0.45, 2.0, 0), "CÓPIA", { cor: COPIA.LARANJA, a: a * range(t, 0.15, 0.4) * (1 - range(t, 1.2, 1.5)), dx: 60, dy: -110 });
          // contador de células
          const k = ease.outCubic(range(t, 1.63, 2.6)), ca = a * range(t, 1.5, 1.7) * (1 - range(t, 3.2, 3.4));
          COPIA.txt(c, "CÉLULAS · VOCÊ", 540, 560, { tam: 24, cor: COPIA.AZUL, a: ca });
          COPIA.txt(c, fmt(k * 3e13), 540, 610, { tam: 46, a: ca, esp: 0.04 });
          // ligações célula a célula, uma por uma
          for (let j = 0; j < pares.length; j++) {
            const aj = a * range(t, 3.45 + j * 0.11, 3.6 + j * 0.11);
            if (aj <= 0) continue;
            const [x1, y1] = COPIA.proj(P(pares[j], t, v), cam), [x2, y2] = COPIA.proj(P(pares[j] + N, t, v2), cam);
            c.save(); c.globalAlpha = aj * 0.85; c.strokeStyle = COPIA.AZUL; c.lineWidth = 2; c.setLineDash([8, 6]);
            c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.setLineDash([]);
            c.fillStyle = COPIA.AZUL; for (const [x, y] of [[x1, y1], [x2, y2]]) { c.beginPath(); c.arc(x, y, 5, 0, 6.283); c.fill(); }
            c.restore();
            COPIA.txt(c, "=", (x1 + x2) / 2, (y1 + y2) / 2 - 2, { tam: 26, cor: "#fff", a: aj });
          }
        }
