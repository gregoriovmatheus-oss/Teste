/*META {"imports": ["regen"], "css": "    [data-composition-id=\"f05\"] .rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }\n    [data-composition-id=\"f05\"] .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    [data-composition-id=\"f05\"] .rot-t .r { font-weight: 800; color: #ff8a4c; }\n    [data-composition-id=\"f05\"] .rot-t .k { font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 28px; letter-spacing: 0.3em; color: #7cc8ff; margin-bottom: 18px; -webkit-text-stroke: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    [data-composition-id=\"f05\"] .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n", "rotulos": [], "D0": 5.45} */
        const RG = REGEN;
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#03060c", "#0e1a2c"], nevoa: [5, 18], corNevoa: "#060a14", nuvens: 0, exposicao: 1.08 });
        const S = st.scene, cam = st.cam;
        st.hemi.intensity = 0.55; st.key.intensity = 2.6; st.key.color.set(0xfff2e6); st.rim.color.set(0x7cc8ff); st.rim.intensity = 3.0; st.sol(0, 0, 3, 1.4);
        // chão de laboratório escuro com grade
        const grade = new THREE.GridHelper(12, 48, 0x1f4a6a, 0x13283c); grade.position.y = -0.02; S.add(grade);
        const BR = RG.braco(); BR.g.position.set(0, 2.72, 0); S.add(BR.g);
        // o "mapa": contorno do braço em linhas azuis
        const mapa = new THREE.Group(); BR.g.add(mapa);
        const mm = new THREE.MeshBasicMaterial({ color: 0x7cc8ff, wireframe: true, transparent: true, opacity: 0, depthWrite: false, fog: false });
        BR.pele.children.forEach((o) => { const w = new THREE.Mesh(o.geometry, mm); w.scale.copy(o.scale); w.scale.multiplyScalar(1.02); mapa.add(w); });
        // células que se multiplicam (divisão: cada uma nasce da "mãe")
        const N = 256, C = RG.celulas(S, N, { raio: 0.035 });
        C.m.material.emissive.set(0x7cc8ff); C.m.material.emissiveIntensity = 0.5;
        const R = mulberry32(55), P = [];
        for (let i = 0; i < N; i++) { const y = -R() * 2.55, a = R() * 6.283, r = 0.04 + R() * 0.12; P.push([Math.cos(a) * r, 2.72 + y, Math.sin(a) * r * 0.8]); }
        const nasce = (i) => 0.65 + Math.log2(i + 1) * 0.2;
        const pos = (i, t) => { const n = nasce(i), k = ease.outCubic(range(t, n, n + 0.45)); if (i === 0) return P[0]; const m = pos(i >> 1, n); return [lerp(m[0], P[i][0], k), lerp(m[1], P[i][1], k), lerp(m[2], P[i][2], k)]; };
        const v = new THREE.Vector3();
        function render(t) {
          const fade = 1 - ease.inOutSine(range(t, 2.8, 3.6));
          for (let i = 0; i < N; i++) { const n = nasce(i), q = pos(i, t), s = ease.outBack(range(t, n - 0.05, n + 0.2)) * fade;
            C.set(i, q[0] + 0.006 * Math.sin(t * 3 + i), q[1], q[2], s, i % 5 === 0 ? 0xffffff : 0x9fd6ff); }
          C.fim();
          mm.opacity = 0.32 * ease.outCubic(range(t, 1.95, 2.35)) * (1 - 0.6 * range(t, 4.9, 5.4));
          const k = (a, b) => ease.inOutSine(range(t, a, b));
          BR.set({ osso: k(2.9, 3.6), musculo: k(3.68, 4.3), nervo: k(4.28, 4.85), pele: k(4.9, 5.45), peleOp: 0.42 });
          // câmera: órbita lenta em volta do braço, descendo do ombro para a mão
          const a = range(t, 0, 5.45);
          const ang = -0.5 + 1.0 * ease.inOutSine(a);
          cam.position.set(Math.sin(ang) * 3.5 + 0.2, lerp(1.75, 1.35, a), Math.cos(ang) * 3.5);
          cam.lookAt(0.32 * Math.cos(ang), lerp(1.45, 1.3, a), -0.32 * Math.sin(ang));
          st.bloom = 0.5 + 0.25 * k(4.28, 4.6);
          st.draw();
          const c = st.ctx, vv = RG.vis(st); RG.quadro();
          const f = (lx, ly, s, a0, cor, dy, a1 = 99) => { BR.g.localToWorld(v.set(lx, ly, 0)); RG.frase(c, cam, v, s, ease.outCubic(range(t, a0, a0 + 0.3)) * (1 - range(t, a1, a1 + 0.25)) * vv, { cor, tam: 30, dy, dx: 330 }); };
          f(0.0, 0.3, "SE MULTIPLICAM", 0.7, RG.AZUL, 380, 2.6); f(0.1, 1.4, "SEGUEM UM MAPA", 2.0, RG.AZUL, 0, 2.75);
          f(0.0, 0.5, "1 · OSSO", 2.9, "#f2ece0", 0); f(0.07, 0.6, "2 · MÚSCULO", 3.68, "#ff8a7a", 0); f(0.06, 1.2, "3 · NERVOS", 4.28, RG.AZUL, 0); f(0.12, 0.9, "4 · PELE", 4.9, "#ffc8a8", 0);
        }
