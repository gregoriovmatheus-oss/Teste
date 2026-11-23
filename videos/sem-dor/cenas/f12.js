/*META {"imports": ["dor"], "css": "    [data-composition-id=\"f12\"] .rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }\n    [data-composition-id=\"f12\"] .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    [data-composition-id=\"f12\"] .rot-t .r { font-weight: 800; color: #ff8a4c; }\n    [data-composition-id=\"f12\"] .rot-t .k { font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; -webkit-text-stroke: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    [data-composition-id=\"f12\"] .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n", "rotulos": [{"de": 0.4, "ate": 2.05, "texto": "A dor não é<br>o <span class=\"y\">inimigo</span>"}, {"de": 2.15, "ate": 3.46, "sai": false, "texto": "Ela é o <span class=\"r\">alarme</span>"}], "D0": 3.46} */
        const st = T.createToyStage(canvas, { fov: 42, ceu: ["#0a0b0f", "#16181e"], nevoa: [3, 12], corNevoa: "#101218", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        st.hemi.intensity = 0.45; st.key.intensity = 1.2;
        const teto = new THREE.Mesh(new THREE.PlaneGeometry(12, 12).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8a8d94, roughness: 0.9 })); teto.position.y = 3; S.add(teto);
        const det = new THREE.Group(); det.position.set(0, 2.96, 0); S.add(det);
        const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.1, 40), new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.35 })); corpo.position.y = -0.05; det.add(corpo);
        for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.12 + i * 0.07, 0.008, 6, 40), new THREE.MeshStandardMaterial({ color: 0xc8c8c4, roughness: 0.4 })); r.rotation.x = Math.PI / 2; r.position.y = -0.105; det.add(r); }
        const ledM = new THREE.MeshBasicMaterial({ color: 0x220404, toneMapped: false });
        const led = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), ledM); led.position.set(0.2, -0.1, 0.05); det.add(led);
        const lg = DOR.glowSprite(0xff3020, 1.4, 0); lg.position.set(0.2, 2.84, 0.05); S.add(lg);
        const ondas = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 6, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff4a2a).multiplyScalar(1.5), toneMapped: false, transparent: true, opacity: 0 })); m.rotation.x = Math.PI / 2; m.position.y = 2.9; S.add(m); return m; });
        // fumaça subindo até o sensor
        const R = mulberry32(121), NF = 300, fb = [], fa = new Float32Array(NF * 3);
        for (let i = 0; i < NF; i++) fb.push([(R() - 0.5) * 2.4, R(), (R() - 0.5) * 2.4, R() * 6]);
        const fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.BufferAttribute(fa, 3));
        const fum = new THREE.Points(fg, new THREE.PointsMaterial({ color: 0x9a9ca4, size: 0.16, map: DOR.glowTex(), transparent: true, opacity: 0.35, depthWrite: false })); S.add(fum);
        const TA = 2.72;
        function render(t) {
          for (let i = 0; i < NF; i++) { const [x, f, z, ph] = fb[i], u = (f + t * 0.18) % 1; fa[i * 3] = x * (1 - u * 0.6) + Math.sin(t + ph) * 0.15; fa[i * 3 + 1] = 0.6 + u * 2.3; fa[i * 3 + 2] = z * (1 - u * 0.6) + Math.cos(t * 0.8 + ph) * 0.15; }
          fg.attributes.position.needsUpdate = true;
          const on = t > TA ? 1 : 0, pis = on * (0.5 + 0.5 * Math.sign(Math.sin((t - TA) * Math.PI * 5)));
          ledM.color.setHex(on ? (pis > 0.5 ? 0xff2a1a : 0x501010) : 0x220404); if (on && pis > 0.5) ledM.color.multiplyScalar(2);
          lg.material.opacity = on * (0.3 + 0.6 * pis);
          ondas.forEach((m, i) => { const q = ((t - TA) * 0.9 + i / 3) % 1; m.scale.setScalar(0.4 + q * 3); m.material.opacity = on * (1 - q) * 0.8; });
          st.rim.color.set(0xff4a2a); st.rim.intensity = on * (0.5 + 2.5 * pis);
          const e = ease.inOutSine(range(t, 0, 3.46));
          cam.position.set(lerp(0.9, 0.3, e), lerp(0.4, 0.8, e), lerp(3.2, 2.6, e));
          cam.lookAt(0, lerp(1.95, 2.05, e), 0);
          st.bloom = 0.6 + on * 0.3;
          st.sol(0, 0, 3, 2);
          st.draw(undefined, undefined, on ? { cor: "#ff3a1a", a: 0.08 * pis } : null);
        }
