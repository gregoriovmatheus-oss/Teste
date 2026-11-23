/*META {"imports": ["terra", "doissois"], "rotulos": [{"de": 3.15, "ate": 4.6, "texto": "o <span class=\"y\">dobro</span><br>de energia"}, {"de": 4.65, "ate": 6.39, "texto": "os oceanos<br><span class=\"y\">evaporariam</span>"}], "D0": 6.39} */
        const DS = DOISSOIS;
        const st = T.createToyStage(canvas, { fov: 40, ceu: "#000000", nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.hemi.intensity = 0; st.key.intensity = 0; st.rim.intensity = 0; st.key.castShadow = false;
        S.add(TERRA.createCeu({ seed: 41, n: 4500, via: 0.5 }));
        const E = await DS.terraDupla({ raio: 1 }); S.add(E.group); E.aim(-30, 8);
        // dois sóis iguais, um em cada canto de cima
        const PA = new THREE.Vector3(-3.0, 5.2, -1.2), PB = new THREE.Vector3(3.0, 5.2, -1.2);
        const SA = DS.estrela(S, { r: 0.75, tipo: "amarelo", halo: 8, pos: PA.toArray() });
        const SB = DS.estrela(S, { r: 0.75, tipo: "amarelo", halo: 8, pos: PB.toArray() });
        const FA = DS.feixe(S, 0xffd9a0), FB = DS.feixe(S, 0xffd9a0);
        E.u.s1.value.copy(PA); E.u.s2.value.copy(PB);
        // vapor subindo dos oceanos (Points radiais)
        const N = 1400, R = mulberry32(404), dir = new Float32Array(N * 3), ph = new Float32Array(N);
        for (let i = 0; i < N; i++) { const u = R() * 2 - 1, th = R() * 6.283, s = Math.sqrt(1 - u * u); dir.set([s * Math.cos(th), u, s * Math.sin(th)], i * 3); ph[i] = R(); }
        const vg = new THREE.BufferGeometry(); vg.setAttribute("position", new THREE.BufferAttribute(dir, 3)); vg.setAttribute("ph", new THREE.BufferAttribute(ph, 1));
        const vm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uT: { value: 0 }, uE: { value: 0 } },
          vertexShader: `attribute float ph; uniform float uT, uE; varying float vA; void main(){ float f = fract(ph + uT * 0.35); vec3 p = position * (1.015 + f * 0.38 * uE);
            vA = uE * (1.0 - f) * smoothstep(0.0, 0.1, f); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = (3.0 + 5.0 * f) * 6.0 / -mv.z; }`,
          fragmentShader: `varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float a = exp(-dot(d, d) * 14.0) * vA * 0.5; gl_FragColor = vec4(vec3(0.95, 0.93, 0.9) * a, 1.0); }` });
        const vap = new THREE.Points(vg, vm); vap.frustumCulled = false; S.add(vap);
        const C1 = new THREE.Vector3(1.05, 1.0, 0.92);
        function render(t) {
          // o segundo sol "acende" quando é dito (0,4 – 1,4 s)
          const s2 = ease.inOutCubic(range(t, 0.35, 1.4));
          SA.set(1, t); SB.set(s2, t * 1.1); SB.group.scale.setScalar(0.3 + 0.7 * s2);
          E.u.c1.value.copy(C1); E.u.c2.value.copy(C1).multiplyScalar(s2);
          const ener = ease.inOutSine(range(t, 3.2, 4.2));
          FA.de(PA, E.group.position, 0.55, 0.5 + 0.5 * ener, t); FB.de(PB, E.group.position, 0.55, s2 * (0.5 + 0.5 * ener), t);
          // oceanos evaporando a partir de "oceanos" (4,66 s)
          const ev = ease.inOutSine(range(t, 4.6, 6.3));
          E.u.seco.value = 0.92 * ev; E.u.vapor.value = 0.45 * Math.sin(Math.PI * Math.min(1, ev * 1.3)) + 0.1 * ev; E.u.nuvens.value = 0.85 * (1 - ev * 0.8);
          E.u.atmo.value = 1 + ev * 0.8; E.u.giro.value = t * 0.004;
          vm.uniforms.uT.value = t; vm.uniforms.uE.value = ev;
          E.earth.rotation.y = -(-30 + 90) * Math.PI / 180 + t * 0.05;
          // câmera: Terra embaixo, sóis em cima; aproxima devagar
          const e = ease.inOutSine(range(t, 0, 6.39));
          cam.position.set(lerp(0.6, -0.2, e), lerp(-1.2, -0.4, e), lerp(7.6, 4.6, e));
          cam.lookAt(0, lerp(2.4, 1.55, e), 0);
          st.bloom = 0.8 + 0.2 * ener;
          st.draw();
        }
