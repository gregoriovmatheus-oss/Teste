/*META {"imports": ["oceano"], "rotulos": [{"de": 2.6, "ate": 5.25, "texto": "<span class=\"k\">PROFUNDIDADE MÉDIA</span><br><span class=\"y\">3.700 m</span>"}], "D0": 5.3} */
        const O = OCEANO, G0 = 14.89;
        try { await document.fonts.load('500 26px "JetBrains Mono"'); } catch (e) {}
        // 1 unidade = 50 m. A antiga superfície do mar fica 74 u acima do chão (3.700 m).
        const st = T.createToyStage(canvas, { fov: 50, ceu: ["#263f68", "#dfa678"], nevoa: [60, 520], corNevoa: "#a8876c", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        const alt = (x, z) => 3.2 * O.fbm(x * 0.03, z * 0.03, 4, 21) + 1.2 * Math.abs(O.ruido(x * 0.012, z * 0.05, 22)) ;
        const cor = (x, z, y, c) => O.mistura(c, 0x6f6152, 0x9a8a72, (y + 2) / 6 + 0.2 * O.ruido(x * 0.1, z * 0.1, 23));
        S.add(O.terreno({ w: 700, d: 900, sx: 100, sz: 120, cz: -300, alt, cor }));
        // nódulos de manganês (InstancedMesh)
        const nodG = new THREE.IcosahedronGeometry(0.35, 0), rr = mulberry32(41), N = 900;
        const nod = new THREE.InstancedMesh(nodG, T.TOON({ color: 0x2a2420, roughness: 0.6, flatShading: true }), N);
        const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
        for (let i = 0; i < N; i++) { const x = (rr() - 0.5) * 120, z = 30 - rr() * 260, s = 0.5 + rr() * 1.2; pv.set(x, alt(x, z) + 0.1, z); q.setFromAxisAngle(sv.set(0, 1, 0), rr() * 6); mm.compose(pv, q, sv.set(s, s * 0.7, s)); nod.setMatrixAt(i, mm); }
        nod.castShadow = true; S.add(nod);
        // fantasma da superfície do mar (3.700 m acima) e régua vertical
        const sup = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshBasicMaterial({ color: 0x4aa3e0, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false, fog: false }));
        sup.rotation.x = -Math.PI / 2; sup.position.y = 74; S.add(sup);
        const grade = new THREE.GridHelper(1400, 70, 0x9fd4ff, 0x9fd4ff); grade.position.y = 74.05; grade.material.transparent = true; grade.material.opacity = 0.35; grade.material.fog = false; S.add(grade);
        const RX = 6, RZ = -28, ry0 = alt(RX, RZ);
        const regua = new THREE.Group(); regua.position.set(RX, ry0, RZ); S.add(regua);
        const mR = T.TOON({ color: 0xfff4dc, roughness: 0.4, emissive: 0x332200 }), mA = T.TOON({ color: 0xffb444, roughness: 0.4, emissive: 0x552a00 });
        const haste = new THREE.Mesh(new THREE.BoxGeometry(0.7, 74 - ry0, 0.7), mR); haste.position.y = (74 - ry0) / 2; regua.add(haste);
        for (let k = 0; k <= 7; k++) { const tk = new THREE.Mesh(new THREE.BoxGeometry(k % 2 ? 2.5 : 4.5, 0.5, 0.5), mA); tk.position.y = 74 - ry0 - k * 10; regua.add(tk); }
        const topo = new THREE.Vector3(RX, 74, RZ), fundo = new THREE.Vector3(RX, ry0, RZ);
        function render(t) {
          const u = t / D;
          // grua: começa na antiga superfície do mar e desce os 3.700 m ao lado da régua; depois voa rente ao chão
          const desc = ease.inOutCubic(range(t, 0, 3.4));
          const fly = Math.max(0, t - 3.0);
          const cy = lerp(86, 5.5, desc), cz = lerp(30, 2, desc) - fly * fly * 3.2 - t * 1.5;
          cam.position.set(lerp(-16, -6, desc), cy, cz);
          cam.lookAt(lerp(RX, 0, range(t, 3.2, 5.3)), lerp(60, 3, ease.inOutSine(range(t, 0, 3.2))), lerp(RZ, cz - 60, range(t, 2.8, 4.6)));
          st.sol(0, cz - 30, 70);
          st.draw();
          const ctx = st.ctx;
          O.etiqueta(ctx, cam, topo, "ANTIGA SUPERFÍCIE · 0 m", { dx: 60, dy: 70, tam: 26, a: 1 - range(t, 2.6, 3.0) });
          O.etiqueta(ctx, cam, fundo, "FUNDO · −3.700 m", { dx: 60, dy: -60, tam: 28, a: range(t, 2.3, 2.7) - range(t, 4.0, 4.3) });
        }
