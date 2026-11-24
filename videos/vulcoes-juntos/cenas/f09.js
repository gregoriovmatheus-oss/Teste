/*META {"imports": ["vulcoes"], "rotulos": [], "D0": 6.59, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const V = VULCOES;
        await V.prepara();
        const st = T.createToyStage(canvas, { fov: 38, ceu: ["#5a5650", "#a89a88"], nevoa: [25, 160], corNevoa: "#9a9084", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0xe8d0b0); st.key.intensity = 1.6; st.hemi.intensity = 0.7; st.sol(0, -10, 40);
        const mk = (c, r, ex) => T.M(c, r, ex);
        const pista = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), T.TOON({ color: 0x6a6660, roughness: 0.95 })); pista.rotation.x = -Math.PI / 2; pista.receiveShadow = true; S.add(pista);
        for (let i = 0; i < 12; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 4), T.TOON({ color: 0xd8c890, roughness: 0.9 })); f.rotation.x = -Math.PI / 2; f.position.set(-12, 0.01, 10 - i * 8); S.add(f); }
        const A1 = V.aviao(mk, { seed: 1 }); S.add(A1.g);
        // frota parada no pátio, coberta de cinza
        const frota = [[-16, -6, 0.3], [16, -10, -0.2], [-30, -28, 0.4], [26, -34, -0.3], [-6, -48, 0.2], [40, -60, -0.4], [-44, -62, 0.5]].map(([x, z, r], i) => { const a = V.aviao(mk, { seed: 2 + i, simples: true, faixa: [0x9a2a2a, 0x2a7a5a, 0x2a5a9a][i % 3] }); a.g.position.set(x, 0, z); a.g.rotation.y = r; S.add(a.g); return a; });
        const terminal = new THREE.Mesh(new THREE.BoxGeometry(70, 8, 10), T.TOON({ color: 0x8a8c90, roughness: 0.4 })); terminal.position.set(0, 4, -85); S.add(terminal);
        const vid = new THREE.Mesh(new THREE.PlaneGeometry(68, 4), T.TOON({ color: 0x2a3440, roughness: 0.15, metalness: 0.4 })); vid.position.set(0, 5, -79.9); S.add(vid);
        const torre = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 22, 10), T.TOON({ color: 0x9a9ca0 })); torre.position.set(34, 11, -80); S.add(torre);
        // cinza sugada pela turbina: partículas que derretem (brilho laranja) dentro do motor
        const MOT = A1.motores[0].clone(); const N = 700, R = mulberry32(9), P = new Float32Array(N * 3), SDp = new Float32Array(N * 4);
        for (let i = 0; i < N; i++) SDp.set([R(), R() * 6.283, Math.sqrt(R()), R()], i * 4);
        const gp = new THREE.BufferGeometry(); gp.setAttribute("position", new THREE.BufferAttribute(P, 3)); gp.setAttribute("sd", new THREE.BufferAttribute(SDp, 4));
        const UP = { uT: { value: 0 }, uC: { value: MOT }, uK: { value: 0 } };
        const pm = new THREE.ShaderMaterial({ uniforms: UP, transparent: true, depthWrite: false,
          vertexShader: `attribute vec4 sd; uniform float uT, uK; uniform vec3 uC; varying float vQ; varying float vA;
            void main(){ float f = fract(sd.x + uT * 0.45); float r = mix(2.2, 0.05, f * f) * sd.z; float a = sd.y + f * 4.0;
              vec3 p = uC + vec3(cos(a) * r, sin(a) * r, mix(6.0, -0.4, f));
              vQ = smoothstep(0.75, 0.95, f); vA = smoothstep(0.0, 0.15, f) * uK;
              vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = (0.06 + 0.05 * sd.w) * projectionMatrix[1][1] * 960.0 / -mv.z; }`,
          fragmentShader: `varying float vQ; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float k = 1.0 - smoothstep(0.15, 0.5, length(d)); if (k * vA < 0.02) discard;
            gl_FragColor = vec4(mix(vec3(0.45, 0.42, 0.4), vec3(1.6, 0.6, 0.15), vQ), k * vA); }` });
        const pp = new THREE.Points(gp, pm); pp.frustumCulled = false; S.add(pp);
        const brasa = V.brilho(0xff6a20, 1.4, "suave", 0); brasa.position.copy(MOT).add(new THREE.Vector3(0, 0, -0.6)); S.add(brasa);
        const CZ = V.cinza(S, { n: 1500, area: [14, 14], centro: [0, 0, -2], alt: 10, cor: 0xb0a89c, tam: 0.06, vel: 0.6, op: 0.7 });
        const alvo = new THREE.Vector3();
        function render(t) {
          // a hélice desacelera; a cinza é sugada e derrete em "derrete" (2 s)
          const giro = 14 * t - 3.0 * t * t * 0.5 * range(t, 0, 3); A1.fans.forEach((f) => (f.rotation.z = giro));
          UP.uT.value = t; UP.uK.value = range(t, 1.4, 1.8) * (1 - range(t, 3.4, 3.8));
          brasa.material.opacity = 0.9 * range(t, 1.95, 2.3) * (1 - range(t, 3.4, 3.8));
          CZ.update(t);
          // câmera: na boca da turbina → recua até o pátio cheio de aviões parados
          const e = ease.inOutCubic(range(t, 2.9, 6.4)), e0 = ease.inOutSine(range(t, 0, 2.9));
          cam.position.set(lerp(MOT.x + lerp(0.9, 1.6, e0), -14, e), lerp(MOT.y + 0.3, 14, e), lerp(MOT.z + lerp(2.4, 3.6, e0), 30, e));
          alvo.set(lerp(MOT.x, -2, e), lerp(MOT.y, 1, e), lerp(MOT.z - 0.5, -28, e)); cam.lookAt(alvo);
          st.bloom = 0.5 + 0.4 * UP.uK.value;
          st.draw();
          const x = st.ctx, a = V.vis(st);
          V.etq(x, "CINZA DERRETE NA TURBINA", MOT.clone().add(new THREE.Vector3(0, 0, -0.4)), cam, a * range(t, 2.0, 2.3) * (1 - range(t, 3.2, 3.45)), { cor: V.LARANJA, dy: 260 });
          V.txt(x, "ISLÂNDIA · 2010", 540, 700, { tam: 32, cor: V.AZUL, a: a * range(t, 3.6, 3.9), esp: 0.3 });
          V.txt(x, "um só vulcão", 540, 760, { fonte: "inter", peso: 300, tam: 56, a: a * range(t, 4.7, 5.0), esp: 0 });
          const n = 100;
          V.txt(x, `${n} mil voos`, 540, 860, { fonte: "inter", peso: 800, tam: 104, a: a * range(t, 5.55, 5.7), esp: 0 });
          V.txt(x, "CANCELADOS", 540, 950, { tam: 34, cor: V.LARANJA, a: a * range(t, 5.9, 6.15), esp: 0.32 });
        }
