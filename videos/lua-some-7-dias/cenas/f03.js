/*META {"imports": ["lua"], "rotulos": [{"de": 3.7, "ate": 5.12, "sai": false, "texto": "<span class=\"k\">BRILHO DA NOITE</span><br><span class=\"y\">100×</span><br>mais escura"}], "D0": 5.12} */
        // f03 — terra: sítio ao luar em travelling lateral; em "Sem o luar" uma cortina de escuridão divide a tela (antes | depois) e depois engole tudo.
        const st = T.createToyStage(canvas, { fov: 44, ceu: "#050810", nevoa: [60, 380], corNevoa: "#14223a", nuvens: 0, exposicao: 1.1 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.6;
        S.environment = null;
        LUA.ceuDome(S, { topo: "#0d2042", horiz: "#3d5a88", base: "#0c1422" });
        const est = LUA.estrelas(S, { n: 1600, r: 1200, so: "cima", seed: 31 });
        est.mat.uniforms.uA.value = 0.7;
        const hgt = (x, z) => 0.35 * Math.sin(x * 0.08) * Math.cos(z * 0.06) + 9 * smoothstep(-50, -170, z) * (0.6 + 0.4 * Math.sin(x * 0.025));
        LUA.terreno(S, hgt, { w: 500, d: 400, seg: 80, cor: 0x2b4026, cz: -120 });
        const gr = LUA.grama(S, { n: 1300, area: [-16, 16, -14, 6], seed: 32, cor: 0x55784a, alt: [0.15, 0.45], h: hgt });
        // casa de sítio com janela acesa
        const casa = new THREE.Group(); casa.position.set(4, hgt(4, -22), -22); casa.rotation.y = -0.35; S.add(casa);
        const corpo = T.mesh(T.roundBox(7, 3.6, 5, 0.12), 0xcdbb9c, casa, 0.9);
        const tg = new THREE.ConeGeometry(5.3, 2.4, 4); tg.rotateY(Math.PI / 4);
        const tel = T.mesh(tg, 0x7a3a2c, casa, 0.8); tel.scale.set(1, 1, 0.75); tel.position.y = 4.8;
        const jan = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.0), new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xffb45a, emissiveIntensity: 2.2 }));
        jan.position.set(-1.6, 1.9, 2.52); casa.add(jan);
        const jan2 = jan.clone(); jan2.position.x = 1.6; casa.add(jan2);
        const porta = T.mesh(T.roundBox(1.0, 2.0, 0.1, 0.03), 0x4a3424, casa); porta.position.set(0, 0, 2.5);
        // cerca
        for (let i = 0; i < 18; i++) { const x = -14 + i * 1.8, z = -9 + Math.sin(i * 0.5) * 0.3; const po = T.mesh(T.roundBox(0.18, 1.2, 0.18, 0.04), 0x6b5236, S); po.position.set(x, hgt(x, z), z); }
        for (const y of [0.45, 0.95]) { const tr = T.mesh(T.roundBox(31, 0.08, 0.08, 0.02), 0x6b5236, S); tr.position.set(1.3, hgt(0, -9) + y, -9); }
        const rr = mulberry32(33);
        for (let i = 0; i < 18; i++) { const x = (rr() - 0.5) * 120, z = -28 - rr() * 70; if (Math.abs(x - 4) < 9 && z > -40) continue; const a = T.arvore(1.6 + rr() * 1.8, 0x2c4424, 40 + i); a.position.set(x, hgt(x, z) - 0.2, z); S.add(a); }
        // Lua no alto à esquerda
        const MP = new THREE.Vector3(-120, 170, -300);
        const luaG = new THREE.Group(); luaG.position.copy(MP); S.add(luaG);
        luaG.add(LUA.luaEsfera(9, { brilho: 1.45 }));
        const halo = LUA.sprite(LUA.glowTex("190,210,255", 1.2), 0xffffff, 0.5); halo.scale.setScalar(9 * 10); luaG.add(halo);
        st.key.color.set(0xbcd0ff); st.key.intensity = 1.7; st.hemi.color.set(0x5d78a8); st.hemi.groundColor.set(0x0c1018); st.hemi.intensity = 0.4;
        st.rim.intensity = 0.25; st.rim.color.set(0x7f9cd0);
        st.sol(0, -12, 40); st.key.position.copy(MP).normalize().multiplyScalar(80).add(new THREE.Vector3(0, 0, -12)); st.key.target.position.set(0, 0, -12);
        // estrelas extras que aparecem no lado escuro (2D, fixas)
        const R2 = mulberry32(34), EXTRA = Array.from({ length: 260 }, () => [R2() * 1080, Math.pow(R2(), 1.3) * 900, 0.6 + Math.pow(R2(), 4) * 2.6, R2()]);
        function render(t) {
          luaG.lookAt(cam.position);
          gr.update(t, 0.7);
          const e = ease.inOutSine(clamp(t / D));
          const cx = lerp(-7, 1.5, e);
          cam.position.set(cx, hgt(cx, 7) + lerp(2.0, 2.6, e), 7);
          cam.lookAt(cx + 3.2, lerp(3.6, 4.2, e), -20);
          st.draw();
          // cortina: lado direito = sem luar (antes | depois); no fim, tudo escuro
          const c = st.ctx;
          const xw = t < 4.1 ? lerp(1080, 540, ease.inOutCubic(range(t, 2.1, 2.8))) : lerp(540, 0, ease.inOutCubic(range(t, 4.1, 4.75)));
          if (xw < 1079) {
            c.save();
            c.globalCompositeOperation = "multiply"; c.fillStyle = "rgb(20,24,44)"; c.fillRect(xw, 0, 1080 - xw, 1920);
            c.globalCompositeOperation = "lighter";
            for (const [x, y, s, ph] of EXTRA) { if (x < xw) continue; c.globalAlpha = 0.55 + 0.45 * Math.sin(t * 3 + ph * 20); c.fillStyle = "#dfe8ff"; c.beginPath(); c.arc(x, y, s, 0, 6.3); c.fill(); }
            c.restore();
            if (xw > 2) { c.save(); c.fillStyle = "rgba(255,240,210,0.85)"; c.fillRect(xw - 2, 0, 4, 1920); c.restore(); }
          }
          const aT = range(t, 2.5, 2.9) * (1 - range(t, 4.0, 4.3));
          LUA.tag(c, "COM LUAR", 270, 300, { a: aT, tam: 36, borda: "rgba(124,200,255,0.9)" });
          LUA.tag(c, "SEM LUAR", 700, 300, { a: aT, tam: 36, borda: "rgba(150,170,220,0.9)" });
        }
