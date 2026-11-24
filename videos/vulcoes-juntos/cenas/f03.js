/*META {"imports": ["lowpoly", "cinema", "vulcoes"], "rotulos": [{"de": 0.3, "ate": 2.55, "texto": "<span class=\"k\">QUEM MORA PERTO</span><br>minutos para <span class=\"y\">fugir</span>"}], "D0": 5.33, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, V = VULCOES;
        await V.prepara();
        const st = LP.palco(canvas, { fov: 44, foco: 2.6, faixa: 1.4, desfoque: 16, fundo: 0x120806, bloom: 1.2 });
        const { S, cam } = st; cam.near = 0.1; cam.far = 300; cam.updateProjectionMatrix();
        LP.luz(st, "noite"); S.background = new THREE.Color(0x1a0a06); st.U.nevoa.value = 0.02; st.U.corNevoa.value.set(0.2, 0.07, 0.04);
        st.fria.color.set(0xff7a3a); st.fria.intensity = 2.6; st.fria.position.set(3, 6, 6);
        st.rim.color.set(0xff6a20); st.rim.intensity = 1.2; st.rim.position.set(0, 9, -3); st.quente.color.set(0x8aa0ff); st.quente.intensity = 0.7; st.hemi.intensity = 0.25;
        CI.ceu(S, { topo: 0x120a10, horizonte: 0x6a2410 });
        CI.cenario(S, "rua", { seed: 4 }).g.traverse((o) => { if (o.isMesh && o.material.roughness !== undefined) o.material.roughness = Math.max(o.material.roughness, 0.9); });
        // o vulcão ao fundo, a coluna de gás e cinza, o rio de lava descendo a rua lá atrás
        const VC = V.vulcao(LP.mat, { raio: 24, alt: 15, seed: 5, cor: 0x1e1612 }); VC.g.position.set(-6, -0.5, -75); S.add(VC.g); VC.u.lava.value = 0.85;
        const glow = V.brilho(0xff5a18, 40, "suave", 0.9); glow.position.set(-6, 16.5, -74); S.add(glow);
        const PL = V.pluma(S, { n: 2200, base: [-6, 14.5, -75], alt: 60, larg: 5, cor: 0x2a1e1a, luz: 0x9a5a3a, tam: 6, seed: 8, vel: 0.08 }); PL.u.quente.value = 1.5;
        const lavaM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff5a14).multiplyScalar(2.2), toneMapped: false });
        const lava = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1, 1, 1).translate(0, 0.5, 0), lavaM); lava.rotation.x = -Math.PI / 2; lava.position.set(0, 0.06, -34); S.add(lava);
        const crosta = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: 0x1a0c08, transparent: true, opacity: 0.55 })); crosta.rotation.x = -Math.PI / 2; crosta.position.set(0, 0.07, -34); S.add(crosta);
        const luzLava = new THREE.PointLight(0xff6a20, 3, 10, 1.6); S.add(luzLava);
        const F = CI.fogo(S, { pos: [-4.6, 3.0, -9.5], tam: 1.6, seed: 3 });
        const FU = CI.fumaca(S, { pos: [-4.6, 4, -9.5], n: 26, cor: 0x3a3030, sobe: 6, largura: 1.5, tam: 1.4, opac: 0.5, seed: 9 });
        const BB = V.bombas(S, { n: 34, centro: [-1, 14, -14], alcance: 10, alt: 3, tam: 0.16, seed: 11, periodo: 1.7 });
        // quem foge: ela (R11) na frente, figurantes atrás
        const p = LP.pessoa({ seed: 31, feminina: true, roupa: "camiseta", camisa: 0xc8503a, pele: 0x9a6448, cabelo: 0x1a0e08, mochila: 0x2a4a6a, iris: 0x3a2414 });
        S.add(p.root);
        const FG = [[-1.3, -3.2, 0x3d5a80, 41], [1.2, -4.6, 0x7a6a3a, 42], [-0.4, -6.4, 0x6a3a5a, 43], [1.8, -8.0, 0x3a6a5a, 44]].map(([x, dz, c, s]) => { const f = LP.figurante({ seed: s, roupa: c, longo: s % 2 === 0 }); S.add(f.root); return [f, x, dz]; });
        const alvo = new THREE.Vector3(), olho = new THREE.Vector3(), PEDRA = new THREE.Vector3(-1, 4, -8);
        const voltaAbas = V.guardaAbas(p);
        function render(t) {
          p.reset(); voltaAbas();
          const d = LP.correr(p, t, { vel: 0.95, amp: 0.95 });
          p.root.position.set(0.2, 0, -8 + d * 0.8);
          p.emocao(t < 2.6 ? "panico" : "medo", [0.1, 0.05]);
          LP.vida(p, t, { seed: 31, balanco: 0.2, olhos: false });
          // olha para trás quando as pedras começam a cair (3,8 s)
          p.cab.rotation.y += 0.9 * Math.sin(Math.PI * range(t, 3.7, 4.7));
          FG.forEach(([f, x, dz], i) => { f.reset(); const df = LP.correr(f, t + i * 0.37, { vel: 0.9 + i * 0.05 }); f.root.position.set(x, 0, -8 + dz + df * 0.8); f.emocao("panico"); });
          // lava avança pela rua lá atrás
          const L = 2 + 8 * ease.outCubic(range(t, 0, 5.33)); lava.scale.y = L; crosta.scale.y = L * 0.85; lava.position.z = crosta.position.z = -44 + L;
          luzLava.position.set(0, 0.8, -44 + L); luzLava.intensity = 3 * (0.85 + 0.15 * Math.sin(t * 9));
          VC.u.tt.value = t; PL.u.t.value = t; F.update(t); FU.update(t); BB.update(t, range(t, 3.6, 4.0));
          // câmera: travelling de costas na frente dela, baixa; câmera na mão forte
          const z = p.root.position.z;
          cam.position.set(lerp(1.0, 0.45, range(t, 0, 5.33)), lerp(1.45, 1.6, range(t, 0, 5.33)), z + lerp(2.3, 2.9, ease.inOutSine(range(t, 0, 5.33))));
          alvo.set(-0.2, lerp(0.55, 1.2, ease.inOutSine(range(t, 2.4, 4.6))), z - 4);
          cam.lookAt(alvo); LP.camMao(cam, t, { intens: 3, seed: 7 });
          p.cab.getWorldPosition(olho); LP.focar(st, olho);
          st.U.faixa.value = 1.6; st.sol(new THREE.Vector3(-6, 15, -75), 0.5);
          st.draw();
          const x = st.ctx, a = V.vis(st);
          V.etq(x, "LAVA", new THREE.Vector3(0, 0.1, -45 + L), cam, a * range(t, 2.6, 2.85), { cor: V.LARANJA, dy: -40 });
          V.etq(x, "GÁS QUENTE", new THREE.Vector3(-6, 24, -75), cam, a * range(t, 2.95, 3.2), { cor: V.LARANJA, dy: 160, dx: -230 });
          V.etq(x, "PEDRAS", PEDRA, cam, a * range(t, 3.75, 4.0), { cor: V.LARANJA, dy: 90, dx: 230 });
        }
