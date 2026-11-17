/*META {"imports": ["avenida"], "css": ".rot-t .selo{display:inline-block;font-family:\"Inter\",sans-serif;font-weight:800;font-size:128px;line-height:1.05;letter-spacing:0.01em;text-transform:uppercase;background:linear-gradient(180deg,#ffffff 35%,#9fd6ff);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 4px 16px rgba(0,0,0,0.65))}.rot-t .sp{display:block;font-family:\"JetBrains Mono\",monospace;font-weight:500;font-size:28px;letter-spacing:0.34em;color:#7cc8ff;margin-bottom:12px;text-transform:uppercase}.rot-t .sl{display:block;width:380px;height:2px;margin:14px auto 0;background:linear-gradient(90deg,rgba(124,200,255,0),#7cc8ff,rgba(124,200,255,0))}", "rotulos": [{"de": 0, "ate": 3.81, "top": 300, "fixo": true, "pulso": 0.2, "texto": "<span class=\"sp\">TEMPO SEM HUMANOS</span><span class=\"selo\">DÉCADAS</span><span class=\"sl\"></span>"}, {"de": 0.3, "ate": 1.95, "texto": "Telhados <span class=\"y\">caem</span>"}, {"de": 2.15, "ate": 3.81, "texto": "Pontes <span class=\"y\">desabam</span>"}], "D0": 3.81} */
        const st = T.createToyStage(canvas, { fov: 46, ceu: ["#7C9CBB", "#E8D6B4"], nevoa: [30, 200], corNevoa: "#cdc4ab", luz: 0.9 });
        const S = st.scene, cam = st.cam;
        const rr = mulberry32(808);
        // margens do córrego (z de -9 a -3) e água
        for (const [z0, z1] of [[-3, 60], [-80, -9]]) { const b = T.mesh(new THREE.BoxGeometry(160, 3, z1 - z0), 0x5f7a3c, S, 0.95); b.position.set(0, -1.5, (z0 + z1) / 2); }
        const fundo = T.mesh(new THREE.BoxGeometry(160, 0.5, 8), 0x4a4434, S, 1); fundo.position.set(0, -2.6, -6);
        const agua = new THREE.Mesh(new THREE.PlaneGeometry(160, 6.2), new THREE.MeshStandardMaterial({ color: 0x4f7f86, roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.85 }));
        agua.rotation.x = -Math.PI / 2; agua.position.set(0, -1.1, -6); S.add(agua);
        // casa de madeira com telhado de duas águas
        const casa = new THREE.Group(); casa.position.set(-5, 0, 6); S.add(casa);
        const parede = T.mesh(T.roundBox(7, 3.6, 5.5, 0.15), 0x9a7a58, casa, 0.95);
        for (let i = 0; i < 3; i++) { const j = T.mesh(new THREE.BoxGeometry(1, 1.2, 0.1), 0x1c1a18, casa, 0.6); j.position.set(-2.2 + i * 2.2, 2.0, 2.78); }
        const porta = T.mesh(new THREE.BoxGeometry(1.1, 2.2, 0.1), 0x4a3424, casa, 0.9); porta.position.set(0.8, 1.1, 2.79); porta.rotation.y = 0.5;
        const madeira = new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.95 });
        const aguas = [1, -1].map((s) => { const p = new THREE.Group(); p.position.set(0, 5.1, 0); casa.add(p); const m = new THREE.Mesh(T.roundBox(7.6, 0.25, 3.8, 0.08), madeira); m.castShadow = m.receiveShadow = true; m.position.set(0, 0, s * 1.65); m.rotation.x = s * 0.62; p.add(m); return { p, m, s }; });
        const restos = T.createBurst(S, { n: 30, seed: 809, cores: [0x6b4a32, 0x8a5a3a, 0xa89a80, 0x5e4330], raio: 3.5, tam: 0.35 });
        // ponte pequena de madeira/aço sobre o córrego (x = 7), dois vãos que quebram no meio
        const ponte = [-1, 1].map((s) => { // s=-1: lado de cá (z=-2), s=1: lado de lá (z=-10)
          const piv = new THREE.Group(); piv.position.set(7, 0.15, s < 0 ? -2.2 : -9.8); S.add(piv);
          const deck = T.mesh(T.roundBox(2.6, 0.3, 3.9, 0.06), 0x6e5440, piv, 0.9); deck.position.z = s < 0 ? -1.95 : 1.95;
          for (const x of [1.2, -1.2]) { const r = T.mesh(new THREE.BoxGeometry(0.1, 0.9, 3.9), 0x5a3f2c, piv, 0.9); r.position.set(x, 0.6, deck.position.z); }
          return { piv, s };
        });
        for (const z of [-2.4, -9.6]) for (const x of [5.9, 8.1]) { const p = T.mesh(new THREE.BoxGeometry(0.4, 2.4, 0.4), 0x6b6258, S, 0.9); p.position.set(x, -0.9, z); }
        // respingos
        const NP = 260, pp = new Float32Array(NP * 3), pv = Array.from({ length: NP }, () => [(rr() - 0.5) * 5, 2 + rr() * 4, (rr() - 0.5) * 4]);
        const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
        const pm = new THREE.PointsMaterial({ color: 0xe8f6f8, size: 0.14, transparent: true, opacity: 0.9, depthWrite: false });
        const pts = new THREE.Points(pg, pm); pts.frustumCulled = false; S.add(pts);
        // mato e árvores tomando tudo
        for (let i = 0; i < 16; i++) { const a = T.arvore(1.6 + rr() * 1.2, T.PAL.verde, 820 + i); const z = rr() < 0.5 ? 2 + rr() * 30 : -12 - rr() * 30; a.position.set(-30 + rr() * 60, 0, z); if (Math.abs(a.position.x - 7) < 4 || (Math.abs(a.position.x + 5) < 6 && Math.abs(z - 6) < 5)) continue; S.add(a); }
        const tuf = new THREE.InstancedMesh(new THREE.ConeGeometry(0.06, 0.8, 4), T.M(0x5d8c34, 0.85), 500); S.add(tuf);
        const o = new THREE.Object3D();
        for (let i = 0; i < 500; i++) { const z = rr() < 0.55 ? -2.8 + rr() * 22 : -9.2 - rr() * 20; o.position.set(-25 + rr() * 50, 0.3, z); o.rotation.set(0, rr() * 6, (rr() - 0.5) * 0.6); o.scale.setScalar(0.6 + rr()); o.updateMatrix(); tuf.setMatrixAt(i, o.matrix); }
        const mad0 = new THREE.Color(0x8a5a3a), podre = new THREE.Color(0x3d3a2c);
        function render(t) {
          // telhado: apodrece, cede no meio e cai para dentro (0,55 a 1,4 s)
          madeira.color.copy(mad0).lerp(podre, range(t, 0, 1.5));
          const q = range(t, 0.55, 1.4), cai = q * q;
          aguas.forEach(({ p, m, s }) => { p.position.y = 5.1 - cai * 3.6; m.rotation.x = s * lerp(0.62, -0.25, ease.inCubic(q)); m.position.z = s * lerp(1.65, 1.2, q); });
          restos.at(t, 1.2, -5, 3.0, 6, 1.1);
          // ponte: racha no meio, os dois vãos giram para baixo e caem (2,55 a 3,3 s)
          const b = range(t, 2.55, 3.3), g = b * b;
          ponte.forEach(({ piv, s }) => { piv.rotation.x = s * g * 1.15; piv.position.y = 0.15 - g * (s < 0 ? 0.6 : 0.9); });
          const sp = t - 3.15;
          pv.forEach(([vx, vy, vz], i) => { const on = sp > 0 && sp < 0.7; pp[i * 3] = 7 + vx * sp; pp[i * 3 + 1] = on ? -1 + vy * sp - 6 * sp * sp : -50; pp[i * 3 + 2] = -6 + vz * sp; });
          pg.attributes.position.needsUpdate = true;
          const e = ease.inOutSine(range(t, 0, 3.81));
          cam.position.set(lerp(-9, 13, e), lerp(5.5, 4.2, e), lerp(19, 9, e));
          cam.lookAt(lerp(-5, 7, e), lerp(3, 0, e), lerp(5, -6, e));
          st.sol(lerp(-5, 7, e), 0, 30);
          st.draw();
        }
