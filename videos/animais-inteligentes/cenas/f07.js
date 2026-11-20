/*META {"imports": ["mente"], "rotulos": [{"de": 0.15, "ate": 1.85, "texto": "Com uma<br><span class=\"y\">mente humana</span>"}, {"de": 1.95, "ate": 3.0, "texto": "<span class=\"y\">Línguas</span>, regras"}, {"de": 3.05, "ate": 4.33, "texto": "e talvez<br><span class=\"y\">tecnologia</span>"}], "D0": 4.33} */
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#2a3354", "#e39a62"], nevoa: [8, 60], corNevoa: "#b78764", luz: 0.85, nuvens: 6 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.7;
        const rr = mulberry32(71);
        const chao = T.mesh(new THREE.PlaneGeometry(200, 200), 0x6d6a48, S, 0.95); chao.rotation.x = -Math.PI / 2; chao.castShadow = false;
        // laje de pedra com símbolos sendo riscados (textura emissiva redesenhada a cada quadro)
        const tc = document.createElement("canvas"); tc.width = 512; tc.height = 512; const gx = tc.getContext("2d");
        const tex = new THREE.CanvasTexture(tc); tex.colorSpace = THREE.SRGBColorSpace;
        const pedra = new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: 0.95, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 1.4 });
        const lg = new THREE.BoxGeometry(2.2, 2.6, 0.35, 8, 8, 1);
        { const p = lg.attributes.position; for (let i = 0; i < p.count; i++) if (Math.abs(p.getZ(i)) < 0.17) continue; else p.setZ(i, p.getZ(i) + Math.sin(p.getX(i) * 4 + p.getY(i) * 3) * 0.02); lg.computeVertexNormals(); }
        const laje = new THREE.Mesh(lg, [pedra, pedra, pedra, pedra, pedra, T.M(0x8a8378, 0.95)]); laje.castShadow = laje.receiveShadow = true;
        // só a face da frente (+z, índice 4) recebe a textura: as outras usam um material liso
        const liso = T.M(0x7f786d, 0.95); laje.material = [liso, liso, liso, liso, pedra, liso];
        laje.position.set(0, 1.3, 0); laje.rotation.y = 0.25; S.add(laje);
        // glifos: cada um é um conjunto de traços numa grade 3x3 (determinístico)
        const GL = [];
        for (let gi = 0; gi < 16; gi++) {
          const n = 2 + Math.floor(rr() * 3), tr = [];
          for (let k = 0; k < n; k++) { const a = [Math.floor(rr() * 3), Math.floor(rr() * 3)], b = [Math.floor(rr() * 3), Math.floor(rr() * 3)]; if (a[0] === b[0] && a[1] === b[1]) b[0] = (b[0] + 1) % 3; tr.push([a, b]); }
          if (rr() < 0.4) tr.push(["o", [Math.floor(rr() * 3), Math.floor(rr() * 3)]]);
          GL.push(tr);
        }
        function glifos(k) { // k = quantos glifos (fracionário) já riscados
          gx.fillStyle = "#000"; gx.fillRect(0, 0, 512, 512);
          gx.lineCap = "round"; gx.lineJoin = "round";
          GL.forEach((tr, gi) => {
            const p = clamp(k - gi); if (p <= 0) return;
            const cx = 70 + (gi % 4) * 124, cy = 60 + Math.floor(gi / 4) * 120, s = 36;
            const novo = clamp(1 - (k - gi - 1) / 2);
            gx.strokeStyle = `rgba(255,${Math.round(150 + 60 * (1 - novo))},${Math.round(90 + 120 * (1 - novo))},1)`;
            gx.shadowColor = "#ff8a4c"; gx.shadowBlur = 14 * novo; gx.lineWidth = 7;
            tr.forEach((s2, si) => {
              const q = clamp(p * tr.length - si); if (q <= 0) return;
              if (s2[0] === "o") { gx.beginPath(); gx.arc(cx + (s2[1][0] - 1) * s, cy + (s2[1][1] - 1) * s, 9, 0, 6.283 * q); gx.stroke(); return; }
              const [a, b] = s2, x0 = cx + (a[0] - 1) * s, y0 = cy + (a[1] - 1) * s, x1 = cx + (b[0] - 1) * s, y1 = cy + (b[1] - 1) * s;
              gx.beginPath(); gx.moveTo(x0, y0); gx.lineTo(lerp(x0, x1, q), lerp(y0, y1, q)); gx.stroke();
            });
          });
          gx.shadowBlur = 0; tex.needsUpdate = true;
        }
        // corvo riscando a pedra com uma pedrinha
        const cv = MENTE.corvo(); cv.group.position.set(-0.75, 0, 0.55); cv.group.rotation.y = 0.45; cv.group.scale.setScalar(1.6); S.add(cv.group);
        // ao fundo: a "vila" dos corvos numa árvore grande, com casinhas de galhos que acendem + uma roda d'água girando
        const arv = new THREE.Group(); arv.position.set(3.5, 0, -9); S.add(arv);
        T.mesh(new THREE.CylinderGeometry(0.5, 0.9, 7, 10), 0x5a4330, arv, 0.9).position.y = 3.5;
        const galhos = [];
        for (let i = 0; i < 7; i++) {
          const a = i * 2.2, h = 2.8 + i * 0.6, L = 2.6 - i * 0.15;
          const gr = T.mesh(new THREE.CylinderGeometry(0.1, 0.18, L, 6), 0x5a4330, arv, 0.9);
          gr.position.set(Math.cos(a) * L / 2, h + 0.4, Math.sin(a) * L / 2); gr.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1);
          galhos.push([Math.cos(a) * L * 0.85, h + 0.8, Math.sin(a) * L * 0.85]);
        }
        for (let i = 0; i < 6; i++) { const c = T.mesh(T.SPH, 0x4c6b34, arv, 0.9); c.scale.set(2.2 + rr(), 1.2 + rr() * 0.6, 2 + rr()); c.position.set((rr() - 0.5) * 3, 7.2 + rr() * 1.4, (rr() - 0.5) * 3); }
        const luzes = galhos.map(([x, y, z], i) => {
          const casa = T.mesh(new THREE.ConeGeometry(0.42, 0.55, 7), 0x7a5a3a, arv, 0.95); casa.position.set(x, y + 0.25, z);
          const base = T.mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.35, 7), 0x8a6a46, arv, 0.95); base.position.set(x, y - 0.12, z);
          const l = MENTE.glow(0xffc070, 0.9, 0); l.position.set(x, y, z + 0.1); arv.add(l);
          const c2 = MENTE.corvo({ fase: i * 0.3 }); MENTE.leve(c2.group); c2.group.scale.setScalar(1.4); c2.group.position.set(x + 0.5, y - 0.3, z + 0.2); c2.group.rotation.y = rr() * 6; arv.add(c2.group);
          return { l, c2, k: i };
        });
        const roda = new THREE.Group(); roda.position.set(-2.5, 1.1, -5.5); S.add(roda);
        T.mesh(new THREE.TorusGeometry(1, 0.06, 6, 24), 0x6b5038, roda, 0.9);
        for (let i = 0; i < 8; i++) { const p = T.mesh(new THREE.BoxGeometry(0.08, 2, 0.35), 0x7b5b3e, roda, 0.9); p.rotation.z = i * Math.PI / 8; }
        const bando = T.bando(S, { n: 10, seed: 72, cor: 0x141419 });
        function render(t) {
          glifos(ease.inOutSine(range(t, 0.2, 3.3)) * 16);
          const cab = Math.abs(Math.sin(t * 6)) * 0.25 * (t < 3.3 ? 1 : 0);
          cv.update(t, { cabeca: -0.3 - cab, vira: 0.2 });
          const tec = range(t, 3.3, 3.9);
          luzes.forEach(({ l, c2, k }) => { l.material.opacity = clamp(tec * 2 - k * 0.15) * (0.85 + 0.15 * Math.sin(t * 7 + k)); c2.update(t, { cabeca: Math.sin(t + k) * 0.2 }); });
          roda.rotation.z = -t * 1.4;
          bando.update(t, [2 + t * 1.5, 8.5, -10], [4, 1, 2], 0.2, 0.9);
          // câmera: rente à laje (glifos acendendo) → recua e sobe mostrando a vila na árvore
          const e = ease.inOutCubic(range(t, 1.6, 4.33)), e0 = range(t, 0, 4.33);
          cam.position.set(lerp(0.2, -1.8, e), lerp(1.2, 2.6, e), lerp(4.2, 8.4, e) - e0 * 0.3);
          cam.lookAt(lerp(-0.2, 1.6, e), lerp(1.05, 3.8, e), lerp(0, -5, e));
          st.sol(1, -3, 14);
          st.draw();
        }
