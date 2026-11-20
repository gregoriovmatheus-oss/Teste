/*META {"imports": ["mente"], "rotulos": [{"de": 3.6, "ate": 5.33, "texto": "Tudo junto,<br><span class=\"y\">sem pausa</span>"}], "D0": 5.33} */
        const st = T.createToyStage(canvas, { fov: 50, ceu: ["#03040a", "#0a0c18"], nevoa: [10, 60], corNevoa: "#05060c", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        const R = mulberry32(901), NT = 7000;
        const tp = new Float32Array(NT * 3), tc = new Float32Array(NT * 3), TP = [];
        for (let i = 0; i < NT; i++) {
          const q = R(), cor = q < 0.45 ? MENTE.COR.laranja : q < 0.85 ? MENTE.COR.azul : MENTE.COR.branco;
          TP.push([R() * 6.283, 2.2 + R() * 2.4, -80 + R() * 90, 0.3 + R() * 0.9]);
          const b = 0.35 + R() * 0.65; tc[i * 3] = cor[0] * b; tc[i * 3 + 1] = cor[1] * b; tc[i * 3 + 2] = cor[2] * b;
        }
        const tg = new THREE.BufferGeometry(); tg.setAttribute("position", new THREE.BufferAttribute(tp, 3)); tg.setAttribute("color", new THREE.BufferAttribute(tc, 3));
        S.add(new THREE.Points(tg, new THREE.PointsMaterial({ map: MENTE.glowTex(), size: 0.16, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: true })));
        // posição da câmera ao longo do túnel (acelera em "tudo junto")
        const zc = (t) => -(t * 2.2 + Math.pow(range(t, 3.5, 5.33), 2) * 9);
        const CAT = [["MEDO · E SE EU CAIR?", 0.91, MENTE.LARANJA], ["CONTA · R$ 248,90", 1.28, MENTE.AZUL], ["MÚSICA · LA LA LA LA", 1.71, "#ffd27a"], ["MEDO · ELE VAI DESCOBRIR", 2.1, MENTE.LARANJA], ["LEMBRANÇA · O CHEIRO DA VÓ", 2.74, "#e9d8ff"]];
        const PEN = MENTE.PENS, chips = [];
        CAT.forEach(([s, t0, cor], k) => chips.push({ s, t0, cor, p: new THREE.Vector3((k % 2 ? 1 : -1) * (0.8 + R() * 0.6), (R() - 0.3) * 1.4, zc(t0) - 7) }));
        for (let k = 0; k < 22; k++) { const t0 = 3.63 + k * 0.07; chips.push({ s: PEN[k % PEN.length], t0, cor: k % 2 ? MENTE.LARANJA : MENTE.AZUL, p: new THREE.Vector3((R() - 0.5) * 4.4, (R() - 0.5) * 3.2, zc(t0) - 6 - R() * 8), emb: true, seed: k }); }
        function render(t) {
          const sp = 1 + 3 * range(t, 3.5, 5.0);
          TP.forEach(([a, r, z, v], i) => { const w = a + t * v * sp * 0.6 + z * 0.05; tp[i * 3] = Math.cos(w) * r; tp[i * 3 + 1] = Math.sin(w) * r; tp[i * 3 + 2] = z; });
          tg.attributes.position.needsUpdate = true;
          st.bloom = 0.9;
          st.vel = 0.25 + 0.55 * range(t, 3.6, 4.4); st.velT = t;
          cam.position.set(Math.sin(t * 0.7) * 0.3, Math.cos(t * 0.5) * 0.2, zc(t));
          cam.lookAt(Math.sin(t * 0.7 + 0.4) * 0.5, 0, zc(t) - 10);
          cam.rotateZ(t * 0.12 + range(t, 3.6, 5.3) * 0.5);
          st.draw();
          const c = st.ctx, vv = MENTE.vis(st); MENTE.quadro();
          chips.forEach((h) => {
            if (t < h.t0) return;
            const dz = cam.position.z - h.p.z; if (dz < 1.2) return;
            const a = range(t, h.t0, h.t0 + 0.15) * range(dz, 1.2, 2.5) * vv;
            const s = h.emb ? MENTE.embaralha(h.s, range(t, 4.2, 5.2) * 0.7, h.seed + Math.floor(t * 10)) : h.s;
            MENTE.frase(c, cam, h.p, s, a, { cor: h.cor, tam: h.emb ? 26 : 32, dy: 0, linha: false, ymin: 470, ymax: 1760, evita: [1030, 1230] });
          });
        }
