/*META {"imports": ["regen"], "css": "    [data-composition-id=\"f09\"] .rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }\n    [data-composition-id=\"f09\"] .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    [data-composition-id=\"f09\"] .rot-t .r { font-weight: 800; color: #ff8a4c; }\n    [data-composition-id=\"f09\"] .rot-t .k { font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 28px; letter-spacing: 0.3em; color: #7cc8ff; margin-bottom: 18px; -webkit-text-stroke: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    [data-composition-id=\"f09\"] .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n", "rotulos": [{"de": 0.8, "ate": 2.2, "texto": "Mas existe<br>um <span class=\"r\">limite</span>"}], "D0": 5.05} */
        const RG = REGEN;
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#07060c", "#1a1020"], nevoa: [2, 10], corNevoa: "#0c0810", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        st.hemi.intensity = 0.5; st.key.intensity = 2.5; st.rim.color.set(0x7cc8ff); st.rim.intensity = 2.4; st.sol(0, 0, 3, 0);
        // tecido: camada de células normais (hexágonos), dividindo devagar
        const NX = 22, NT = NX * NX, tec = RG.celulas(S, NT, { raio: 0.09, det: 0 });
        const TP = [];
        for (let i = 0; i < NX; i++) for (let j = 0; j < NX; j++) TP.push([(i - NX / 2 + (j % 2) * 0.5) * 0.17, 0, (j - NX / 2) * 0.15]);
        // tumor: células vermelhas em bola que cresce (ordenadas da mais central para fora)
        const N = 700, tum = RG.celulas(S, N, { raio: 0.06, det: 0 }); tum.m.material.emissive.set(0xff3a2a);
        const R = mulberry32(91), TU = [];
        for (let i = 0; i < N; i++) { const u = R(), th = R() * 6.283, ph = Math.acos(2 * R() - 1), r = Math.cbrt(u) * 0.62; TU.push([r * Math.sin(ph) * Math.cos(th), 0.06 + Math.abs(r * Math.cos(ph)) * 0.9, r * Math.sin(ph) * Math.sin(th), r]); }
        TU.sort((a, b) => a[3] - b[3]);
        const alarme = new THREE.PointLight(0xff3a2a, 0, 4, 1.5); alarme.position.set(0, 0.8, 0.3); S.add(alarme);
        const halo = RG.glowSprite(0xff5a3a, 1.6, 0); halo.position.set(0, 0.35, 0); S.add(halo);
        const v = new THREE.Vector3(), cN = new THREE.Color(), c1 = new THREE.Color(0x9fc8e8), c2 = new THREE.Color(0xe8b0b8);
        function render(t) {
          for (let i = 0; i < NT; i++) { const [x, y, z] = TP[i], d = Math.hypot(x, z), puls = 0.04 * Math.sin(t * 1.5 + i * 0.9);
            cN.copy(c1).lerp(c2, (i * 7 % 11) / 11);
            const empurra = 0.12 * range(t, 2.2, 4.6) * Math.max(0, 1 - d / 1.2);
            tec.set(i, x * (1 + empurra), y - 0.02, z * (1 + empurra), (1 + puls) * (d < 3.3 ? 1 : 0), cN.getHex()); }
          tec.fim();
          // a primeira célula muda (1,3 s); depois duplica cada vez mais rápido
          const n = t < 1.34 ? 0 : Math.min(N, Math.floor(Math.pow(2, (t - 1.34) * (1.2 + 1.4 * range(t, 2.2, 3.3))))) ;
          for (let i = 0; i < N; i++) { const [x, y, z] = TU[i]; const s = i < n ? Math.min(1, (n - i) / 6) : 0;
            tum.set(i, x * Math.max(0.3, s), y * Math.max(0.3, s) + 0.02, z * Math.max(0.3, s), s * (0.9 + 0.15 * Math.sin(t * 6 + i)), i === 0 ? 0xff6a4a : 0xc8342a); }
          tum.fim(); tum.m.material.emissiveIntensity = 0.25 + 0.2 * Math.sin(t * 5) ** 2;
          const al = range(t, 2.8, 4.4);
          alarme.intensity = 6 * al * (0.7 + 0.3 * Math.sin(t * 6)); halo.material.opacity = 0.5 * al;
          st.rim.color.lerpColors(new THREE.Color(0x7cc8ff), new THREE.Color(0xff5a3a), al);
          // câmera: rasante sobre o tecido, aproximando da célula que muda
          const e = ease.inOutSine(range(t, 0, 5.05));
          cam.position.set(lerp(1.6, 0.9, e), lerp(1.1, 0.95, e), lerp(2.6, 1.6, e)); cam.lookAt(0, lerp(0.0, 0.15, e), 0);
          st.bloom = 0.5 + 0.3 * al;
          st.draw();
          const c = st.ctx, vv = RG.vis(st); RG.quadro();
          v.set(0, 0.05, 0); RG.frase(c, cam, v, "UMA CÉLULA SAI DO CONTROLE", ease.outCubic(range(t, 2.2, 2.5)) * (1 - range(t, 4.1, 4.35)) * vv, { cor: RG.LARANJA, tam: 26, dy: 280 });
          v.set(0, 0.5, 0); RG.frase(c, cam, v, "CÂNCER", ease.outCubic(range(t, 4.38, 4.62)) * vv, { cor: RG.LARANJA, tam: 44, dy: 340 });
        }
