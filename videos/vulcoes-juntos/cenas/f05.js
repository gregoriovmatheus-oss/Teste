/*META {"imports": ["lowpoly", "cinema", "vulcoes"], "rotulos": [{"de": 0.1, "ate": 1.25, "texto": "<span class=\"k\">POUCAS SEMANAS DEPOIS</span>"}, {"de": 3.5, "ate": 5.46, "top": 720, "texto": "Meio-dia com<br>luz de <span class=\"y\">fim de tarde</span>"}], "D0": 5.46, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, V = VULCOES;
        await V.prepara();
        const st = LP.palco(canvas, { fov: 34, foco: 1.8, faixa: 0.6, desfoque: 20, bloom: 0.9 });
        const { S, cam } = st; cam.near = 0.1; cam.updateProjectionMatrix();
        LP.luz(st, "dia");
        const C = CI.ceu(S, { topo: 0x4a86d0, horizonte: 0xcfe0ee, nuvens: 0 });
        const domo = C.children[0].material.uniforms;
        const RUA = CI.cenario(S, "rua", { seed: 9 });
        const p = LP.pessoa({ seed: 51, roupa: "casaco", jaqueta: 0x5a4a3a, pele: 0xc89478, cabelo: 0x3a2a1a, iris: 0x5a4020, cachecol: 0x8a3a2a });
        p.root.position.set(-3.0, 0.11, -1.5); p.root.rotation.y = 0.35; S.add(p.root);
        const FG = [[-2.2, -7, 61, 0x4a5a6a], [3.0, -10, 62, 0x6a4a3a], [-3.6, -13, 63, 0x3a4a3a]].map(([x, z, s, c]) => { const f = LP.figurante({ seed: s, roupa: c }); f.root.position.set(x, 0.11, z); f.root.rotation.y = s % 2 ? 0 : Math.PI; f.userData = { z, dir: s % 2 ? 0.6 : -0.6 }; S.add(f.root); return f; });
        // relógio de rua: 12:00
        const rel = new THREE.Group(); rel.position.set(-1.9, 0, -4.2); S.add(rel);
        const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.2, 8), LP.mat(0x22262a, 0.5)); haste.position.y = 1.6; rel.add(haste);
        const mostr = V.placa("12:00", { w: 0.9, h: 0.42, fundo: "#101418", cor: "#ffb070", tam: 120, emis: 1.2 }); mostr.position.set(0, 3.3, 0.06); rel.add(mostr);
        const caixa = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.52, 0.1), LP.mat(0x22262a, 0.5)); caixa.position.y = 3.3; rel.add(caixa);
        // sol do meio-dia (alto) que vira um disco alaranjado e fraco
        const solM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff4e0).multiplyScalar(4), toneMapped: false });
        const sol = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), solM); const SOLP = new THREE.Vector3(-8, 62, -60); sol.position.copy(SOLP); sol.lookAt(0, 1.6, 0); S.add(sol);
        const halo = V.brilho(0xfff0d0, 30, "suave", 0.8); halo.position.copy(SOLP); S.add(halo);
        const CZ = V.cinza(S, { n: 1400, area: [6, 8], centro: [-2, 0, -4], alt: 7, cor: 0x8a847c, tam: 0.035, vel: 0.5, op: 0 });
        const A0 = [0x4a86d0, 0xcfe0ee], A1 = [0x3a3634, 0x8a7a6a], c0 = new THREE.Color(), c1 = new THREE.Color();
        const rosto = new THREE.Vector3(), alvo = new THREE.Vector3(), olhar = new THREE.Vector3();
        const voltaAbas = V.guardaAbas(p);
        function render(t) {
          // timelapse de semanas: o céu azul vira cinza (0,3–2,4 s); o sol perde força em "sol" (2,7 s)
          const k = ease.inOutSine(range(t, 0.3, 2.4)), ks = ease.inOutSine(range(t, 2.4, 3.6));
          domo.a.value.copy(c0.setHex(A0[0]).lerp(c1.setHex(A1[0]), k)); domo.b.value.copy(c0.setHex(A0[1]).lerp(c1.setHex(A1[1]), k));
          st.U.corNevoa.value.set(lerp(0.81, 0.5, k), lerp(0.88, 0.46, k), lerp(0.93, 0.4, k)); st.U.nevoa.value = lerp(0.012, 0.06, k);
          solM.color.set(0xfff4e0).lerp(c1.setHex(0xff8a3a), k).multiplyScalar(lerp(4, 1.1, ks)); halo.material.color.set(0xfff0d0).lerp(c1.setHex(0xff7a30), k); halo.material.opacity = lerp(0.8, 0.45, ks);
          st.fria.color.set(0xfff4e0).lerp(c1.setHex(0xd89a68), k); st.fria.intensity = lerp(3.2, 1.0, k); st.hemi.intensity = lerp(0.8, 0.45, k);
          st.hemi.color.set(0xcfe4ff).lerp(c1.setHex(0x8a8078), k); st.exposicao = lerp(1.15, 1.0, k);
          st.U.sat.value = lerp(0.92, 0.5, k); st.U.tinta.value.set(lerp(1, 0.92, k), lerp(1, 0.95, k), lerp(1, 1.02, k)); st.U.contraste.value = lerp(0.35, 0.55, k);
          CZ.u.op.value = 0.85 * range(t, 0.8, 2.2); CZ.update(t);
          // ela olha para cima, do relógio para o sol
          p.reset(); voltaAbas(); p.root.updateMatrixWorld(true);
          olhar.copy(rel.position).setY(3.3).lerp(SOLP, ease.inOutCubic(range(t, 2.5, 3.3)));
          LP.olharPara(p, olhar, 0.85);
          LP.pose(p, "encolhido", 0.45 * k);
          p.emocaoMix("calmo", "medo", range(t, 1.2, 2.2), [0.0, 0.55]);
          if (t > 3.3) p.emocaoMix("medo", "triste", range(t, 3.3, 4.2), [0.05, 0.6]);
          LP.vida(p, t, { seed: 51, balanco: 0.4, olhos: false });
          FG.forEach((f, i) => { f.reset(); const d = LP.andar(f, t + i, { vel: 0.8 }); f.root.position.z = f.userData.z + f.userData.dir * d; f.emocao("triste"); });
          // câmera: baixa, na frente dela, olhando o rosto erguido; em "sol" sobe o olhar até o sol pálido
          p.cab.getWorldPosition(rosto);
          const up = ease.inOutCubic(range(t, 2.6, 3.8)), e = ease.inOutSine(range(t, 0, 5.46));
          cam.position.set(rosto.x + lerp(0.7, 0.35, e), lerp(1.05, 0.95, e), rosto.z + lerp(1.7, 1.45, e));
          alvo.copy(rosto); alvo.y -= 0.28;
          alvo.lerp(SOLP, up * 0.035);
          cam.lookAt(alvo); LP.camMao(cam, t, { intens: 1, seed: 5 });
          st.U.foco.value = lerp(cam.position.distanceTo(rosto), 30, up); st.U.faixa.value = lerp(0.6, 20, up);
          st.draw();
          V.etq(st.ctx, "12:00", new THREE.Vector3(-1.9, 3.3, -4.2), cam, V.vis(st) * range(t, 3.15, 3.4) * (1 - range(t, 4.3, 4.6)), { cor: V.LARANJA, dy: 120, dx: -60 });
        }
