/*META {"imports": ["regen"], "css": "    [data-composition-id=\"f12\"] .rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }\n    [data-composition-id=\"f12\"] .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    [data-composition-id=\"f12\"] .rot-t .r { font-weight: 800; color: #ff8a4c; }\n    [data-composition-id=\"f12\"] .rot-t .k { font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 28px; letter-spacing: 0.3em; color: #7cc8ff; margin-bottom: 18px; -webkit-text-stroke: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    [data-composition-id=\"f12\"] .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n", "rotulos": [{"de": 1.1, "ate": 3.05, "texto": "A evolução escolheu<br><span class=\"y\">cicatrizar</span>"}], "D0": 5.7} */
        const RG = REGEN;
        const st = T.createToyStage(canvas, { fov: 38, ceu: ["#0a0806", "#2a1e18"], nevoa: [3, 12], corNevoa: "#0e0a08", nuvens: 0, exposicao: 1.08 });
        const S = st.scene, cam = st.cam;
        st.hemi.intensity = 0.6; st.key.intensity = 1.5; st.key.color.set(0xfff0e0); st.rim.color.set(0x7cc8ff); st.rim.intensity = 2.0; st.sol(0, 0, 2, 0);
        // dois pedaços de pele com o mesmo corte: à esquerda cicatriza, à direita regenera
        const mk = (x) => { const g = new THREE.PlaneGeometry(1.05, 1.5, 70, 50); g.rotateX(-Math.PI / 2);
          const cor = new Float32Array(g.attributes.position.count * 3); g.setAttribute("color", new THREE.BufferAttribute(cor, 3));
          const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, envMapIntensity: 0.6 })); m.position.x = x; S.add(m);
          const base = g.attributes.position.array.slice(); return { m, g, base }; };
        const PE = mk(-0.58), PD = mk(0.58);
        const pele = new THREE.Color(0xc58f6c), carne = new THREE.Color(0x8a2a24), cic = new THREE.Color(0xe0a0a0), cc = new THREE.Color();
        function forma(P, prof, cicK, rugas) {
          const p = P.g.attributes.position, c = P.g.attributes.color;
          for (let i = 0; i < p.count; i++) { const x = P.base[i * 3], z = P.base[i * 3 + 2];
            const ond = 0.02 * Math.sin(z * 9) * rugas, w = 0.1 + ond * 0.5, g = Math.exp(-((x - ond) * (x - ond)) / (w * w)) * (Math.abs(z) < 0.62 ? 1 : Math.exp(-((Math.abs(z) - 0.62) ** 2) / 0.004));
            p.setY(i, 0.008 * Math.sin(x * 23 + z * 17) - prof * g);
            cc.copy(pele).lerp(carne, Math.min(1, g * prof * 9)).lerp(cic, g * cicK * 0.9); c.setXYZ(i, cc.r, cc.g, cc.b); }
          p.needsUpdate = true; c.needsUpdate = true; P.g.computeVertexNormals();
        }
        // células azuis enchendo o corte da direita, devagar
        const N = 160, CE = RG.celulas(S, N, { raio: 0.022, det: 0 }); CE.m.material.emissive.set(0x7cc8ff); CE.m.material.emissiveIntensity = 0.6;
        const R = mulberry32(12), CP = Array.from({ length: N }, () => [0.58 + (R() - 0.5) * 0.08, (R() - 0.5) * 1.2, R()]);
        const v = new THREE.Vector3();
        function render(t) {
          const fecha = ease.inOutCubic(range(t, 0.4, 2.0));
          forma(PE, 0.12 * (1 - fecha), fecha, fecha);
          const enche = 0.35 * ease.inOutSine(range(t, 0.6, 5.7));
          forma(PD, 0.12 * (1 - enche), 0, 0);
          for (let i = 0; i < N; i++) { const [x, z, o] = CP[i]; const vis = o < enche * 2.4 ? 1 : 0; CE.set(i, x, -0.1 + o * 0.08, z, vis * (0.8 + 0.2 * Math.sin(t * 4 + i)), 0x9fd6ff); }
          CE.fim();
          const e = ease.inOutSine(range(t, 0, 5.7));
          cam.position.set(lerp(-0.25, 0.2, e), lerp(3.3, 2.9, e), lerp(2.3, 2.0, e)); cam.lookAt(0, -0.1, lerp(-0.25, -0.3, e));
          st.draw();
          const c = st.ctx, vv = RG.vis(st); RG.quadro();
          RG.txt(c, "CICATRIZAR", RG.proj(v.set(-0.58, 0, -0.75), cam)[0], 560, { tam: 30, cor: "#ffc8b0", a: range(t, 0.2, 0.5) * vv });
          RG.txt(c, "REGENERAR", RG.proj(v.set(0.58, 0, -0.75), cam)[0], 560, { tam: 30, cor: RG.AZUL, a: range(t, 0.2, 0.5) * vv });
          const f = (s, a0, dy) => { v.set(-0.58, 0, 0.1); RG.frase(c, cam, v, s, ease.outCubic(range(t, a0, a0 + 0.25)) * vv, { cor: "#ffc8b0", tam: 30, dy, dx: 40 }); };
          f("✓ MAIS RÁPIDO", 3.25, 0); f("✓ MAIS BARATO", 4.22, 0); f("✓ MAIS SEGURO", 4.74, 0);
        }
