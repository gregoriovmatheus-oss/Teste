/*META {"imports": ["lua"], "rotulos": [{"de": 0.25, "ate": 2.75, "texto": "<span class=\"k\">A LUA VOLTA</span><br>Dia <span class=\"y\">8</span>"}, {"de": 3.0, "ate": 4.81, "sai": false, "texto": "Marés<br><span class=\"y\">de volta</span>"}], "D0": 4.81} */
        // f10 — praia escura: em "reaparece" a Lua acende no mesmo ponto do céu, o luar volta (caminho de luz no mar) e a maré sobe pela areia.
        const st = T.createToyStage(canvas, { fov: 44, ceu: "#050810", nevoa: [80, 600], corNevoa: "#0e1828", nuvens: 0, exposicao: 1.1 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.75;
        S.environment = null;
        const CE = { uT: "#03060e", uH: "#111c30", uB: "#04070c" }, CL = { uT: "#0c1d3c", uH: "#3e5c8c", uB: "#0b1220" };
        const ceu = LUA.ceuDome(S, { topo: CE.uT, horiz: CE.uH, base: CE.uB });
        const est = LUA.estrelas(S, { n: 2600, r: 1200, so: "cima", seed: 101 });
        const hgt = (x, z) => 0.085 * z + 0.25 + 0.06 * Math.sin(x * 0.5 + z * 0.3) + 3 * smoothstep(6, 30, z);
        LUA.terreno(S, hgt, { w: 160, d: 120, seg: 70, cor: 0xb59f7a, rough: 1, cz: -10 });
        const mar = new THREE.Mesh(new THREE.PlaneGeometry(1200, 800), new THREE.MeshStandardMaterial({ color: 0x0b2234, roughness: 0.14, metalness: 0.3 }));
        mar.rotation.x = -Math.PI / 2; mar.position.z = -380; S.add(mar);
        const esp = new THREE.Mesh(new THREE.PlaneGeometry(160, 1.1, 60, 1), new THREE.MeshStandardMaterial({ color: 0xe8f0f5, roughness: 0.6, transparent: true, opacity: 0.7 }));
        esp.rotation.x = -Math.PI / 2; S.add(esp);
        const rr = mulberry32(102);
        for (let i = 0; i < 10; i++) { const x = (rr() - 0.5) * 50, z = 8 + rr() * 14; const pe = T.mesh(LUA.SPH_L, 0x5a5650, S, 0.9); pe.scale.set(0.5 + rr(), 0.3 + rr() * 0.5, 0.5 + rr()); pe.position.set(x, hgt(x, z), z); }
        // Lua (mesmo lugar de f01: alta, à esquerda)
        const MP = new THREE.Vector3(-60, 110, -320), DIR = MP.clone().normalize();
        const luaG = new THREE.Group(); luaG.position.copy(MP); S.add(luaG);
        const lua = LUA.luaEsfera(16, { brilho: 1.45 }); luaG.add(lua);
        const halo = LUA.sprite(LUA.glowTex("190,210,255", 1.2), 0xffffff, 0.55); halo.scale.setScalar(16 * 9); luaG.add(halo);
        const flash = LUA.sprite(LUA.glowTex("235,240,255", 1.5), 0xffffff, 0); flash.scale.setScalar(16 * 6); luaG.add(flash);
        // caminho de luar no mar (faixa aditiva)
        const cc = document.createElement("canvas"); cc.width = 64; cc.height = 256; const g2 = cc.getContext("2d"), r3 = mulberry32(103);
        for (let i = 0; i < 500; i++) { const y = r3() * 256, w = 6 + r3() * 26 * (1 - y / 256 * 0.5); g2.fillStyle = `rgba(200,220,255,${0.15 + r3() * 0.35})`; g2.fillRect(32 - w / 2 + (r3() - 0.5) * 18 * (y / 256), y, w, 1.5); }
        const caminho = new THREE.Mesh(new THREE.PlaneGeometry(26, 300), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cc), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
        caminho.rotation.x = -Math.PI / 2; S.add(caminho);
        st.key.color.set(0xb9cdff); st.hemi.color.set(0x5d78a8); st.hemi.groundColor.set(0x0c1018); st.rim.color.set(0x7f9cd0);
        st.sol(0, -6, 30); st.key.position.copy(DIR).multiplyScalar(60).add(new THREE.Vector3(0, 0, -6)); st.key.target.position.set(0, 0, -6);
        const TR = 1.1;
        function render(t) {
          const k = ease.outCubic(range(t, TR, TR + 0.35));
          luaG.lookAt(cam.position);
          lua.visible = t >= TR; lua.material.opacity = k;
          lua.scale.setScalar(lerp(0.85, 1, k));
          halo.material.opacity = 0.55 * k;
          flash.material.opacity = 0.9 * range(t, TR, TR + 0.1) * (1 - range(t, TR + 0.1, TR + 0.7));
          flash.scale.setScalar(16 * lerp(3, 9, range(t, TR, TR + 0.7)));
          ceu.mix(CE, CL, k);
          est.mat.uniforms.uA.value = lerp(2.2, 0.9, k);
          st.key.intensity = lerp(0.08, 1.5, k); st.hemi.intensity = lerp(0.14, 0.38, k); st.rim.intensity = lerp(0.12, 0.4, k);
          // maré subindo
          const L = lerp(-1.05, -0.05, ease.inOutSine(range(t, 2.8, 4.7))) + Math.sin(t * 2.2) * 0.04;
          mar.position.y = L;
          const zw = (L - 0.25) / 0.085;
          esp.position.set(0, L + 0.02, zw + Math.sin(t * 3) * 0.35);
          caminho.material.opacity = 0.75 * k;
          const e = ease.inOutSine(clamp(t / D));
          cam.position.set(lerp(-3, 0.5, e), 0, lerp(16, 11, e));
          cam.position.y = hgt(cam.position.x, cam.position.z) + lerp(1.6, 2.3, e);
          caminho.position.set(cam.position.x + (MP.x / -MP.z) * 150, L + 0.03, cam.position.z - 160);
          caminho.rotation.z = -Math.atan2(MP.x, -MP.z);
          cam.lookAt(lerp(-5, -8, e), lerp(4.5, 6.5, e), -40);
          st.draw();
          LUA.tag(st.ctx, "NO MESMO LUGAR", 300, 290, { a: range(t, 1.7, 2.1) * (1 - range(t, 2.8, 3.1)), tam: 30 });
        }
