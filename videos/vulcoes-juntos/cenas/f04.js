/*META {"imports": ["vulcoes"], "rotulos": [], "D0": 4.9, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const V = VULCOES;
        await V.prepara();
        const st = T.createToyStage(canvas, { fov: 42, ceu: ["#0c1830", "#d0905c"], nevoa: [40, 160], corNevoa: "#a07058", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0xffc890); st.key.intensity = 2.6; st.hemi.intensity = 0.45; st.sol(0, 0, 40, 0);
        const mk = (c, r) => T.TOON({ color: c, roughness: r, flatShading: true });
        const chao = new THREE.Mesh(new THREE.CircleGeometry(400, 48), mk(0x4a3a30, 1)); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; S.add(chao);
        const R = mulberry32(44);
        for (let i = 0; i < 14; i++) { const a = R() * 6.28, d = 25 + R() * 50, m = new THREE.Mesh(new THREE.ConeGeometry(4 + R() * 6, 2 + R() * 4, 7), mk(0x3e322a, 1)); m.position.set(Math.cos(a) * d, 0.5, Math.sin(a) * d - 20); S.add(m); }
        const VC = V.vulcao(mk, { raio: 9, alt: 3.4, seed: 7, cor: 0x3a2e28 }); S.add(VC.g); VC.u.lava.value = 0.7;
        const glow = V.brilho(0xff6a20, 7, "suave", 0.9); glow.position.set(0, 3.6, 0); S.add(glow);
        // coluna de cinza (escura) + enxofre (amarelado) subindo; camada da estratosfera
        const H = 15, TOPO = 24;
        const PC = V.pluma(S, { n: 6000, base: [0, 3.2, 0], alt: TOPO, larg: 1.5, cor: 0x3c3632, luz: 0xc8b8a8, tam: 0.8, seed: 5, vel: 0.11, guarda: 1 });
        const PE = V.pluma(S, { n: 900, base: [0, 3.2, 0], alt: TOPO, larg: 1.3, cor: 0x9a8a50, luz: 0xd8cc90, tam: 0.6, seed: 6, vel: 0.12, op: 0 }); PE.u.quente.value = 0;
        const cam_ = new THREE.Mesh(new THREE.CircleGeometry(120, 64), new THREE.MeshBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
        cam_.rotation.x = -Math.PI / 2; cam_.position.y = H; S.add(cam_);
        const grade = new THREE.GridHelper(240, 24, 0x7cc8ff, 0x7cc8ff); grade.position.y = H; grade.material.transparent = true; grade.material.opacity = 0; grade.material.fog = false; S.add(grade);
        const alvo = new THREE.Vector3();
        function render(t) {
          // a coluna nasce em "pior" e sobe; fura a camada em "estratosfera" (3,95 s)
          const topo = lerp(1.0, TOPO, ease.inOutCubic(range(t, 0.2, 4.2)));
          PC.u.topo.value = topo; PC.u.t.value = t; PE.u.topo.value = topo * 0.98; PE.u.t.value = t + 3;
          PE.u.op.value = 0.3 * range(t, 2.6, 3.1);
          VC.u.tt.value = t;
          const ca = range(t, 3.4, 4.0); cam_.material.opacity = 0.18 * ca; grade.material.opacity = 0.55 * ca;
          // câmera: grua da boca do vulcão até o alto, olhando a coluna
          const e = ease.inOutSine(range(t, 0, 4.9));
          cam.position.set(lerp(7, 20, e), lerp(2.2, 7.5, e), lerp(11, 38, e));
          alvo.set(0, lerp(4.5, 13, e), 0); cam.lookAt(alvo);
          st.bloom = 0.55;
          st.draw();
          const x = st.ctx, a = V.vis(st);
          V.etq(x, "CINZA", new THREE.Vector3(-0.6, Math.min(topo * 0.45 + 3, 9), 0), cam, a * range(t, 2.2, 2.45) * (1 - range(t, 3.6, 3.9)), { cor: "#d8d0c8", dy: -80, dx: -220 });
          V.etq(x, "ENXOFRE", new THREE.Vector3(0.8, Math.min(topo * 0.6 + 3, 12), 0), cam, a * range(t, 2.68, 2.95) * (1 - range(t, 3.6, 3.9)), { cor: "#f0dc7a", dy: 40, dx: 220 });
          const [, yH] = V.proj(new THREE.Vector3(-40, H, -20), cam);
          if (ca > 0) { V.txt(x, "ESTRATOSFERA", 120, Math.max(200, yH - 40), { tam: 28, cor: V.AZUL, a: a * range(t, 3.9, 4.2), esp: 0.3, al: "left" });
            V.txt(x, "TROPOSFERA", 120, Math.max(240, yH + 40), { tam: 22, cor: "rgba(200,220,255,0.7)", a: a * range(t, 3.9, 4.2), esp: 0.3, al: "left", peso: 400 }); }
        }
