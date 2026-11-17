/*META {"imports": ["lua"], "rotulos": [{"de": 3.4, "ate": 4.75, "texto": "<span class=\"k\">LUA CHEIA</span><br>Desova<br><span class=\"y\">sincronizada</span>"}, {"de": 5.3, "ate": 6.7, "sai": false, "texto": "<span class=\"k\">SEM LUA</span><br>Desova<br><span class=\"y\">desencontrada</span>"}], "D0": 6.7} */
        // f06 — recife à noite sob a lua cheia: em "desovar" todos os corais soltam juntos uma nuvem rosada; sem a Lua, só soltam aos poucos, fora de hora.
        const st = T.createToyStage(canvas, { fov: 50, ceu: "#031426", nevoa: [6, 48], corNevoa: "#062a44", nuvens: 0, exposicao: 1.2 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.75;
        S.environment = null;
        const CL = { uT: "#2a6f9e", uH: "#073150", uB: "#02101c" }, CE = { uT: "#0a2a44", uH: "#041e33", uB: "#020a12" };
        const ceu = LUA.ceuDome(S, { topo: CL.uT, horiz: CL.uH, base: CL.uB, exp: 0.9 });
        const hgt = (x, z) => 0.35 * Math.sin(x * 0.3) * Math.cos(z * 0.25) + 0.15 * Math.sin(x * 1.1 + z * 0.7);
        LUA.terreno(S, hgt, { w: 120, d: 120, seg: 60, cor: 0x9a8e78, rough: 1, cz: -20 });
        // superfície vista de baixo
        const sup = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ color: 0x2c7aa6, emissive: 0x0d3550, emissiveIntensity: 0.8, roughness: 0.25, side: THREE.DoubleSide, fog: false }));
        sup.rotation.x = Math.PI / 2; sup.position.y = 16; S.add(sup);
        // Lua vista através da água + raios de luz
        const luaS = LUA.sprite(LUA.glowTex("225,236,255", 1.4), 0xffffff, 1); luaS.scale.setScalar(16); luaS.position.set(2, 15.5, -24);
        const luaN = LUA.sprite(LUA.glowTex("255,255,255", 4), 0xffffff, 1); luaN.scale.setScalar(5); luaN.position.copy(luaS.position);
        for (const s of [luaS, luaN]) { s.material.depthTest = false; s.renderOrder = 5; S.add(s); }
        const rc = document.createElement("canvas"); rc.width = 32; rc.height = 128; const rg = rc.getContext("2d"), gg = rg.createLinearGradient(0, 0, 0, 128);
        gg.addColorStop(0, "rgba(190,225,255,0.9)"); gg.addColorStop(1, "rgba(190,225,255,0)"); rg.fillStyle = gg; rg.fillRect(0, 0, 32, 128);
        const gh = rg.createLinearGradient(0, 0, 32, 0); gh.addColorStop(0, "rgba(0,0,0,1)"); gh.addColorStop(0.5, "rgba(0,0,0,0)"); gh.addColorStop(1, "rgba(0,0,0,1)"); rg.globalCompositeOperation = "destination-out"; rg.fillStyle = gh; rg.fillRect(0, 0, 32, 128);
        const raioTex = new THREE.CanvasTexture(rc);
        const raios = Array.from({ length: 7 }, (_, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4 + (i % 3), 18), new THREE.MeshBasicMaterial({ map: raioTex, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
          m.position.set(-8 + i * 3 + (i % 2), 7, -12 - (i % 3) * 5); m.rotation.z = 0.12 - i * 0.03; S.add(m); return m; });
        // recife
        const rr = mulberry32(61), corais = [];
        const CORES = [0xd88a7a, 0xc99b6a, 0xa07ab6, 0xd6b25e, 0x8fae7a, 0xe0a0a8];
        for (let i = 0; i < 26; i++) {
          const x = (rr() - 0.5) * 22, z = 3 - rr() * 28, tipo = i % 5 === 4 ? 2 : i % 2, cor = CORES[i % 6];
          const g = tipo === 0 ? LUA.coralRamo(70 + i, cor) : tipo === 1 ? LUA.coralCerebro(cor) : LUA.coralMesa(80 + i, cor);
          const s = 0.8 + rr() * 0.9; g.scale.setScalar(s * (tipo === 1 ? 0.8 : 1.3)); g.position.set(x, hgt(x, z) - 0.05, z); g.rotation.y = rr() * 6;
          S.add(g); corais.push({ x, z, y: hgt(x, z) + (tipo === 1 ? 0.6 : 1.3) * s, atraso: rr() * 1.6 });
        }
        const peixes = Array.from({ length: 7 }, (_, i) => { const f = A.createAnimal("peixe", { cor: [0xe8c060, 0x8fb8d8, 0xe08a6a][i % 3], fase: i * 0.37 }); f.group.scale.setScalar(1.3); S.add(f.group); return f; });
        // desova: 1300 sincronizados (lua cheia) + 520 fora de hora (sem lua)
        const NS = 1300, NA = 520, PT = LUA.pontos(S, NS + NA, { tam: 1, atenua: 320 });
        const rp = mulberry32(62), Q = [];
        for (let i = 0; i < NS + NA; i++) {
          const c = corais[Math.floor(rp() * corais.length)], sync = i < NS;
          const tb = sync ? 3.35 + rp() * 0.35 : 4.95 + c.atraso + rp() * 0.15;
          Q.push([c.x + (rp() - 0.5) * 0.8, c.y, c.z + (rp() - 0.5) * 0.8, tb, 0.7 + rp() * 1.1, rp() * 6.28, sync]);
          const k = rp(); PT.C.set(k < 0.4 ? [1.0, 0.55, 0.72] : k < 0.8 ? [1.0, 0.72, 0.82] : [1.0, 0.86, 0.7], i * 3);
          PT.S[i] = 0.8 + rp() * 1.1;
        }
        st.hemi.color.set(0x5c9cd0); st.hemi.groundColor.set(0x0a1a24); st.hemi.intensity = 0.7;
        st.key.color.set(0xb8d4ff); st.sol(0, -10, 30); st.key.position.set(3, 40, -30); st.key.target.position.set(0, 0, -10);
        st.rim.color.set(0x6fa8d8); st.rim.intensity = 0.4;
        const TS = 4.75;
        function render(t) {
          const sem = ease.inOutSine(range(t, TS, TS + 0.5));
          luaS.material.opacity = 1 - sem; luaN.material.opacity = 1 - sem;
          ceu.mix(CL, CE, sem);
          st.key.intensity = lerp(1.6, 0.5, sem);
          raios.forEach((m, i) => { m.material.opacity = (0.1 + 0.04 * Math.sin(t * 1.3 + i)) * (1 - sem * 0.8); m.rotation.z = 0.12 - i * 0.03 + Math.sin(t * 0.5 + i) * 0.03; });
          for (let i = 0; i < Q.length; i++) {
            const [x, y, z, tb, v, ph, sync] = Q[i], u = t - tb;
            if (u < 0) { PT.A[i] = 0; PT.P.set([x, y, z], i * 3); continue; }
            const sobe = v * u * (1 - Math.exp(-u * 1.5)) / 1 + u * 0.3;
            PT.P.set([x + Math.sin(u * 1.4 + ph) * 0.25 + u * 0.15, y + sobe, z + Math.cos(u * 1.1 + ph) * 0.25], i * 3);
            PT.A[i] = range(u, 0, 0.25) * (sync ? 1 - range(t, TS + 0.1, TS + 0.7) : 1 - range(u, 1.1, 1.6)) * 0.9;
          }
          PT.sync();
          peixes.forEach((f, i) => { const a = t * 0.25 + i * 0.9; f.group.position.set(-8 + ((i * 4 + t * (1 + i * 0.2)) % 18), 2 + (i % 3) * 1.1 + Math.sin(t + i) * 0.3, -6 - (i % 4) * 3); f.update(t, { nada: 2 }); });
          const e = ease.inOutSine(clamp(t / D)), up = ease.inOutCubic(range(t, 3.2, 4.4)) * (1 - 0.6 * ease.inOutCubic(range(t, 5.0, 6.2)));
          cam.position.set(lerp(-2.5, 1.5, e), lerp(3.2, 4.0, e), lerp(9, 4.5, e));
          cam.lookAt(lerp(-0.5, 0.8, e), lerp(2.8, 3.4, e) + up * 3.5, -14);
          st.draw();
          const [x, y, ok] = LUA.proj(luaS.position, cam);
          if (ok) {
            LUA.tag(st.ctx, "LUA CHEIA", x, y + 110, { a: range(t, 0.3, 0.8) * (1 - range(t, TS, TS + 0.3)), tam: 30 });
            LUA.tag(st.ctx, "SEM LUA", x, y + 110, { a: range(t, TS + 0.3, TS + 0.7) * LUA.borda(t, D), tam: 30, cor: "#9fb8e0" });
          }
        }
