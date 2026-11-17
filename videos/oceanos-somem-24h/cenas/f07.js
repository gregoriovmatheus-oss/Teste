/*META {"imports": ["oceano"], "rotulos": [{"de": 2.25, "ate": 5.15, "texto": "<span class=\"k\">FONTES HIDROTERMAIS</span><br>Fluidos a <span class=\"y\">400 °C</span>"}], "D0": 5.19} */
        const O = OCEANO, G0 = 30.37;
        try { await document.fonts.load('500 26px "JetBrains Mono"'); } catch (e) {}
        const st = T.createToyStage(canvas, { fov: 50, ceu: ["#22314f", "#b07a52"], nevoa: [50, 260], corNevoa: "#5a4a44", nuvens: 0, exposicao: 1.0, luz: 0.8 });
        const S = st.scene, cam = st.cam;
        const alt = (x, z) => 2.2 * O.fbm(x * 0.06, z * 0.06, 4, 71) + 1.5 * Math.max(0, O.ruido(x * 0.2, z * 0.2, 72));
        S.add(O.terreno({ w: 320, d: 320, sx: 70, sz: 70, alt, cor: (x, z, y, c) => O.mistura(c, 0x24201f, 0x5a4636, (y + 1) / 4 + 0.2 * O.ruido(x * 0.3, z * 0.3, 73)) }));
        const rr = mulberry32(74);
        const mEsc = T.TOON({ color: 0x2b2522, roughness: 0.9, flatShading: true }), mFer = T.TOON({ color: 0x5a3220, roughness: 0.85, flatShading: true }), mEnx = T.TOON({ color: 0x6e5a2c, roughness: 0.7, flatShading: true });
        const CH = [[0, 0, 13], [-7, 4, 9], [6, -5, 10.5], [-3, -8, 7], [9, 6, 6.5]];
        const bocas = CH.map(([x, z, h], j) => {
          const g = new THREE.Group(); g.position.set(x, alt(x, z) - 0.3, z); S.add(g);
          let y = 0; const n = 5;
          for (let i = 0; i < n; i++) {
            const hs = h / n, r0 = lerp(2.4, 0.9, i / n) * (0.85 + rr() * 0.3), r1 = lerp(2.4, 0.9, (i + 1) / n) * (0.85 + rr() * 0.3);
            const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, hs, 9, 1), [mEsc, mFer, mEsc, mEnx][(i + j) % 4]);
            m.position.set((rr() - 0.5) * 0.4, y + hs / 2, (rr() - 0.5) * 0.4); m.rotation.y = rr() * 3; m.castShadow = m.receiveShadow = true; g.add(m); y += hs;
          }
          return new THREE.Vector3(x, g.position.y + y, z);
        });
        // vermes tubulares (morrendo ao ar): tubos brancos com pluma vermelha
        const NV = 90, tb = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.14, 1, 6), T.TOON({ color: 0xe9e4d6, roughness: 0.6 }), NV);
        const tp = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 8, 6), T.TOON({ color: 0xc0302a, roughness: 0.5 }), NV);
        const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
        for (let i = 0; i < NV; i++) {
          const [cx, cz] = CH[i % 3], a = rr() * 6.28, d = 2.6 + rr() * 3, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, h = 1 + rr() * 1.6;
          q.setFromEuler(e3.set((rr() - 0.5) * 0.5, 0, (rr() - 0.5) * 0.5));
          pv.set(x, alt(x, z) + h / 2, z); mm.compose(pv, q, sv.set(1, h, 1)); tb.setMatrixAt(i, mm);
          pv.set(x, alt(x, z) + h, z); mm.compose(pv, q, sv.set(1, 0.8, 1)); tp.setMatrixAt(i, mm);
        }
        tb.castShadow = true; S.add(tb, tp);
        // plumas: fumaça mineral escura por dentro, vapor branco por fora (a 400 °C, a água vira vapor no ar)
        const NP = 160, plumas = bocas.map((b, j) => {
          const mk = (cor, op, sz) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(NP * 3), 3));
            const p = new THREE.Points(g, new THREE.PointsMaterial({ color: cor, size: sz, map: O.texPonto(), transparent: true, opacity: op, depthWrite: false })); S.add(p); return p; };
          const r = mulberry32(80 + j);
          return { b, esc: mk(0x231f1d, 0.6, 2.6), vap: mk(0xe9e5df, 0.42, 4.2), sem: Array.from({ length: NP }, () => [r(), r() * 6.28, r(), r() * 6.28]) };
        });
        const halo = new THREE.SpriteMaterial({ map: O.texPonto(), color: 0xff7a2a, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
        const brilhos = bocas.map((b) => { const s = new THREE.Sprite(halo); s.position.copy(b); s.scale.setScalar(4); S.add(s); return s; });
        function render(t) {
          for (const P of plumas) {
            for (const [pts, larg, vel, sub] of [[P.esc, 0.5, 6, 0], [P.vap, 1.2, 4.5, 1]]) {
              const a = pts.geometry.attributes.position;
              for (let i = 0; i < NP; i++) {
                const [ph, an, rs, w] = P.sem[i];
                const age = ((t * 0.35 + ph) % 1);
                const h = age * vel * 5 * (sub ? 1.1 : 1), sp = (0.3 + age * age * 9) * larg * (0.4 + rs);
                a.setXYZ(i, P.b.x + Math.cos(an + age * 2) * sp + age * age * 6, P.b.y + h, P.b.z + Math.sin(an + age * 2) * sp);
              }
              a.needsUpdate = true;
            }
          }
          brilhos.forEach((s, i) => s.scale.setScalar(4 + Math.sin(t * 9 + i) * 0.6));
          const u = t / D, an = lerp(0.5, 2.0, ease.inOutSine(u)), R = lerp(42, 30, u);
          cam.position.set(Math.cos(an) * R, lerp(7, 20, u), Math.sin(an) * R);
          cam.lookAt(0, lerp(10, 12, u), 0);
          st.sol(0, 0, 40);
          st.draw();
          O.etiqueta(st.ctx, cam, bocas[0], "FUMAROLA NEGRA", { dx: -90, dy: -110, tam: 26, a: range(t, 0.4, 0.8) - range(t, 2.0, 2.3), sub: "chaminé de minerais" });
          O.etiqueta(st.ctx, cam, new THREE.Vector3(CH[1][0] + 3, alt(CH[1][0] + 3, CH[1][1]) + 2, CH[1][1] + 2), "EXPOSTA AO AR", { dx: 80, dy: 140, tam: 26, a: range(t, 3.1, 3.5), sub: "pela primeira vez" });
        }
