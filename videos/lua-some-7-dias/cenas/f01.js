/*META {"imports": ["lua"], "rotulos": [{"de": 0, "ate": 3.83, "top": 690, "fixo": true, "pulso": 3.3, "texto": "<span class=\"k\">UM EXPERIMENTO MENTAL</span><br>E se a Lua<br><span class=\"y\">sumisse?</span>"}], "D0": 3.83} */
        // f01 — gancho: pessoa no morro olhando a Lua cheia gigante; em "some" (3,28 s) a Lua desaparece de uma vez.
        const st = T.createToyStage(canvas, { fov: 45, ceu: "#050810", nevoa: [80, 520], corNevoa: "#0e1828", nuvens: 0, exposicao: 1.08 });
        const S = st.scene, cam = st.cam;
        S.environment = null;
        const CEU_LUZ = { uT: "#0c1d3c", uH: "#3a5582", uB: "#0b1220" }, CEU_ESC = { uT: "#03060e", uH: "#16223a", uB: "#04070c" };
        const ceu = LUA.ceuDome(S, { topo: CEU_LUZ.uT, horiz: CEU_LUZ.uH, base: CEU_LUZ.uB });
        const est = LUA.estrelas(S, { n: 2400, r: 1200, so: "cima", seed: 11 });
        const hgt = (x, z) => 1.1 * Math.exp(-(x * x + z * z) / 50) + 0.7 * Math.sin(x * 0.05 + 1) * Math.cos(z * 0.045) + 14 * smoothstep(-70, -230, z) * (0.55 + 0.45 * Math.sin(x * 0.018 + 0.7));
        LUA.terreno(S, hgt, { w: 700, d: 500, seg: 90, cor: 0x1c2c1c, cz: -150 });
        const gr = LUA.grama(S, { n: 1800, area: [-12, 12, -18, 11], seed: 12, cor: 0x4a6a3a, alt: [0.15, 0.4], h: hgt });
        const rr = mulberry32(13);
        for (let i = 0; i < 16; i++) { const x = (rr() - 0.5) * 140, z = -25 - rr() * 90; if (Math.abs(x) < 6) continue; const a = T.arvore(1.4 + rr() * 1.6, 0x24391f, 20 + i); a.position.set(x, hgt(x, z) - 0.2, z); S.add(a); }
        const p = A.createAnimal("humano", { cor: 0x41597a, cor2: 0x2a2f3a, cabelo: 0x2a1d16, fase: 0.2 });
        p.group.position.set(0, hgt(0, 0), 0); A.face(p.group, -0.12, -1); p.group.scale.setScalar(1.05); S.add(p.group);
        // Lua cheia gigante no céu + halo
        const MP = new THREE.Vector3(-34, 150, -300), DIR = MP.clone().normalize();
        const luaG = new THREE.Group(); luaG.position.copy(MP); S.add(luaG);
        const lua = LUA.luaEsfera(22, { brilho: 1.45 }); luaG.add(lua);
        const halo = LUA.sprite(LUA.glowTex("190,210,255", 1.2), 0xffffff, 0.55); halo.scale.setScalar(22 * 9); luaG.add(halo);
        const halo2 = LUA.sprite(LUA.glowTex("235,240,255", 2.5), 0xffffff, 0.7); halo2.scale.setScalar(22 * 3.2); luaG.add(halo2);
        st.key.color.set(0xb9cdff); st.rim.color.set(0x7f9cd0); st.hemi.color.set(0x5d78a8); st.hemi.groundColor.set(0x0c1018);
        st.sol(0, 0, 16);
        st.key.position.copy(DIR).multiplyScalar(40); st.key.target.position.set(0, 0, 0);
        st.rim.position.set(14, 6, 24);
        const TV = 3.28;
        function render(t) {
          const sumiu = t >= TV, k = range(t, TV, TV + 0.18);
          luaG.lookAt(cam.position);
          lua.visible = !sumiu;
          // câmera lenta antes do sumiço: a Lua treme e encolhe um pouco, a luz é sugada para dentro
          const pre = ease.inCubic(range(t, 2.7, TV));
          lua.scale.setScalar(1 - 0.05 * pre + Math.sin(t * 60) * 0.006 * pre);
          if ("bloom" in st) st.bloom = 0.55 + 0.4 * pre;
          st.blur = 2.6 * pre * (1 - range(t, TV, TV + 0.3)) + 1.8 * range(t, TV, TV + 0.06) * (1 - range(t, TV + 0.06, TV + 0.35));
          halo2.visible = !sumiu;
          // rastro de luz que se apaga em 0,35 s (sem explosão)
          halo.material.opacity = sumiu ? 0.55 * (1 - range(t, TV, TV + 0.35)) : 0.55 + Math.sin(t * 2) * 0.03;
          halo.scale.setScalar(22 * 9 * (sumiu ? 1 - 0.5 * range(t, TV, TV + 0.35) : 1));
          ceu.mix(CEU_LUZ, CEU_ESC, ease.outCubic(k));
          est.mat.uniforms.uA.value = lerp(0.9, 2.4, k);
          st.key.intensity = lerp(1.5, 0.12, k); st.hemi.intensity = lerp(0.38, 0.14, k); st.rim.intensity = lerp(0.45, 0.15, k);
          p.update(t, { cabeca: 0.42 + Math.sin(t * 0.9) * 0.03 + (sumiu ? 0.08 * range(t, TV, TV + 0.4) : 0) });
          gr.update(t, 0.8);
          const e = ease.inOutSine(clamp(t / 3.6));
          const cx = lerp(2.4, 1.7, e), cz = lerp(10, 7.6, e), cy = hgt(cx, cz) + 1.0;
          cam.position.set(cx, cy, cz);
          cam.lookAt(lerp(-0.3, -0.7, e), cy + Math.tan(0.206) * (cz + 10) + lerp(0, 0.3, e), -10);
          st.T = t + 0.17;   // gancho: sem o dip de entrada no frame 0
          st.draw();
          // rastros radiais convergindo para a Lua (sem explosão: a luz some para dentro)
          const [mx, my] = LUA.proj(MP, cam), c = st.ctx, sa = pre * (1 - range(t, TV, TV + 0.25));
          if (sa > 0.01) {
            const rs = mulberry32(17);
            c.save(); c.globalCompositeOperation = "lighter"; c.lineCap = "round";
            for (let i = 0; i < 90; i++) {
              const a = rs() * 6.283, sp = 0.6 + rs() * 0.8, r0 = 160 + rs() * 520, ph = rs();
              const q = ((t - 2.7) * sp * 1.6 + ph) % 1, r1 = r0 * (1 - q) + 70, len = (40 + rs() * 160) * (0.4 + pre);
              c.globalAlpha = sa * (0.15 + 0.5 * q) ; c.strokeStyle = i % 3 ? "#cfe4ff" : "#7cc8ff"; c.lineWidth = 1.5 + rs() * 3;
              c.beginPath(); c.moveTo(mx + Math.cos(a) * r1, my + Math.sin(a) * r1); c.lineTo(mx + Math.cos(a) * (r1 + len), my + Math.sin(a) * (r1 + len)); c.stroke();
            }
            c.restore();
          }
        }
