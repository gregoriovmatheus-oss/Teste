/*META {"imports": ["oceano", "terra"], "rotulos": [{"de": 0.95, "ate": 4.2, "texto": "<span class=\"k\">OXIGÊNIO NO AR</span><br><span class=\"y\">~21%</span><br>e estável"}, {"de": 4.4, "ate": 6.2, "sai": false, "texto": "<span class=\"k\">EM 24 HORAS</span><br>Quase <span class=\"y\">nada muda</span>"}, {"de": 0.95, "ate": 6.2, "texto": "<span class=\"chip le\">● Lento<small>estoque enorme</small></span>", "sai": false}], "css": "    .chip{display:inline-block;font-family:\"JetBrains Mono\",\"Menlo\",monospace;font-weight:500;font-size:28px;letter-spacing:.14em;line-height:1.1;padding:14px 26px;border-radius:6px;text-shadow:none;text-transform:uppercase;background:rgba(4,8,16,.62);text-align:left}.chip.im{color:#ff8a4c;border:2px solid #ff8a4c}.chip.le{color:#7cc8ff;border:2px solid #7cc8ff}.chip.di{color:#ffd28a;border:2px solid #ffd28a}.chip small{display:block;font-size:20px;color:rgba(255,255,255,.8);letter-spacing:.1em;margin-top:6px}#f09-r3{top:1262px!important;height:110px;left:0;right:0;justify-content:center;align-items:flex-start}\n", "D0": 6.21} */
        const O = OCEANO, G0 = 41.57;
        try { await document.fonts.load('500 26px "JetBrains Mono"'); } catch (e) {}
        const st = T.createToyStage(canvas, { fov: 45, ceu: ["#000000", "#02030a"], nuvens: 0, nevoa: null });
        const S = st.scene, cam = st.cam;
        // Sol logo acima do horizonte: a Terra seca em contraluz, a atmosfera acesa na borda
        const { E } = await O.espacoDoc(st, TERRA, { solDir: [0.42, 0.6, -0.68], solRaio: 5 });
        E.u.seco.value = 1; E.u.nuvens.value = 0.5; E.u.atmo.value = 1.4; st.bloom = 0.85;
        // moléculas do ar: 78% N2 (azul-acinzentado), 21% O2 (vermelho)
        const NM = 340, rr = mulberry32(91), mol = [];
        for (let i = 0; i < NM; i++) mol.push({ p: new THREE.Vector3((rr() - 0.5) * 0.9, (rr() - 0.5) * 1.5, -0.25 - rr() * 0.9), o2: rr() < 0.21, a: rr() * 6.28, f: 0.5 + rr(), ax: new THREE.Vector3(rr() - 0.5, rr() - 0.5, rr() - 0.5).normalize() });
        const mk = (cor, n) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 6), 3));
          const p = new THREE.Points(g, new THREE.PointsMaterial({ color: cor, size: 0.016, map: O.texPonto(), transparent: true, depthWrite: false, opacity: 0.95 })); cam.add(p); return p; };
        S.add(cam);
        const pN = mk(0x8a94a6, NM), pO = mk(0x7cc8ff, NM);
        const off = new THREE.Vector3();
        function render(t) {
          const u = t / D;
          E.aim(lerp(20, 34, u), lerp(-10, -4, u)); E.nuv.rotation.y = t * 0.01;
          cam.position.set(lerp(-0.08, 0.06, u), 0, lerp(1.52, 1.42, ease.inOutSine(u)));
          cam.up.set(0, 1, 0);
          cam.lookAt(cam.position.x * 0.5, lerp(1.13, 1.2, u), cam.position.z - 1);
          const aN = pN.geometry.attributes.position, aO = pO.geometry.attributes.position;
          let iN = 0, iO = 0;
          for (const m of mol) {
            const x = m.p.x + Math.sin(t * m.f + m.a) * 0.03 + t * 0.012, y = m.p.y + Math.cos(t * m.f * 0.8 + m.a) * 0.03, z = m.p.z;
            off.copy(m.ax).multiplyScalar(0.007).applyAxisAngle(new THREE.Vector3(0, 0, 1), t * 3 * m.f);
            const a = m.o2 ? aO : aN, i = m.o2 ? iO++ : iN++;
            a.setXYZ(2 * i, x + off.x, y + off.y, z + off.z); a.setXYZ(2 * i + 1, x - off.x, y - off.y, z - off.z);
          }
          pN.geometry.setDrawRange(0, iN * 2); pO.geometry.setDrawRange(0, iO * 2);
          aN.needsUpdate = aO.needsUpdate = true;
          st.draw();
          const ctx = st.ctx, h = O.horaEm(G0 + t);
          // barra da composição do ar: não muda enquanto o relógio corre
          const a = range(t, 0.8, 1.2);
          if (a > 0) {
            ctx.save(); ctx.globalAlpha = a;
            const X = 70, Y0 = 520, HB = 290, W = 54;
            ctx.fillStyle = "rgba(6,10,18,0.66)"; ctx.beginPath(); ctx.roundRect(X - 18, Y0 - 56, W + 210, HB + 96, 14); ctx.fill();
            ctx.font = '500 19px "JetBrains Mono", monospace'; ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
            ctx.fillText("COMPOSIÇÃO DO AR", X, Y0 - 28);
            const seg = [[0.78, "#5d6676", "N₂ 78%"], [0.21, "#7cc8ff", "O₂ 21%"], [0.01, "#cfcfcf", ""]];
            let y = Y0 + HB;
            for (const [f, c, l] of seg) {
              const hh = f * HB; ctx.fillStyle = c; ctx.fillRect(X, y - hh, W, hh);
              if (l) { ctx.font = l.startsWith("O") ? '600 34px "JetBrains Mono", monospace' : '600 26px "JetBrains Mono", monospace'; ctx.fillStyle = c; ctx.fillText(l, X + W + 16, y - hh / 2); }
              y -= hh;
            }
            ctx.font = '500 19px "JetBrains Mono", monospace'; ctx.fillStyle = "#9fe3a8";
            ctx.fillText("● ESTÁVEL · " + String(Math.floor(h)).padStart(2, "0") + " H", X, Y0 + HB + 22);
            ctx.restore();
          }
        }
