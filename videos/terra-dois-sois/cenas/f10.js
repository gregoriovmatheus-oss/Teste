/*META {"imports": ["doissois"], "rotulos": [{"de": 3.2, "ate": 5.1, "texto": "<span class=\"k\">ESTUDOS DA NASA</span><br>folhas <span class=\"y\">quase pretas</span>"}, {"de": 5.2, "ate": 6.47, "top": 620, "texto": "para captar a <span class=\"y\">luz vermelha</span>"}], "D0": 6.47} */
        const DS = DOISSOIS;
        const st = T.createToyStage(canvas, { fov: 42, ceu: ["#3a2440", "#f0845a"], nevoa: [8, 70], corNevoa: "#b0604a", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        const chao = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), T.M(0x3a2a22, 0.95)); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; S.add(chao);
        // sol vermelho grande e baixo + o amarelo pequeno e alto
        const SV = DS.estrela(S, { r: 9, tipo: "vermelho", halo: 5, pos: [-14, 14, -110] });
        const SA = DS.estrela(S, { r: 2.2, tipo: "amarelo", halo: 6, pos: [30, 48, -120] });
        st.key.color.set(0xff7a50); st.rim.color.set(0xffd29a); st.rim.intensity = 0.8; st.hemi.intensity = 0.5;
        // folhas (InstancedMesh) em ~70 plantas
        const fs = new THREE.Shape(); fs.moveTo(0, 0); fs.quadraticCurveTo(0.17, 0.25, 0, 0.62); fs.quadraticCurveTo(-0.17, 0.25, 0, 0);
        const fg = new THREE.ShapeGeometry(fs, 4); fg.rotateX(-0.9);
        const fm = T.TOON({ color: 0xffffff, roughness: 0.55, side: THREE.DoubleSide });
        const R = mulberry32(1010), F = [], PL = [];
        for (let p = 0; p < 70; p++) { const x = (R() - 0.5) * 12, z = -R() * 22 + 3, hgt = 0.4 + R() * 0.9; PL.push([x, z, hgt]);
          const n = 7 + Math.floor(R() * 5); for (let k = 0; k < n; k++) F.push({ x, z, y: hgt * (0.35 + 0.65 * k / n), ry: k * 2.4 + R(), s: 0.7 + R() * 0.6, d: Math.hypot(x, z - 3) }); }
        const folhas = new THREE.InstancedMesh(fg, fm, F.length); folhas.castShadow = true; S.add(folhas);
        const caule = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.02, 0.03, 1, 5).translate(0, 0.5, 0), T.M(0x4a5a2a, 0.8), PL.length); caule.castShadow = true; S.add(caule);
        const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), eu = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
        PL.forEach(([x, z, h], i) => { caule.setMatrixAt(i, m4.compose(ps.set(x, 0, z), q.identity(), sc.set(1, h, 1))); });
        const VERDE = new THREE.Color(0x4f9a3a), PRETA = new THREE.Color(0x171019), cc = new THREE.Color();
        // fótons vermelhos caindo nas folhas
        const NP = 500, pp = new Float32Array(NP * 3), pa = new Float32Array(NP * 3);
        for (let i = 0; i < NP; i++) { const f = F[Math.floor(R() * F.length)]; pa.set([f.x, f.y + 0.1, f.z], i * 3); pp[i * 3] = R(); }
        const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pa, 3)); pg.setAttribute("ph", new THREE.BufferAttribute(new Float32Array(Array.from({ length: NP }, (_, i) => pp[i * 3])), 1));
        const pm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uT: { value: 0 }, uA: { value: 0 }, uS: { value: new THREE.Vector3(-14, 14, -110).normalize() } },
          vertexShader: `attribute float ph; uniform float uT; uniform vec3 uS; varying float vA; void main(){ float f = fract(ph + uT * 0.9); vec3 p = position + uS * (1.0 - f) * 6.0;
            vA = smoothstep(0.0, 0.2, f) * (1.0 - smoothstep(0.85, 1.0, f)); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = 70.0 / -mv.z; }`,
          fragmentShader: `uniform float uA; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float a = exp(-dot(d, d) * 18.0) * vA * uA; gl_FragColor = vec4(vec3(1.0, 0.25, 0.1) * a, 1.0); }` });
        const fot = new THREE.Points(pg, pm); fot.frustumCulled = false; S.add(fot);
        function render(t) {
          SV.set(1, t); SA.set(0.8, t);
          // escurecimento em onda, das plantas perto da câmera para longe (3,2 s → 4,6 s)
          F.forEach((f, i) => {
            const k = ease.inOutSine(range(t, 2.9 + f.d * 0.06, 3.7 + f.d * 0.06));
            eu.set(0, f.ry, Math.sin(t * 1.6 + f.ry) * 0.06); q.setFromEuler(eu);
            folhas.setMatrixAt(i, m4.compose(ps.set(f.x, f.y, f.z), q, sc.setScalar(f.s * (1 + 0.15 * k))));
            folhas.setColorAt(i, cc.copy(VERDE).lerp(PRETA, k));
          });
          folhas.instanceMatrix.needsUpdate = true; folhas.instanceColor.needsUpdate = true;
          pm.uniforms.uT.value = t; pm.uniforms.uA.value = range(t, 4.7, 5.1);
          const e = ease.inOutSine(range(t, 0, 6.47));
          cam.position.set(lerp(1.2, -0.6, e), lerp(0.75, 1.5, e), lerp(5.2, 1.4, e));
          cam.lookAt(lerp(-0.5, -1.5, e), lerp(1.4, 1.2, e), lerp(-6, -10, e));
          st.sol(0, -4, 14);
          st.bloom = 0.6;
          st.draw();
        }
