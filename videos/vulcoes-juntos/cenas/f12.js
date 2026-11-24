/*META {"imports": ["vulcoes"], "rotulos": [{"de": 0.6, "ate": 2.3, "texto": "Depois de <span class=\"y\">alguns anos</span>"}, {"de": 3.2, "ate": 4.77, "texto": "o sol <span class=\"y\">volta</span>"}], "D0": 4.77, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const V = VULCOES;
        await V.prepara();
        const st = T.createToyStage(canvas, { fov: 42, ceu: "#5a5650", nevoa: [30, 220], corNevoa: "#6a645c", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0xb8b0a8); st.key.intensity = 0.8; st.hemi.intensity = 0.6; st.sol(0, -10, 50);
        const DU = { a: { value: new THREE.Color() }, b: { value: new THREE.Color() } };
        const domo = new THREE.Mesh(new THREE.SphereGeometry(500, 24, 12), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: DU,
          vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
          fragmentShader: "uniform vec3 a, b; varying vec3 vP; void main(){ gl_FragColor = vec4(mix(b, a, pow(clamp(vP.y, 0.0, 1.0), 0.6)), 1.0); }" }));
        S.add(domo); S.background = null;
        const chaoM = T.TOON({ color: 0x7a766e, roughness: 1 });
        const chao = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), chaoM); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; S.add(chao);
        const morroM = T.TOON({ color: 0x6a665e, roughness: 1, flatShading: true }), R = mulberry32(1212);
        for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8, 0, 6.283, 0, Math.PI / 2), morroM); m.scale.set(30 + R() * 30, 8 + R() * 10, 20 + R() * 10); m.position.set(-120 + i * 30, 0, -120 - R() * 50); S.add(m); }
        const arvM = []; for (let i = 0; i < 14; i++) { const a = T.arvore(1 + R() * 0.5, 0x5a5a50, 90 + i); a.position.set((i % 2 ? 1 : -1) * (14 + R() * 30), 0, -30 - R() * 50); S.add(a); a.traverse((o) => { if (o.isMesh && o.material.color && o.position.y > 1) arvM.push(o); }); }
        for (let i = 0; i < 6; i++) { const c = T.predio({ w: 4, d: 4, h: 3 + R() * 2, cor: 0xb89a7a, seed: 30 + i }); c.position.set(-14 + i * 6, 0, -70 - (i % 2) * 6); S.add(c); }
        // nuvens pesadas que se abrem
        const nuv = []; for (let i = 0; i < 12; i++) { const n = T.nuvem(400 + i, 0x5a5650); n.scale.setScalar(10 + (i % 3) * 4); n.position.set(-90 + i * 16, 34 + (i % 2) * 6, -110 - (i % 3) * 12); S.add(n); nuv.push([n, n.position.x]); }
        // sol
        const SOLP = new THREE.Vector3(4, 46, -160);
        const disco = new THREE.Mesh(new THREE.CircleGeometry(5, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2d0).multiplyScalar(3), toneMapped: false, fog: false, transparent: true, opacity: 0 })); disco.position.copy(SOLP); S.add(disco);
        const halo = V.brilho(0xffd890, 90, "suave", 0); halo.position.copy(SOLP); S.add(halo);
        // chuva
        const NR = 2400, rp = new Float32Array(NR * 6), rs = new Float32Array(NR * 2);
        for (let i = 0; i < NR; i++) { const x = (R() - 0.5) * 40, y = R() * 24, z = -R() * 40 + 6; rp.set([x, y, z, x - 0.1, y - 1.0, z], i * 6); rs[i * 2] = rs[i * 2 + 1] = R(); }
        const rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.BufferAttribute(rp, 3)); rg.setAttribute("s", new THREE.BufferAttribute(rs, 1));
        const rm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: { value: 0 }, uA: { value: 0 } },
          vertexShader: "attribute float s; uniform float uT; void main(){ vec3 p = position; p.y = mod(p.y - uT * 24.0 - s * 24.0, 24.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }",
          fragmentShader: "uniform float uA; void main(){ gl_FragColor = vec4(0.82, 0.87, 0.95, 0.45 * uA); }" });
        const chuva = new THREE.LineSegments(rg, rm); chuva.frustumCulled = false; S.add(chuva);
        const C = new THREE.Color(), CA = [0x4a4744, 0x3e7ad0], CB = [0x8a8278, 0xf4d8a8], alvo = new THREE.Vector3();
        function render(t) {
          // chuva em "chuva" (1,4 s) lava o céu; o sol volta em "sol" (3 s): céu azul, verde volta
          const ch = range(t, 1.3, 1.7) * (1 - range(t, 3.4, 4.2)), lv = ease.inOutSine(range(t, 2.0, 4.2)), sl = ease.inOutSine(range(t, 2.9, 4.4));
          rm.uniforms.uT.value = t; rm.uniforms.uA.value = ch;
          DU.a.value.set(CA[0]).lerp(C.set(CA[1]), lv); DU.b.value.set(CB[0]).lerp(C.set(CB[1]), lv);
          S.fog.color.set(0x6a645c).lerp(C.set(0xe8d8c0), lv);
          nuv.forEach(([n, x0]) => { n.position.x = x0 + Math.sign(x0 + 1) * 70 * ease.inCubic(range(t, 2.0, 4.6)); });
          chaoM.color.set(0x7a766e).lerp(C.set(0x6a8a3a), sl); morroM.color.set(0x6a665e).lerp(C.set(0x4a7a3a), sl);
          arvM.forEach((o) => o.material.color && o.material.color.set(0x5a5a50).lerp(C.set(0x3f7a32), sl));
          disco.material.opacity = sl; halo.material.opacity = 0.8 * sl;
          st.key.color.set(0xb8b0a8).lerp(C.set(0xffd8a0), sl); st.key.intensity = lerp(0.8, 3.0, sl); st.hemi.intensity = lerp(0.6, 0.75, sl);
          // câmera: grua subindo devagar e inclinando para o céu
          const e = ease.inOutSine(range(t, 0, 4.77));
          cam.position.set(lerp(-2, 1, e), lerp(2.0, 4.5, e), lerp(14, 8, e));
          alvo.set(0, lerp(6, 16, e), -60); cam.lookAt(alvo);
          st.bloom = 0.4 + 0.5 * sl;
          st.draw();
          const [sx, sy] = V.proj(SOLP, cam);
          V.raios2D(st.ctx, sx, sy, sl * V.vis(st), { n: 16, seed: 12, giro: t * 0.05 });
        }
