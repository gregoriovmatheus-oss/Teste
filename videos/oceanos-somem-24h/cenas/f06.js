/*META {"imports": ["oceano"], "rotulos": [{"de": 1.95, "ate": 2.95, "texto": "<span class=\"k\">FOSSA DAS MARIANAS</span><br>Quase <span class=\"y\">11.000 m</span>"}, {"de": 3.05, "ate": 5.0, "sai": false, "texto": "<span class=\"k\">EVEREST</span><br><span class=\"y\">8.849 m</span><br>cabe inteiro"}], "D0": 5.0} */
        const O = OCEANO, G0 = 25.37;
        try { await document.fonts.load('500 26px "JetBrains Mono"'); } catch (e) {}
        // diorama em corte da Fossa das Marianas. 1 unidade = 100 m (sem exagero vertical). Nível do mar = y 0.
        const st = T.createToyStage(canvas, { fov: 45, ceu: ["#2f5583", "#c9b394"], nevoa: [300, 1400], corNevoa: "#a49783", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        const PF = [[-260, -30], [-175, 7], [-145, -4], [-115, -20], [-65, -38], [-28, -62], [-4, -101], [10, -109.4], [24, -101], [50, -72], [82, -56], [130, -60], [260, -62]];
        const perfil = (x) => {
          if (x <= PF[0][0]) return PF[0][1];
          for (let i = 1; i < PF.length; i++) if (x <= PF[i][0]) { const [a, ya] = PF[i - 1], [b, yb] = PF[i]; return lerp(ya, yb, smoothstep(0, 1, (x - a) / (b - a))); }
          return PF[PF.length - 1][1];
        };
        const ZF = 70;
        const alt = (x, z) => perfil(x) + 1.6 * O.fbm(x * 0.05, z * 0.05, 3, 51);
        const cor = (x, z, y, c) => O.mistura(c, 0x8b7a63, 0x3a3330, smoothstep(-40, -105, y) + 0.12 * O.ruido(x * 0.1, z * 0.1, 52));
        S.add(O.terreno({ w: 520, d: 2 * ZF, sx: 130, sz: 30, alt, cor }));
        // face do corte (estratos): faixas abaixo da superfície
        const NX = 130, faixas = [0, 2.5, 6, 11, 20, 34, 60], cores = [0x9b8668, 0x7d6a54, 0x5e5249, 0x4a4241, 0x3a3436, 0x2c2829, 0x221f20];
        const fp = [], fc = [], fi = [], cT = new THREE.Color();
        for (let i = 0; i <= NX; i++) {
          const x = -260 + (520 * i) / NX, y0 = alt(x, ZF);
          faixas.forEach((dz, k) => { fp.push(x, Math.max(-280, y0 - dz - (k ? 1.5 * Math.sin(x * 0.05 + k) : 0)), ZF); cT.setHex(cores[k]); fc.push(cT.r, cT.g, cT.b); });
          fp.push(x, -280, ZF); cT.setHex(0x1a1718); fc.push(cT.r, cT.g, cT.b);
        }
        const NR = faixas.length + 1;
        for (let i = 0; i < NX; i++) for (let k = 0; k < NR - 1; k++) { const a = i * NR + k, b = a + 1, c2 = a + NR, d = c2 + 1; fi.push(a, b, c2, b, d, c2); }
        const fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.Float32BufferAttribute(fp, 3)); fg.setAttribute("color", new THREE.Float32BufferAttribute(fc, 3)); fg.setIndex(fi); fg.computeVertexNormals();
        const face = new THREE.Mesh(fg, T.TOON({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide })); S.add(face);
        // nível do mar (0 m)
        const mar = new THREE.Mesh(new THREE.PlaneGeometry(520, 2 * ZF), new THREE.MeshBasicMaterial({ color: 0x55b0ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
        mar.rotation.x = -Math.PI / 2; S.add(mar);
        const borda = new THREE.Mesh(new THREE.BoxGeometry(520, 0.6, 0.6), new THREE.MeshBasicMaterial({ color: 0x9fd8ff })); borda.position.set(0, 0, ZF + 0.5); S.add(borda);
        // linha da profundidade máxima
        const fundoL = new THREE.Mesh(new THREE.BoxGeometry(150, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0xffc56b })); fundoL.position.set(60, -109.4, ZF + 1); S.add(fundoL);
        // Everest (8.849 m) em silhueta na frente do corte
        const ev = new THREE.ConeGeometry(34, 88.49, 22, 10, false); ev.translate(0, 88.49 / 2, 0);
        { const p = ev.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
          for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const r = Math.hypot(x, z); if (r > 0.01 && y < 88) { const k = 1 + 0.18 * O.ruido(Math.atan2(z, x) * 3, y * 0.08, 61); p.setX(i, x * k); p.setZ(i, z * k); }
            O.mistura(c, 0x6d6a6e, 0xf4f6fa, smoothstep(52, 66, y + 6 * O.ruido(x * 0.2, z * 0.2, 62))); col.set([c.r, c.g, c.b], i * 3); }
          ev.setAttribute("color", new THREE.BufferAttribute(col, 3)); ev.computeVertexNormals(); }
        const everest = new THREE.Mesh(ev, T.TOON({ vertexColors: true, roughness: 0.8, flatShading: true })); everest.scale.set(0.6, 1, 0.3); everest.castShadow = true; S.add(everest);
        function render(t) {
          const k = ease.outCubic(range(t, 2.95, 3.95));
          everest.position.set(10, lerp(40, -109.4, k), ZF + 12);
          everest.visible = t > 2.9;
          const e = ease.inOutCubic(range(t, 0, 2.8));
          cam.position.set(lerp(70, 18, e), lerp(30, -48, e), lerp(130, 330, e) + t * 4);
          cam.lookAt(lerp(10, 12, e), lerp(-95, -56, e), lerp(0, 0, e));
          st.sol(0, 0, 260);
          st.draw();
          const ctx = st.ctx;
          O.etiqueta(ctx, cam, new THREE.Vector3(-60, 0, ZF), "NÍVEL DO MAR · 0 m", { dx: -40, dy: -80, tam: 26, a: range(t, 0.3, 0.7) });
          O.etiqueta(ctx, cam, new THREE.Vector3(10, -109.4, ZF), "−10.935 m", { dx: 90, dy: 80, tam: 30, a: range(t, 1.9, 2.3) - range(t, 3.6, 3.9) });
          O.etiqueta(ctx, cam, new THREE.Vector3(10, -20.9, ZF + 12), "TOPO DO EVEREST · −2.086 m", { dx: 60, dy: -70, tam: 24, a: range(t, 3.9, 4.2), sub: "ainda 2 km abaixo do nível do mar" });
        }
