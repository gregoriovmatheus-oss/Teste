/*META {"imports": ["avenida"], "rotulos": [{"de": 1.0, "ate": 1.9, "texto": "Mas nem <span class=\"y\">tudo cai</span>"}, {"de": 2.0, "ate": 4.4, "texto": "<span class=\"k\">REPRESAS</span><br><span class=\"y\">De pé</span>"}, {"de": 5.6, "ate": 6.75, "texto": "<span class=\"y\">4.500</span> anos"}, {"de": 6.8, "ate": 8.22, "texto": "<span class=\"k\">1 SÉCULO</span><br><span class=\"y\">2%</span> da idade delas"}], "D0": 8.22} */
        const st = T.createToyStage(canvas, { fov: 48, ceu: ["#6E9BCB", "#EAD8B8"], nevoa: [80, 420], corNevoa: "#c9c6b6", luz: 0.95 });
        const S = st.scene, cam = st.cam;
        const rr = mulberry32(909);
        // ---------- represa em arco (concreto) num cânion ----------
        const CZ = 50, RI = 56, RE = 63, PH = 0.5, HD = 40;
        const sh = new THREE.Shape();
        const N = 28;
        for (let i = 0; i <= N; i++) { const f = -PH + (2 * PH * i) / N; const p = [RI * Math.sin(f), RI * Math.cos(f) - CZ]; i ? sh.lineTo(...p) : sh.moveTo(...p); }
        for (let i = N; i >= 0; i--) { const f = -PH + (2 * PH * i) / N; sh.lineTo(RE * Math.sin(f), RE * Math.cos(f) - CZ); }
        const dg = new THREE.ExtrudeGeometry(sh, { depth: HD, bevelEnabled: false, curveSegments: 2 }); dg.rotateX(-Math.PI / 2); dg.computeVertexNormals();
        const damMat = new THREE.MeshStandardMaterial({ color: 0x9d988e, roughness: 0.95 });
        const dam = new THREE.Mesh(dg, damMat); dam.castShadow = dam.receiveShadow = true; S.add(dam);
        // faixas de junta no paramento (instanciadas)
        const jun = new THREE.InstancedMesh(new THREE.BoxGeometry(0.25, HD, 0.3), T.M(0xa9a397, 0.9), 13); S.add(jun);
        const o = new THREE.Object3D();
        for (let i = 0; i < 13; i++) { const f = -PH + 0.07 + (2 * PH - 0.14) * i / 12; o.position.set(RI * Math.sin(f) * 0.995, HD / 2, CZ - RI * Math.cos(f) * 0.995); o.rotation.set(0, -f, 0); o.updateMatrix(); jun.setMatrixAt(i, o.matrix); }
        // paredões do cânion
        const rocha = T.M(0x8d7e6c, 0.95);
        for (const s of [1, -1]) for (let k = 0; k < 7; k++) {
          const m = T.mesh(new THREE.DodecahedronGeometry(1, 1), rocha, S); m.scale.set(20 + rr() * 10, 30 + rr() * 22, 22 + rr() * 10);
          m.position.set(s * (40 + rr() * 14 + k * 2), 10 + rr() * 8, -40 + k * 17); m.rotation.set(rr(), rr() * 3, rr());
        }
        const chao = T.mesh(new THREE.PlaneGeometry(600, 600), 0x6f7a4a, S, 0.95); chao.rotation.x = -Math.PI / 2; chao.position.y = -0.2;
        const lago = new THREE.Mesh(new THREE.PlaneGeometry(200, 220), new THREE.MeshStandardMaterial({ color: 0x3c6f86, roughness: 0.06, metalness: 0.35 }));
        lago.rotation.x = -Math.PI / 2; lago.position.set(0, HD - 3, -9 - 110); S.add(lago);
        const rio = new THREE.Mesh(new THREE.PlaneGeometry(14, 160), new THREE.MeshStandardMaterial({ color: 0x4f8596, roughness: 0.1, metalness: 0.3 }));
        rio.rotation.x = -Math.PI / 2; rio.position.set(0, 0.05, 84); S.add(rio);
        // jato do vertedouro (a represa continua funcionando)
        const NJ = 700, jp = new Float32Array(NJ * 3), jv = Array.from({ length: NJ }, () => [rr(), (rr() - 0.5) * 2.4, (rr() - 0.5) * 0.8]);
        const jg = new THREE.BufferGeometry(); jg.setAttribute("position", new THREE.BufferAttribute(jp, 3));
        const jet = new THREE.Points(jg, new THREE.PointsMaterial({ color: 0xe9f6fa, size: 0.35, transparent: true, opacity: 0.85, depthWrite: false })); jet.frustumCulled = false; S.add(jet);
        // floresta crescendo nas encostas (time-lapse): instanciada
        const NT = 140, TT = [];
        for (let i = 0; i < NT; i++) { const s = rr() < 0.5 ? 1 : -1; TT.push([s * (9 + rr() * 26), 6 + rr() * 80, 0.6 + rr() * 0.9, rr()]); }
        const tro = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.4, 1, 6), T.M(0x5a4231, 0.9), NT), copa = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), T.M(0x4a7a32, 0.85), NT);
        S.add(tro, copa);
        // ---------- pirâmides no deserto (segunda cena) ----------
        const PS = new THREE.Scene();
        PS.fog = new THREE.Fog(0xe8cfa2, 90, 420); PS.environment = S.environment;
        const ceuDia = T.gradTex("#5C93CF", "#F2D7A6"), ceuNoite = T.gradTex("#0b1230", "#3a3354");
        PS.background = ceuDia;
        const ph = new THREE.HemisphereLight(0xcfe0ff, 0x9a7a50, 0.8), sol = new THREE.DirectionalLight(0xffe0b0, 3.4);
        sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); Object.assign(sol.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 400 }); sol.shadow.bias = -0.0005;
        PS.add(ph, sol, sol.target);
        const areia = T.mesh(new THREE.PlaneGeometry(900, 900), 0xd9b77e, PS, 0.95); areia.rotation.x = -Math.PI / 2;
        for (let i = 0; i < 18; i++) { const d = T.mesh(new THREE.SphereGeometry(1, 16, 10), 0xd3ae72, PS, 0.95); d.scale.set(30 + rr() * 40, 3 + rr() * 5, 18 + rr() * 20); const a = rr() * 6.28, R = 90 + rr() * 140; d.position.set(Math.cos(a) * R, -1, Math.sin(a) * R); d.rotation.y = rr() * 3; }
        const pir = (lado, alt, x, z) => { const g = new THREE.ConeGeometry(lado / Math.SQRT2, alt, 4, 6); g.translate(0, alt / 2, 0); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xd6b47a, roughness: 0.92, flatShading: true })); m.rotation.y = Math.PI / 4; m.position.set(x, 0, z); m.castShadow = m.receiveShadow = true; PS.add(m); return m; };
        pir(23, 14.6, 0, 0); pir(21.5, 14.3, -26, -30); pir(10.5, 6.5, -44, -58);
        // degraus: anéis de blocos (instanciados) na grande pirâmide
        const nDeg = 22, deg = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.12, 0.2), T.M(0xc7a56c, 0.95), nDeg * 4); PS.add(deg);
        for (let k = 0; k < nDeg; k++) { const y = (k + 0.5) * 14.6 / nDeg, h = 11.5 * (1 - y / 14.6); for (let s = 0; s < 4; s++) { const a = s * Math.PI / 2; o.position.set(Math.sin(a) * h, y, Math.cos(a) * h); o.rotation.set(0, a, 0); o.scale.set(2 * h, 1, 1); o.updateMatrix(); deg.setMatrixAt(k * 4 + s, o.matrix); } }
        const cam2 = new THREE.PerspectiveCamera(44, 1080 / 1920, 0.5, 1200);
        st.extraWarm = [{ renderer: st.renderer, scene: PS, camera: cam2 }];
        const T1 = 4.45;
        function render(t) {
          if (t < T1) {
            const cres = ease.outCubic(range(t, 0.2, 4.2));
            TT.forEach(([x, z, s, b], i) => {
              const k = clamp((cres - b * 0.5) / 0.5) * s, y = 0;
              o.position.set(x, y, z); o.rotation.set(0, 0, 0); o.scale.set(1.5 * k + 1e-3, 6 * k + 1e-3, 1.5 * k + 1e-3); o.updateMatrix(); tro.setMatrixAt(i, o.matrix);
              o.position.set(x, y + 6.5 * k, z); o.scale.set(3.4 * k + 1e-3, 3 * k + 1e-3, 3.4 * k + 1e-3); o.updateMatrix(); copa.setMatrixAt(i, o.matrix);
            });
            tro.instanceMatrix.needsUpdate = true; copa.instanceMatrix.needsUpdate = true;
            jv.forEach(([ph0, dx, dz], i) => { const u = (t * 0.9 + ph0) % 1; jp[i * 3] = dx; jp[i * 3 + 1] = 14 - 30 * u * u * 0.5 + u * 2; jp[i * 3 + 2] = -5 + u * 16 + dz; if (jp[i * 3 + 1] < 0.2) jp[i * 3 + 1] = 0.2 + (u % 0.1) * 6; });
            jg.attributes.position.needsUpdate = true;
            const e = ease.inOutSine(range(t, 0, T1));
            cam.position.set(lerp(-26, 8, e), lerp(6, 62, e), lerp(120, 70, e));
            cam.lookAt(0, lerp(24, 26, e), lerp(-6, -40, e));
            st.sol(0, -10, 90, 20);
            st.draw(S, cam, { cor: "#0b0a12", a: range(t, T1 - 0.2, T1) });
          } else {
            const u = t - T1;
            // dias passando (time-lapse): o Sol cruza o céu ~1 vez por segundo
            const fase = u * 5.4 + 0.6, alt = Math.sin(fase), az = Math.cos(fase);
            const dia = clamp(alt * 2.5 + 0.35);
            sol.position.set(az * 120, Math.max(8, alt * 120), -40 + alt * 10); sol.target.position.set(0, 0, 0);
            sol.intensity = 3.4 * dia; ph.intensity = 0.25 + 0.6 * dia;
            PS.background = dia > 0.45 ? ceuDia : ceuNoite;
            PS.fog.color.setHex(dia > 0.45 ? 0xe8cfa2 : 0x2a2a40);
            const a = 0.9 + u * 0.18, R = lerp(58, 46, ease.inOutSine(range(u, 0, 3.77)));
            cam2.position.set(Math.sin(a) * R, lerp(6, 16, range(u, 0, 3.77)), Math.cos(a) * R);
            cam2.lookAt(-4, 7, -6);
            st.draw(PS, cam2, { cor: "#0b0a12", a: 1 - range(u, 0, 0.25) });
          }
        }
