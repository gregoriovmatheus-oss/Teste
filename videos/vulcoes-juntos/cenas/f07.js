/*META {"imports": ["vulcoes"], "rotulos": [{"de": 4.35, "ate": 6.68, "texto": "Neve no <span class=\"y\">verão</span>"}], "D0": 6.68, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const V = VULCOES;
        await V.prepara();
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#8a9aa8", "#d8c8a8"], nevoa: [20, 120], corNevoa: "#c8c0b0", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0xffd8a8); st.key.intensity = 2.6; st.hemi.intensity = 0.6; st.sol(0, -10, 30);
        const chaoM = T.TOON({ color: 0x8a7a42, roughness: 1 });
        const chao = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), chaoM); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; S.add(chao);
        // lavoura de trigo (lâminas instanciadas) que congela
        const NB = 3200, R = mulberry32(707);
        const lamM = T.TOON({ color: 0xd8b860, roughness: 0.8 });
        const lam = new THREE.InstancedMesh(new THREE.ConeGeometry(0.03, 0.95, 3).translate(0, 0.47, 0), lamM, NB);
        const B = []; const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), eu = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
        for (let i = 0; i < NB; i++) { const lin = Math.floor(R() * 40); B.push([(lin - 20) * 0.55 + (R() - 0.5) * 0.25, -R() * 40 + 6, 0.75 + R() * 0.5, R() * 6.28]); lam.setColorAt(i, new THREE.Color().setHSL(0.11 + R() * 0.03, 0.6, 0.38 + R() * 0.12)); }
        S.add(lam);
        const espM = T.TOON({ color: 0xe0c070, roughness: 0.8 });
        const esp = new THREE.InstancedMesh(new THREE.SphereGeometry(0.028, 5, 4), espM, NB); esp.scale.set(1, 1, 1); S.add(esp);
        for (let i = 0; i < 5; i++) { const a = T.arvore(2.4, 0x4f6a3a, 80 + i); a.position.set(-24 + i * 12, 0, -70 - (i % 2) * 8); S.add(a); }
        const casa = T.predio({ w: 5, d: 4, h: 3.6, cor: 0xa8765a, seed: 4 }); casa.position.set(12, 0, -48); S.add(casa);
        const sol = V.brilho(0xffe0b0, 26, "suave", 0.7); sol.position.set(-10, 26, -90); S.add(sol);
        const NV = V.cinza(S, { n: 1800, area: [7, 9], centro: [0, 0, -2], alt: 8, cor: 0xffffff, tam: 0.05, vel: 0.9, op: 0 });
        const C0 = new THREE.Color(), C1 = new THREE.Color();
        function render(t) {
          const fr = ease.inOutSine(range(t, 3.2, 6.4));   // geada: verão dourado → branco-azulado
          lamM.color.set(0xffffff).lerp(C1.setHex(0xc8d8f0), fr); lamM.emissive.setHex(0x8aa0c0).multiplyScalar(0.55 * fr);
          espM.color.set(0xe0c070).lerp(C1.setHex(0xf4f8ff), fr);
          chaoM.color.set(0x8a7a42).lerp(C1.setHex(0xe8eef6), ease.inOutSine(range(t, 4.4, 6.6)));
          st.key.intensity = lerp(2.6, 1.0, range(t, 1.2, 4.0)); st.key.color.set(0xffd8a8).lerp(C1.setHex(0xb8c8e0), range(t, 1.2, 4.0));
          st.hemi.color.set(0xbfd8ff).lerp(C1.setHex(0xe0e8f8), fr); st.hemi.intensity = lerp(0.6, 0.9, fr);
          S.fog.color.set(0xc8c0b0).lerp(C1.setHex(0xd8e0ea), fr);
          sol.material.opacity = 0.7 * (1 - 0.8 * range(t, 1.2, 4));
          NV.u.op.value = 0.95 * range(t, 4.3, 4.8); NV.update(t);
          const vento = 0.12 + 0.15 * range(t, 4, 5);
          for (let i = 0; i < NB; i++) { const b = B[i]; const fl = Math.sin(t * 2 + b[0] * 0.3 + b[1] * 0.2) * vento + vento * 0.5 - 0.2 * fr; eu.set(fl * 0.4, b[3], fl); q.setFromEuler(eu);
            sc.set(1, b[2] * (1 - 0.08 * fr), 1); ps.set(b[0], 0, b[1]); m4.compose(ps, q, sc); lam.setMatrixAt(i, m4);
            ps.set(0, 0.9 * b[2], 0).applyQuaternion(q).add(new THREE.Vector3(b[0], 0, b[1])); sc.set(1, 3.4, 1); m4.compose(ps, q, sc); esp.setMatrixAt(i, m4); }
          lam.instanceMatrix.needsUpdate = true; esp.instanceMatrix.needsUpdate = true;
          // câmera: dolly rente ao trigo, descendo até as espigas congeladas
          const e = ease.inOutSine(range(t, 0, 6.68));
          cam.position.set(lerp(1.2, -0.6, e), lerp(2.2, 1.15, e), lerp(5, 0.6, e));
          cam.lookAt(lerp(0, -0.8, e), lerp(1.6, 0.7, e), lerp(-12, -6, e));
          st.bloom = 0.4;
          st.draw();
          // termômetro (2D): cai de "cair" (3,1 s) a "graus" (3,9 s)
          const x = st.ctx, a = V.vis(st) * range(t, 1.2, 1.5) * (1 - range(t, 4.1, 4.35));
          if (a > 0) {
            const X = 540, Y0 = 690, Y1 = 960, niv = lerp(0.82, 0.22, ease.inOutCubic(range(t, 3.05, 3.95)));
            x.save(); x.globalAlpha = a;
            V.painel(x, X - 300, Y0 - 50, 600, 340, 1);
            x.fillStyle = "rgba(255,255,255,0.12)"; x.beginPath(); x.roundRect(X - 220, Y0, 34, Y1 - Y0, 17); x.fill();
            const cor = niv > 0.5 ? "#ff8a4c" : "#7cc8ff";
            x.fillStyle = cor; x.beginPath(); x.roundRect(X - 214, Y0 + (Y1 - Y0) * (1 - niv), 22, (Y1 - Y0) * niv, 11); x.fill();
            x.beginPath(); x.arc(X - 203, Y1 + 8, 26, 0, 6.283); x.fill();
            for (let i = 0; i <= 8; i++) { const y = Y0 + 10 + i * (Y1 - Y0 - 20) / 8; x.fillStyle = "rgba(255,255,255,0.5)"; x.fillRect(X - 176, y, i % 2 ? 12 : 22, 2); }
            x.restore();
            V.txt(x, "TEMPERATURA", X + 60, Y0 + 30, { tam: 26, cor: V.AZUL, a, esp: 0.3 });
            V.txt(x, "DO PLANETA", X + 60, Y0 + 70, { tam: 26, cor: V.AZUL, a: a * range(t, 2.1, 2.4), esp: 0.3 });
            V.txt(x, "↓ VÁRIOS", X + 60, Y0 + 170, { fonte: "inter", peso: 800, tam: 64, cor: "#fff", a: a * range(t, 3.35, 3.6), esp: 0 });
            V.txt(x, "GRAUS", X + 60, Y0 + 235, { fonte: "inter", peso: 300, tam: 50, cor: "#fff", a: a * range(t, 3.75, 4.0), esp: 0 });
          }
          V.etq(x, "GEADA NAS LAVOURAS", new THREE.Vector3(-0.8, 0.9, -4), cam, V.vis(st) * range(t, 5.25, 5.5), { cor: V.AZUL, dy: 260 });
        }
