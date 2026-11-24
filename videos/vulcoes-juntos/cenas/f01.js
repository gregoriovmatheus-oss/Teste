/*META {"imports": ["lowpoly", "cinema", "vulcoes"], "rotulos": [{"de": 3.85, "ate": 5.86, "texto": "<span class=\"y\">Todos</span><br>ao mesmo tempo"}], "D0": 5.86, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, V = VULCOES, pose = LP.pose;
        await V.prepara();
        const st = LP.palco(canvas, { fov: 30, foco: 1.6, faixa: 0.45, desfoque: 22, fundo: 0x07080e, bloom: 1.1 });
        const { S, cam } = st; cam.near = 0.1; cam.updateProjectionMatrix();
        LP.luz(st, "noite"); st.U.nevoa.value = 0.0; S.background = new THREE.Color(0x07080e); st.exposicao = 1.15;
        const Q = V.quarto(S, LP);
        const p = LP.pessoa({ seed: 12, roupa: "pijama", jaqueta: 0x46587a, pele: 0xb98060, cabelo: 0x24160c, iris: 0x4a3020 });
        S.add(p.root);
        // luz laranja da erupção entrando pela janela (chave com sombra da janela) + lua fria
        st.fria.color.set(0xff7a34); st.fria.position.set(1.2, 3.2, 9); st.fria.intensity = 3.4;
        Object.assign(st.fria.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 20 }); st.fria.shadow.camera.updateProjectionMatrix();
        st.quente.color.set(0x6f8cff); st.quente.intensity = 0.35; st.quente.position.set(-2, 1.6, 2);
        st.rim.color.set(0x7f9cff); st.rim.intensity = 1.6; st.rim.position.set(-1.5, 1.8, -3);
        st.rim2.color.set(0xff6a30); st.rim2.intensity = 0.8; st.hemi.intensity = 0.16;
        const brasa = new THREE.PointLight(0xff6a20, 2.0, 5, 1.6); brasa.position.set(0.2, 1.6, 2.0); S.add(brasa);
        const v3 = new THREE.Vector3(), rosto = new THREE.Vector3(), olhar = new THREE.Vector3(-2.5, 3.5, 48), chao = new THREE.Vector3(0.3, 0.3, 1.2);
        const MA = new THREE.Vector3(-0.36, 0.52, 0.1), MB = new THREE.Vector3(0.18, 0.66, 0.45), polo = new THREE.Vector3(-0.4, 0, -0.3), longe = new THREE.Vector3(1.5, 2.5, 48);
        const PL = V.pluma(S, { n: 1800, base: [-2.5, 6.5, 48], alt: 22, larg: 1.6, cor: 0x2a201c, luz: 0x8a4a30, tam: 1.6, seed: 4, vel: 0.1 }); PL.u.quente.value = 1.2;
        const BB = V.bombas(S, { n: 30, centro: [-2.5, 6.6, 48], alcance: 9, alt: 7, tam: 0.14, seed: 3 });
        const voltaAbas = V.guardaAbas(p);
        function render(t) {
          // o chão ronca: tremor cresce; picos em "roncar" (1,9 s) e "Todos" (3,9 s)
          const tr = 0.35 + 0.4 * range(t, 1.5, 2.2) + 0.5 * range(t, 3.8, 4.4);
          p.reset(); voltaAbas();
          pose(p, "sentado", 1);
          p.pernas.forEach((l) => { l.q.rotation.x = -1.5; l.j.rotation.x = 0.06; });
          p.coluna.rotation.x = lerp(-0.28, 0.1, ease.outBack(range(t, 0.35, 1.1)));   // "acordar": senta de supetão
          p.root.updateMatrixWorld(true);
          LP.alcancar(p, 1, MA, 1, { polo });
          LP.alcancar(p, 0, MB, 1); LP.punho(p, 0.85, 0);
          const baixo = range(t, 1.3, 1.8) * (1 - range(t, 2.3, 2.7));
          LP.olharPara(p, olhar, 0.55);
          LP.olharPara(p, chao, 0.5 * baixo);
          LP.tremer(p, t, 1.0 + tr);
          const em = t < 3.6 ? ["medo", "nervoso", range(t, 1.4, 2.1) * (1 - range(t, 2.5, 3.0))] : ["medo", "panico", range(t, 3.85, 4.3)];
          p.emocaoMix(em[0], em[1], em[2], [lerp(0.06, 0.0, baixo), lerp(0.12, -0.25, baixo)]);
          LP.vida(p, t, { seed: 12, balanco: 0.3, olhos: false });
          // quarto tremendo: copo, quadro, luz da erupção pulsando
          const sh = (f, a) => a * tr * Math.sin(t * f);
          Q.copo.position.x = 1.18 + sh(41, 0.005); Q.copo.rotation.z = sh(37, 0.07);
          Q.quadro.rotation.z = 0.05 * range(t, 1.6, 2.2) + sh(29, 0.02);
          const pulso = 0.78 + 0.22 * Math.sin(t * 7.1) * Math.sin(t * 3.3 + 1);
          st.fria.intensity = 3.4 * pulso * (1 + 0.45 * range(t, 3.8, 4.3)); brasa.intensity = 2.0 * pulso;
          // lá fora: o vulcão próximo; em "Todos" (3,85 s) acendem os outros no horizonte
          Q.vulcs.forEach((x, i) => { const on = i === 0 ? 1 : range(t, 3.75 + i * 0.1, 4.05 + i * 0.1); x.u.lava.value = (0.25 + 0.5 * range(t, 0, 5.8)) * on; x.u.brilho.value = on; x.u.tt.value = t; Q.glows[i].material.opacity = 0.95 * on * pulso; });
          PL.u.t.value = t; BB.update(t, 1);
          // câmera: close no rosto (miniatura) → órbita por trás do ombro em "vulcão" → janela com o horizonte em erupção
          p.cab.getWorldPosition(rosto);
          const o = ease.inOutCubic(range(t, 2.4, 3.35)), push = range(t, 0, 2.4), push2 = ease.inOutSine(range(t, 3.35, 5.86));
          const ang = lerp(0.18, Math.PI - 0.42, o), r = lerp(1.62 - 0.12 * push, 0.78, o) + 0.25 * Math.sin(Math.PI * o);
          cam.position.set(rosto.x + Math.sin(ang) * r, rosto.y + lerp(0.02, 0.2, o), rosto.z + Math.cos(ang) * r);
          v3.copy(rosto); v3.y -= 0.22 * (1 - o);
          v3.lerp(Q.janela, o); v3.y += 0.45 * o;
          cam.position.lerp(Q.janela, 0.12 * push2);
          cam.lookAt(v3);
          LP.camMao(cam, t, { intens: 1.2 + 2.2 * tr, seed: 3 });
          st.U.foco.value = lerp(cam.position.distanceTo(rosto), cam.position.distanceTo(longe), ease.inOutCubic(range(t, 2.9, 3.4)));
          st.U.faixa.value = lerp(0.45, 18, range(t, 2.9, 3.4));
          st.T = Math.max(t, 0.17);   // frame 0 = miniatura: sem dip de entrada
          st.draw();
          // título no quadro 0 (miniatura), sai antes da órbita
          V.titulo(st.ctx, "UM EXPERIMENTO MENTAL", ["E se todos os vulcões", "entrassem em *erupção*", "*ao mesmo tempo*?"], 1 - range(t, 2.2, 2.55), { y: 830, tam: 70 });
        }
