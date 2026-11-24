/*META {"imports": ["terra", "vulcoes"], "rotulos": [], "D0": 4.96, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const V = VULCOES;
        await V.prepara();
        const st = T.createToyStage(canvas, { fov: 34, ceu: "#000000", nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.hemi.intensity = 0; st.key.intensity = 0; st.rim.intensity = 0; st.key.castShadow = false;
        S.add(TERRA.createCeu({ seed: 61, n: 4500, via: 0.45 }));
        const E = await TERRA.createTerra({ raio: 1 }); S.add(E.group);
        E.sol.set(0.6, 0.3, 1); E.u.luzes.value = 0.6;
        const LON = 118.0, LAT = -8.25;   // Tambora, ilha de Sumbawa (Indonésia)
        const PT = E.ponto(LON, LAT, 1.0);
        // marcador: brilho + anéis de choque
        const pin = V.brilho(0xff7a30, 0.12, "suave", 1); pin.position.copy(PT).multiplyScalar(1.01); E.earth.add(pin);
        const aneis = [0, 1, 2].map(() => { const r = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 48), new THREE.MeshBasicMaterial({ color: 0xff8a4c, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
          r.position.copy(PT).multiplyScalar(1.006); r.lookAt(PT.clone().multiplyScalar(3)); E.earth.add(r); return r; });
        // véu de aerossol de enxofre espalhando a partir do Tambora até cobrir o planeta
        const VU = { uS: { value: 0 }, uP: { value: PT.clone().normalize() }, uT: { value: 0 } };
        const veu = new THREE.Mesh(new THREE.SphereGeometry(1.018, 96, 48), new THREE.ShaderMaterial({ uniforms: VU, transparent: true, depthWrite: false,
          vertexShader: "varying vec3 vP; varying vec3 vN; varying vec3 vW; void main(){ vP = normalize(position); vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
          fragmentShader: `uniform float uS, uT; uniform vec3 uP; varying vec3 vP; varying vec3 vN; varying vec3 vW;
            float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
            float n3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
              return mix(mix(mix(h(i), h(i + vec3(1,0,0)), f.x), mix(h(i + vec3(0,1,0)), h(i + vec3(1,1,0)), f.x), f.y), mix(mix(h(i + vec3(0,0,1)), h(i + vec3(1,0,1)), f.x), mix(h(i + vec3(0,1,1)), h(i + vec3(1,1,1)), f.x), f.y), f.z); }
            void main(){ float d = acos(clamp(dot(vP, uP), -1.0, 1.0));
              float lat = abs(vP.y - uP.y); float alcance = uS * 3.4 - lat * 0.8 * (1.0 - uS);   // espalha mais rápido na faixa de latitude
              float ru = n3(vP * 7.0 + vec3(uT * 0.15, 0.0, 0.0)) * 0.6 + n3(vP * 15.0) * 0.4;
              float a = smoothstep(alcance, alcance - 0.5, d + (ru - 0.5) * 0.5) * (0.45 + 0.35 * ru);
              float fr = 1.0 - abs(dot(normalize(vN), normalize(cameraPosition - vW)));
              gl_FragColor = vec4(mix(vec3(0.78, 0.74, 0.62), vec3(0.95, 0.85, 0.6), fr), a * 0.85); }` }));
        E.earth.add(veu);
        function render(t) {
          E.aim(LON - 25 + 30 * ease.inOutSine(range(t, 0, 4.96)), LAT + 6);
          // 1815: Tambora explode em "vulcão" (2,1 s); o véu se espalha e apaga o verão
          const ex = range(t, 2.05, 2.2);
          pin.scale.setScalar(0.12 + 0.18 * ex + 0.04 * Math.sin(t * 9) * ex);
          aneis.forEach((r, i) => { const f = ((t - 2.1) * 0.8 + i / 3) % 1; const on = t > 2.1 ? 1 : 0; r.scale.setScalar(0.02 + 0.25 * f); r.material.opacity = on * 0.9 * (1 - f); });
          VU.uS.value = ease.inOutSine(range(t, 2.3, 4.96)); VU.uT.value = t;
          E.u.luzSol.value = 1 - 0.35 * range(t, 3.4, 4.6);
          // câmera: perto da Indonésia → recua para ver o planeta inteiro coberto
          const e = ease.inOutCubic(range(t, 0.2, 4.6));
          const d = lerp(1.9, 5.6, e);
          cam.position.set(lerp(0.1, -0.3, e), lerp(-0.25, -0.1, e), d);
          cam.lookAt(0, lerp(-0.42, -0.95, e), 0);
          st.bloom = 0.7;
          st.draw();
          const x = st.ctx, a = V.vis(st);
          const sai1 = 1 - range(t, 3.3, 3.55);
          V.txt(x, "1815", 540, 800, { fonte: "inter", peso: 800, tam: 160, cor: "#fff", a: a * range(t, 0.25, 0.5) * sai1, esp: 0 });
          V.etq(x, "TAMBORA · INDONÉSIA", PT.clone().applyMatrix4(E.earth.matrixWorld), cam, a * range(t, 2.45, 2.75) * sai1, { cor: V.LARANJA, dy: 180 });
          V.txt(x, "1816", 540, 790, { fonte: "inter", peso: 800, tam: 160, cor: "#fff", a: a * range(t, 3.45, 3.75), esp: 0 });
          V.txt(x, "O ANO SEM VERÃO", 540, 900, { tam: 34, cor: V.LARANJA, a: a * range(t, 3.5, 3.85), esp: 0.3 });
        }
