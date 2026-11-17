/*META {"imports": ["lua"], "rotulos": [{"de": 0.7, "ate": 3.0, "texto": "Leões caçam<br><span class=\"y\">no escuro</span>"}, {"de": 4.0, "ate": 5.95, "sai": false, "texto": "Presas<br><span class=\"y\">expostas</span>"}], "D0": 5.95} */
        // f07 — savana numa noite sem lua: dois leões avançam agachados no capim; as zebras pastam sem ver. No fim, elas levantam a cabeça e os leões arrancam.
        const st = T.createToyStage(canvas, { fov: 42, ceu: "#02040a", nevoa: [30, 260], corNevoa: "#0b1422", nuvens: 0, exposicao: 1.4 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.45;
        S.environment = null;
        LUA.ceuDome(S, { topo: "#02050c", horiz: "#13213a", base: "#05080c" });
        const est = LUA.estrelas(S, { n: 3600, r: 1200, so: "cima", seed: 71 }); est.mat.uniforms.uA.value = 1.6;
        const via = LUA.viaLactea(S, { r: 1150, seed: 72, normal: new THREE.Vector3(0.7, 0.3, 0.65).normalize() }); via.set(0.55);
        const hgt = (x, z) => 0.25 * Math.sin(x * 0.1) * Math.cos(z * 0.13) + 4 * smoothstep(-60, -180, z);
        LUA.terreno(S, hgt, { w: 400, d: 300, seg: 70, cor: 0x4f4a30, cz: -80 });
        const gr = LUA.grama(S, { n: 2600, area: [-14, 26, -16, 5], seed: 73, cor: 0x9a8650, alt: [0.25, 0.7], h: hgt });
        const rr = mulberry32(74);
        for (let i = 0; i < 9; i++) { const x = -40 + i * 12 + rr() * 6, z = -35 - rr() * 60; const a = LUA.acacia(1.4 + rr() * 0.8, 75 + i, 0x2c3420); a.position.set(x, hgt(x, z), z); S.add(a); }
        const leoes = [0, 1].map((i) => { const l = A.createAnimal("leao", { fase: i * 0.45 }); l.group.scale.setScalar(0.95); S.add(l.group); return l; });
        const zebras = [[13, -6, 2.6], [16, -8.5, -2.2], [18.5, -5.5, 0.8], [21, -9, 3.6]].map(([x, z, ry], i) => { const zb = A.createAnimal("zebra", { fase: i * 0.3 }); zb.group.position.set(x, hgt(x, z), z); zb.group.rotation.y = ry; S.add(zb.group); return zb; });
        st.key.color.set(0x8ea6d8); st.key.intensity = 0.9; st.sol(6, -2, 30); st.key.position.set(-10, 30, 20);
        st.hemi.color.set(0x3a5682); st.hemi.groundColor.set(0x14100a); st.hemi.intensity = 0.65;
        st.rim.color.set(0x9db8e8); st.rim.intensity = 1.4; st.rim.position.set(30, 12, -30);
        function render(t) {
          gr.update(t, 0.6);
          const corre = ease.inCubic(range(t, 5.0, 5.95));
          leoes.forEach((l, i) => {
            const x = -5 - i * 2.2 + t * 0.9 + corre * 3.5, z = 1.5 + i * 1.6 - t * 0.35;
            l.group.position.set(x, hgt(x, z) - 0.28 * (1 - corre), z);
            A.face(l.group, 1, -0.4);
            l.update(t, { passo: lerp(0.65, 2.3, corre), amp: lerp(0.32, 0.6, corre), cabeca: -0.12 });
          });
          const alerta = ease.outCubic(range(t, 4.7, 5.2));
          zebras.forEach((z, i) => z.update(t, { pescoco: lerp(0.95, -0.1, alerta) + Math.sin(t * 1.5 + i) * 0.05 }));
          const lx = -5 + t * 0.9;
          const e = ease.inOutSine(clamp(t / D));
          cam.position.set(lx - 9 + e * 2, hgt(lx - 9, 6) + lerp(2.8, 3.2, e), lerp(7.5, 6.5, e));
          cam.lookAt(lx + 6 + e * 3, lerp(0.6, 1.0, e), -2.5);
          st.draw();
          LUA.tag(st.ctx, "7 NOITES SEM LUAR", 450, 270, { a: range(t, 3.1, 3.6) * LUA.borda(t, D), tam: 32, borda: "rgba(150,170,220,0.9)" });
        }
