/*META {"imports": ["oceano"], "rotulos": [{"de": 2.2, "ate": 5.7, "texto": "<span class=\"k\">CICLO DA ÁGUA</span><br><span class=\"y\">86%</span><br>da evaporação"}, {"de": 5.85, "ate": 7.0, "sai": false, "texto": "<span class=\"k\">EVAPORAÇÃO</span><br>Ela <span class=\"y\">para</span>"}, {"de": 5.85, "ate": 7.0, "texto": "<span class=\"chip im\">● Imediato<small>evaporação</small></span>", "sai": false}], "css": "    .chip{display:inline-block;font-family:\"JetBrains Mono\",\"Menlo\",monospace;font-weight:500;font-size:28px;letter-spacing:.14em;line-height:1.1;padding:14px 26px;border-radius:6px;text-shadow:none;text-transform:uppercase;background:rgba(4,8,16,.62);text-align:left}.chip.im{color:#ff8a4c;border:2px solid #ff8a4c}.chip.le{color:#7cc8ff;border:2px solid #7cc8ff}.chip.di{color:#ffd28a;border:2px solid #ffd28a}.chip small{display:block;font-size:20px;color:rgba(255,255,255,.8);letter-spacing:.1em;margin-top:6px}#f10-r3{top:1262px!important;height:110px;left:0;right:0;justify-content:center;align-items:flex-start}\n", "D0": 7.02} */
        const O = OCEANO, G0 = 47.78, TP = 5.83;
        try { await document.fonts.load('500 26px "JetBrains Mono"'); } catch (e) {}
        // diagrama 3D do ciclo da água: bacia oceânica (seca) à esquerda, continente à direita, nuvens em cima
        const st = T.createToyStage(canvas, { fov: 42, ceu: ["#1d3557", "#8fa9c2"], nevoa: [300, 900], corNevoa: "#6f87a3", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        const ZF = 22;
        const alt = (x, z) => {
          const bacia = -13 * Math.exp(-(((x + 24) / 22) ** 2)) * smoothstep(12, -4, x);
          const terra = x > 8 ? 2 + 15 * smoothstep(20, 52, x) * (0.6 + 0.4 * O.ruido(x * 0.1, z * 0.1, 101)) : 0;
          return bacia + terra + 0.8 * O.fbm(x * 0.08, z * 0.08, 3, 102);
        };
        const cor = (x, z, y, c) => { if (x > 8) O.mistura(c, 0x5d7a3c, 0x8a7d5a, (y - 2) / 14); else O.mistura(c, 0xb39a74, 0x5d4f42, -y / 12); };
        S.add(O.terreno({ w: 120, d: 2 * ZF, sx: 90, sz: 30, alt, cor }));
        // face do corte
        { const fp = [], fc = [], fi = [], c = new THREE.Color(), N = 90;
          for (let i = 0; i <= N; i++) { const x = -60 + (120 * i) / N, y = alt(x, ZF); fp.push(x, y, ZF, x, -26, ZF); c.setHex(0x6b5846); fc.push(c.r, c.g, c.b); c.setHex(0x2a2320); fc.push(c.r, c.g, c.b); }
          for (let i = 0; i < N; i++) fi.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
          const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(fp, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(fc, 3)); g.setIndex(fi); g.computeVertexNormals();
          S.add(new THREE.Mesh(g, T.TOON({ vertexColors: true, roughness: 0.9 }))); }
        // nuvens
        const nuv = [[-30, 36, -4, 5], [-12, 39, 2, 4.2], [12, 37, -2, 4.6], [34, 35, 2, 4.4]].map(([x, y, z, s], i) => { const n = T.nuvem(300 + i, 0xe9eef3); n.scale.setScalar(s); n.position.set(x, y, z); S.add(n); return n; });
        // setas: curvas + cabeça
        const seta = (pts, raio, cor) => {
          const curva = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
          const mat = new THREE.MeshStandardMaterial({ color: cor, emissive: cor, emissiveIntensity: 0.55, roughness: 0.4, transparent: true, opacity: 0.95 });
          const tubo = new THREE.Mesh(new THREE.TubeGeometry(curva, 48, raio, 8, false), mat);
          const cab = new THREE.Mesh(new THREE.ConeGeometry(raio * 2.6, raio * 5, 12), mat);
          S.add(tubo, cab);
          const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(24 * 3), 3));
          const pts2 = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, map: O.texPonto(), transparent: true, depthWrite: false })); S.add(pts2);
          return { curva, tubo, cab, mat, pts2, cor0: new THREE.Color(cor) };
        };
        const evO = [[-44, -6], [-26, -11], [-8, -6]].map(([x, y]) => seta([[x, y + 1, 4], [x + 3, y + 16, 4], [x + 8, 30, 3]], 1.3, 0x7cc8ff));
        const evT = seta([[36, 12, 4], [37, 22, 4], [38, 30, 3]], 0.55, 0x9fe0a0);
        const chuva = seta([[18, 31, 6], [20, 20, 6], [22, 8, 6]], 0.45, 0x3f6fb0);
        const cinza = new THREE.Color(0x6b6f75), _q = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
        const fluxo = (t) => (t < TP ? t : TP + 0.4 * (1 - Math.exp(-(t - TP) / 0.25)));
        function atualiza(s, t, para) {
          const k = para ? ease.inOutCubic(range(t, TP, TP + 0.9)) : 0;
          const n = s.tubo.geometry.index.count, keep = 1 - k * 0.92;
          s.tubo.geometry.setDrawRange(0, Math.floor((n / 6) * keep) * 6);
          const pe = s.curva.getPointAt(Math.max(0.02, keep)), tg = s.curva.getTangentAt(Math.max(0.02, keep));
          s.cab.position.copy(pe); s.cab.quaternion.setFromUnitVectors(up, tg);
          s.mat.color.copy(s.cor0).lerp(cinza, k); s.mat.emissive.copy(s.cor0).lerp(cinza, k).multiplyScalar(1 - 0.8 * k);
          s.mat.opacity = 0.95 - 0.5 * k;
          const tt = para ? fluxo(t) : t, a = s.pts2.geometry.attributes.position;
          for (let i = 0; i < 24; i++) { const f = ((i / 24 + tt * 0.45) % 1) * keep; s.curva.getPointAt(f, _q); a.setXYZ(i, _q.x, _q.y, _q.z); }
          a.needsUpdate = true; s.pts2.material.opacity = 1 - k;
        }
        function render(t) {
          evO.forEach((s) => atualiza(s, t, true));
          atualiza(evT, t, false); atualiza(chuva, t, false);
          nuv.forEach((n, i) => { n.position.x += 0; n.scale.setScalar((i < 2 ? lerp(5, 3.4, range(t, TP, 7)) : 4.4) + Math.sin(t + i) * 0.1); });
          const u = t / D, an = lerp(-0.42, 0.22, ease.inOutSine(u)), R = lerp(205, 175, u);
          cam.position.set(Math.sin(an) * R, lerp(40, 26, u), Math.cos(an) * R);
          cam.lookAt(0, 6, 0);
          st.sol(0, 0, 90);
          st.draw();
          const ctx = st.ctx;
          O.etiqueta(ctx, cam, new THREE.Vector3(-22, 18, 4), "86%  DOS OCEANOS", { dx: -60, dy: 240, tam: 30, destaque: "#7cc8ff", a: range(t, 2.2, 2.6) - range(t, TP, TP + 0.3) });
          O.etiqueta(ctx, cam, new THREE.Vector3(37, 24, 4), "14%  DOS CONTINENTES", { dx: -20, dy: 300, tam: 24, destaque: "#9fe0a0", a: range(t, 3.0, 3.4) });
          O.etiqueta(ctx, cam, new THREE.Vector3(-24, -11, ZF), "BACIA SECA", { dx: -40, dy: 120, tam: 24, a: range(t, 0.3, 0.7) });
          O.etiqueta(ctx, cam, new THREE.Vector3(-22, 14, 4), "EVAPORAÇÃO PAROU", { dx: -40, dy: 240, tam: 30, destaque: "#ff8a4c", a: range(t, TP + 0.3, TP + 0.6) });
        }
