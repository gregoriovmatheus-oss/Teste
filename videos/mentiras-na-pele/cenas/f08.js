/*META {"imports": ["pele"], "rotulos": [{"de": 0.15, "ate": 1.75, "top": 470, "texto": "<span class=\"k\">CORTE DA PELE DO ROSTO</span><br>O corpo entrega <span class=\"y\">pouco</span>"}], "D0": 4.48} */
        await PELE.fontes();
        const st = T.createToyStage(canvas, { fov: 34, ceu: ["#05070c", "#121a26"], nevoa: null, nuvens: 0, luz: 0.9 });
        const S = st.scene, cam = st.cam;
        st.rim.color.set(0x8fc4ff); st.rim.intensity = 1.8; st.hemi.intensity = 0.5;
        // bloco de pele em corte: epiderme, derme e gordura (face cortada virada para a câmera, +z)
        const W = 5, DP = 3;
        const camada = (h, y, cor, rough = 0.7) => { const m = new THREE.Mesh(new THREE.BoxGeometry(W, h, DP), new THREE.MeshStandardMaterial({ color: cor, roughness: rough })); m.position.y = y; m.castShadow = m.receiveShadow = true; S.add(m); return m; };
        const epi = camada(0.18, 1.71, 0xe2ad85, 0.5);
        const derme = camada(1.0, 1.12, 0xd98a7a, 0.75);
        const gord = camada(0.62, 0.31, 0xe9cf8e, 0.8);
        derme.material.transparent = true; derme.material.opacity = 0.82;
        // vasos sanguíneos ao longo de x (dentro da derme) + alças de capilares subindo até a superfície
        const mV = new THREE.MeshStandardMaterial({ color: 0xa31e22, roughness: 0.35, emissive: 0x5a0608, emissiveIntensity: 0.4 });
        const vasos = [[1.25, 0.9, 0.11], [0.85, 0.2, 0.15], [1.4, -0.75, 0.09], [0.95, -1.2, 0.12]].map(([y, z, r], i) => {
          const pts = []; for (let k = 0; k <= 20; k++) { const x = -W / 2 - 0.05 + (W + 0.1) * k / 20; pts.push(new THREE.Vector3(x, Math.sin(k * 0.7 + i) * 0.08, Math.cos(k * 0.5 + i) * 0.1)); }
          const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, r, 12), mV); m.position.set(0, y, z); S.add(m); return m;
        });
        const capil = [];
        for (let i = 0; i < 7; i++) {
          const x = -2 + i * 0.65, pts = [new THREE.Vector3(x, 1.25, 0.9), new THREE.Vector3(x + 0.08, 1.5, 0.9), new THREE.Vector3(x + 0.18, 1.6, 0.9), new THREE.Vector3(x + 0.28, 1.5, 0.9), new THREE.Vector3(x + 0.34, 1.25, 0.9)];
          const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.03, 8), mV); S.add(m); capil.push(m);
        }
        // sangue correndo (pontos) dentro dos vasos
        const NB = 160, bp = new Float32Array(NB * 3), rr = mulberry32(808), BV = Array.from({ length: NB }, () => [rr(), Math.floor(rr() * 4), rr() - 0.5, rr() - 0.5]);
        const bg = new THREE.BufferGeometry(); bg.setAttribute("position", new THREE.BufferAttribute(bp, 3));
        const bm = new THREE.PointsMaterial({ color: 0xff5a4a, size: 0.07, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
        const sangue = new THREE.Points(bg, bm); sangue.frustumCulled = false; S.add(sangue);
        const cPele = new THREE.Color(0xe2ad85), cRubor = new THREE.Color(0xe8746a);
        function render(t) {
          // 3,81 s ("dilatam"): vasos engrossam e a superfície fica vermelha
          const k = ease.inOutSine(range(t, 3.5, 4.3)), kr = ease.inOutSine(range(t, 1.9, 4.3));
          vasos.forEach((m) => m.scale.set(1, 1 + 0.75 * k, 1 + 0.75 * k));
          capil.forEach((m) => m.scale.set(1, 1, 1));
          mV.emissiveIntensity = 0.4 + 0.8 * k;
          epi.material.color.copy(cPele).lerp(cRubor, 0.25 * kr + 0.45 * k);
          epi.material.emissive.set(0x6a1010); epi.material.emissiveIntensity = 0.5 * k;
          for (let i = 0; i < NB; i++) { const b = BV[i], v = vasos[b[1]], x = -W / 2 + ((b[0] + t * (0.25 + 0.2 * k)) % 1) * W; const r = 0.09 * (1 + 0.75 * k); bp[i * 3] = x; bp[i * 3 + 1] = v.position.y + b[2] * r; bp[i * 3 + 2] = v.position.z + b[3] * r + 0.02; }
          bg.attributes.position.needsUpdate = true;
          // órbita lenta descendo até a face do corte
          const e = ease.inOutSine(range(t, 0, 4.48)), a = lerp(-0.6, 0.35, e), R = lerp(9.5, 6.8, e);
          cam.position.set(Math.sin(a) * R, lerp(5.2, 2.6, e), Math.cos(a) * R);
          cam.lookAt(0, lerp(1.1, 1.25, e), 0);
          st.sol(0, 0, 5);
          st.bloom = 0.45 + 0.35 * k;
          st.draw();
          const c = st.ctx, v = new THREE.Vector3();
          let [x, y] = PELE.proj(v.set(-1.2, 1.8, 0.6), cam);
          PELE.tag(c, x, y, x - 40, 1300, "RUBOR", { cor: PELE.AZUL, a: range(t, 1.96, 2.3) });
          [x, y] = PELE.proj(v.set(1.2, 0.85, 1.5), cam);
          PELE.tag(c, x, y, 430, 1330, k > 0.05 ? "VASOS SE DILATAM" : "VASOS", { cor: k > 0.05 ? PELE.LARANJA : PELE.AZUL, a: range(t, 2.82, 3.1) });
        }
