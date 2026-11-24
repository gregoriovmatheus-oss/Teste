/*META {"imports": ["regen"], "css": "    [data-composition-id=\"f04\"] .rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }\n    [data-composition-id=\"f04\"] .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    [data-composition-id=\"f04\"] .rot-t .r { font-weight: 800; color: #ff8a4c; }\n    [data-composition-id=\"f04\"] .rot-t .k { font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 28px; letter-spacing: 0.3em; color: #7cc8ff; margin-bottom: 18px; -webkit-text-stroke: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    [data-composition-id=\"f04\"] .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n", "rotulos": [{"de": 1.5, "ate": 3.25, "texto": "<span class=\"k\">O SEGREDO</span><br>o <span class=\"y\">blastema</span>"}], "D0": 6.43} */
        const RG = REGEN;
        const st = T.createToyStage(canvas, { fov: 38, ceu: ["#05080f", "#122030"], nevoa: [1.5, 8], corNevoa: "#08101a", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        st.hemi.intensity = 0.5; st.key.intensity = 2.6; st.rim.color.set(0x7cc8ff); st.rim.intensity = 2.8; st.sol(0, 0, 2, 0.6);
        // toco do membro do axolote (pele rosada), cortado em x = 0
        const pele = new THREE.MeshStandardMaterial({ color: 0xf0b8b4, roughness: 0.32, emissive: 0xf0b8b4, emissiveIntensity: 0.06 });
        const toco = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.32, 1.6, 28, 1, true), pele); toco.rotation.z = Math.PI / 2; toco.position.set(-0.8, 0.6, 0); S.add(toco);
        const fundoAx = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), pele); fundoAx.scale.set(0.9, 0.55, 0.8); fundoAx.position.set(-1.9, 0.55, -0.3); S.add(fundoAx);
        const N = 300, C = RG.celulas(S, N, { raio: 0.026, det: 1 });
        C.m.material.emissive.set(0x7cc8ff);
        const R = mulberry32(44), PA = [], PB = [], tipo = [];
        const CORES = [0xf2ece0, 0xc8443c, 0xeaa6a0];   // osso, músculo, pele
        for (let i = 0; i < N; i++) {
          const r = Math.sqrt(R()) * 0.27, a = R() * 6.283;
          PA.push([-0.01 - R() * 0.03, 0.6 + Math.sin(a) * r, Math.cos(a) * r]); tipo.push(r < 0.085 ? 0 : r < 0.22 ? 1 : 2);
          // broto em cone (blastema)
          const u = Math.pow(R(), 0.8), rr = Math.sqrt(R()) * 0.26 * (1 - u * 0.75), b = R() * 6.283;
          PB.push([0.02 + u * 0.42, 0.6 + Math.sin(b) * rr, Math.cos(b) * rr]);
        }
        const jov = new THREE.Color(0x8fd8ff), cc = new THREE.Color(), halo = RG.glowSprite(0x7cc8ff, 0.9, 0); halo.position.set(0.15, 0.6, 0); S.add(halo);
        const v = new THREE.Vector3();
        function render(t) {
          // as células "esquecem": cor do tipo → azul jovem; depois se soltam e formam o broto
          const kc = ease.inOutSine(range(t, 3.9, 4.7)), kb = ease.inOutCubic(range(t, 4.3, 6.2));
          for (let i = 0; i < N; i++) {
            const d = (i % 17) / 17 * 0.35, k1 = clamp(kc * 1.35 - d), k2 = clamp(kb * 1.3 - d * 0.8);
            const x = lerp(PA[i][0], PB[i][0], k2), y = lerp(PA[i][1], PB[i][1], k2), z = lerp(PA[i][2], PB[i][2], k2);
            const w = 0.004 * Math.sin(t * 3 + i);
            cc.set(CORES[tipo[i]]).lerp(jov, k1);
            const ap = ease.outCubic(range(t, 0.15 + (i % 23) * 0.03, 0.6 + (i % 23) * 0.03));
            C.set(i, x + w, y + w, z, ap * (1 + 0.15 * k1 + 0.08 * Math.sin(t * 4 + i * 0.7) * k1), cc.getHex());
          }
          C.fim(); C.m.material.emissiveIntensity = 0.35 * kc;
          halo.material.opacity = 0.45 * kc; halo.position.x = 0.05 + 0.2 * kb;
          // câmera: lateral macro → gira para 3/4 de frente do corte
          const a = ease.inOutSine(range(t, 0, 6.43));
          const ang = lerp(0.35, 1.15, a), dist = lerp(2.3, 1.8, a);
          cam.position.set(0.1 + Math.sin(ang) * dist, 1.05 - 0.12 * a, Math.cos(ang) * dist);
          cam.lookAt(-0.1, 0.12, 0);
          st.bloom = 0.45 + 0.35 * kc;
          st.draw();
          const c = st.ctx, vv = RG.vis(st); RG.quadro();
          const tp = (ti, aa, s, cor, dy, dx) => { let n = 0; v.set(0, 0, 0); for (let i = 0; i < N; i += 7) if (tipo[i] === ti) { v.x += PA[i][0]; v.y += PA[i][1]; v.z += PA[i][2]; n++; } v.divideScalar(n); RG.frase(c, cam, v, s, aa * vv, { cor, tam: 26, dy, dx }); };
          const ta = ease.outCubic(range(t, 3.45, 3.75)) * (1 - range(t, 5.05, 5.4));
          tp(1, ta, "MÚSCULO", "#ff8a7a", 330, -120); tp(0, ta, "OSSO", "#f2ece0", 420, 140); tp(2, ta, "PELE", "#ffb8b0", 520, -60);
          v.set(0.3, 0.6, 0); RG.frase(c, cam, v, "CÉLULAS JOVENS", ease.outCubic(range(t, 4.6, 4.9)) * vv, { cor: RG.AZUL, tam: 32, dy: 420 });
        }
