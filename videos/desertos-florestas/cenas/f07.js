/*META {"imports": ["deserto"], "rotulos": [{"de": 3.3, "ate": 5.32, "top": 600, "texto": "<span class=\"k\">ALBEDO</span><br>a areia <span class=\"y\">devolve</span> a luz"}], "D0": 5.32, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const DS = DESERTO;
        await DS.prepara();
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#1d3f78", "#bcd2e6"], nevoa: [40, 160], corNevoa: "#b8cbe0", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0xfff2dc); st.key.intensity = 3.0; st.hemi.intensity = 0.55; st.sol(0, 0, 25);
        // metade floresta (escura) | metade areia (clara)
        const solo = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), T.M(0x2a3a1e, 0.95)); solo.rotation.x = -Math.PI / 2; solo.position.set(-30, 0, -10); S.add(solo);
        const DU = DS.dunas(S, T.M, { tam: 60, seg: 48, amp: 0.25, areia: 0xf0d8a4, centro: [30, -10] });
        DU.m.position.x = 0; DU.m.geometry.translate(0, -0.15, 0);
        const FL = DS.floresta(S, T.M, { n: 260, area: [[-34, -0.6], [-40, 8]], seed: 21, alt: [1.8, 3.0], cor: 0x234f1e });
        // raios de sol: haste + ponta (setas) — chegam nos dois lados; só a areia devolve
        const amarelo = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffe08a).multiplyScalar(1.6), toneMapped: false, transparent: true, opacity: 0.95 });
        const branco = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff6dc).multiplyScalar(1.8), toneMapped: false, transparent: true, opacity: 0.95 });
        const seta = (m) => { const g = new THREE.Group(); const h = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1, 8), m); h.position.y = 0.5; g.add(h);
          const p = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 10), m); g.add(p); S.add(g); return { g, h, p }; };
        const up = new THREE.Vector3(0, 1, 0), dv = new THREE.Vector3();
        const poe = (s, a, b, k) => { dv.subVectors(b, a); const L = dv.length() * k; s.g.visible = k > 0.01; if (!s.g.visible) return;
          s.g.position.copy(a); s.g.quaternion.setFromUnitVectors(up, dv.normalize()); s.h.scale.y = Math.max(0.01, L - 0.5); s.p.position.y = Math.max(0.01, L - 0.35); };
        const SOLP = new THREE.Vector3(-4, 26, -18);
        const sol = DS.brilho(0xfff0c0, 18, "suave", 1); sol.position.copy(SOLP); S.add(sol);
        const alvosF = [new THREE.Vector3(-7, 2.7, 0), new THREE.Vector3(-4, 2.7, 3), new THREE.Vector3(-10, 2.7, -3)];
        const alvosA = [new THREE.Vector3(6, 0.3, 0), new THREE.Vector3(9, 0.3, 3), new THREE.Vector3(4, 0.3, -3)];
        const entra = [...alvosF, ...alvosA].map(() => seta(amarelo)), volta = alvosA.map(() => seta(branco));
        const calor = alvosF.map((p) => { const b = DS.brilho(0xff7a2c, 5, "suave", 0); b.position.copy(p); S.add(b); return b; });
        const alvo = new THREE.Vector3(), saida = alvosA.map((p, i) => new THREE.Vector3(p.x + 8 + i * 2, 30, p.z - 14));
        function render(t) {
          [...alvosF, ...alvosA].forEach((p, i) => { const a = new THREE.Vector3().lerpVectors(SOLP, p, 0.15); poe(entra[i], a, p, ease.outCubic(range(t, 0.3 + (i % 3) * 0.12, 1.3 + (i % 3) * 0.12))); });
          // devolvida em "Ela devolve luz" (3,3 s) até o espaço (4,7 s)
          alvosA.forEach((p, i) => poe(volta[i], p, saida[i], ease.inOutSine(range(t, 3.3 + i * 0.12, 4.6 + i * 0.12))));
          calor.forEach((b, i) => { b.material.opacity = 0.85 * range(t, 1.2, 1.8) * (0.75 + 0.25 * Math.sin(t * 5 + i)); b.scale.setScalar(4 + 1.2 * Math.sin(t * 3 + i)); });
          // câmera: rente ao chão na divisa → sobe e recua mostrando o caminho até o céu
          const e = ease.inOutCubic(range(t, 0, 5.32));
          cam.position.set(lerp(0.5, 3, e), lerp(3.2, 11, e), lerp(17, 27, e));
          alvo.set(lerp(-0.5, 2, e), lerp(2.5, 9, e), lerp(0, -4, e)); cam.lookAt(alvo);
          st.bloom = 0.65;
          st.draw();
          const c = st.ctx, fe = 1 - range(t, 3.05, 3.3);
          DS.etq(c, "FLORESTA · ESCURA · ABSORVE", new THREE.Vector3(-6, 2.6, 2), cam, range(t, 1.25, 1.55) * fe, { dy: 140, dx: 30 });
          DS.etq(c, "AREIA · CLARA · REFLETE", new THREE.Vector3(7, 0.2, 2), cam, range(t, 2.27, 2.55) * fe, { dy: -60, dx: -20 });
          DS.etq(c, "ESPAÇO", saida[1], cam, range(t, 4.65, 4.9), { dy: 140, cor: "#fff6dc" });
        }
