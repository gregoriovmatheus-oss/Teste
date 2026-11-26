/*META {"imports": ["terra", "aneis"], "rotulos": [{"de": 1.25, "ate": 3.3, "top": 520, "texto": "<span class=\"k\">SATURNO</span><br><span class=\"y\">280 mil km</span> de largura"}, {"de": 4.15, "ate": 5.91, "top": 520, "texto": "espessura: <span class=\"y\">~10 m</span><br><span class=\"p\">a altura de um prédio</span>"}], "D0": 5.91, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const AN = ANEIS;
        await AN.prepara();
        const st = T.createToyStage(canvas, { fov: 34, ceu: "#000000", nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.hemi.intensity = 0.04; st.key.intensity = 0; st.rim.intensity = 0; st.key.castShadow = false;
        S.add(TERRA.createCeu({ seed: 21, n: 4000, via: 0.35 }));
        const SOLD = new THREE.Vector3(1, 0.32, 0.55).normalize();
        // plano A: Saturno inteiro com os anéis
        const eixo = new THREE.Group(); eixo.rotation.set(0.18, 0, -0.47); S.add(eixo);
        const SA = AN.saturno(1); SA.u.uL.value.copy(SOLD); eixo.add(SA.mesh);
        const R = AN.anel({ Re: 1, r1: 1.24, r2: 2.27, op: 0.75, br: 1.15, amb: 0.015, cor: 0xead9bb, sombraA: 0.85 });
        R.mesh.rotation.x = -Math.PI / 2; eixo.add(R.mesh);
        const SH = AN.sombraAnel(1.004, R, { forca: 0.8 }); SH.scale.y = 0.9; eixo.add(SH);
        R.u.uL.value.copy(SOLD);
        // plano B: o anel de perfil, de perto — pedras e gelo numa lâmina fina, com um prédio de escala
        const S2 = new THREE.Scene(); S2.background = new THREE.Color(0x000000);
        S2.add(TERRA.createCeu({ seed: 22, n: 3000, via: 0.3 }));
        S2.add(new THREE.HemisphereLight(0x8090b0, 0x201810, 0.25));
        const L2 = new THREE.DirectionalLight(0xfff0dc, 3.2); L2.position.set(6, 2.2, 4); S2.add(L2);
        const RO = AN.campoRochas(S2, { n: 1300, area: [36, 0.55, 12], tam: [0.015, 0.16], seed: 8 });
        const PR = AN.predioEscala(0.62); PR.position.set(1.2, -0.31, 1.6); S2.add(PR);
        const SB = AN.saturno(1, { seed: 6 }); SB.mesh.scale.set(70, 63, 70); SB.mesh.position.set(-60, -60, -260); SB.u.uL.value.set(1, 0.4, 0.3).normalize(); S2.add(SB.mesh);
        const cam2 = new THREE.PerspectiveCamera(34, 1080 / 1920, 0.01, 2000);
        st.extraWarm = [{ renderer: st.renderer, scene: S2, camera: cam2 }];
        const alvo = new THREE.Vector3(), d = new THREE.Vector3(), up = new THREE.Vector3(), p1 = new THREE.Vector3(), p2 = new THREE.Vector3();
        function render(t) {
          if (t < 3.3) {
            const e = ease.inOutSine(range(t, 0, 3.3)), az = lerp(-0.35, 0.05, e), el = lerp(0.42, 0.3, e), r = lerp(12.5, 11, e);
            cam.position.set(Math.sin(az) * Math.cos(el) * r, Math.sin(el) * r, Math.cos(az) * Math.cos(el) * r);
            alvo.set(0, lerp(1.9, 1.6, e), 0); cam.lookAt(alvo);
            SA.mesh.rotation.y = t * 0.05; R.sync();
            st.bloom = 0.6; st.draw(S, cam, { cor: "#000", a: range(t, 3.12, 3.3) });
            // cota da largura do anel (da borda interna à externa)
            const k = range(t, 1.2, 1.9);
            if (k > 0) { up.set(0, 1, 0).applyQuaternion(eixo.quaternion); d.crossVectors(up, cam.position).normalize();
              p1.copy(d).multiplyScalar(1.24); p2.copy(d).multiplyScalar(lerp(1.24, 2.27, ease.outCubic(k)));
              const [x1, y1] = AN.proj(p1, cam), [x2, y2] = AN.proj(p2, cam), c = st.ctx;
              c.save(); c.globalAlpha = k * (1 - range(t, 3.0, 3.25)); c.strokeStyle = AN.AZUL; c.fillStyle = AN.AZUL; c.lineWidth = 4; c.shadowColor = "#000"; c.shadowBlur = 8;
              c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
              const nx = -(y2 - y1), ny = x2 - x1, nl = Math.hypot(nx, ny) || 1;
              [[x1, y1], [x2, y2]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x - nx / nl * 18, y - ny / nl * 18); c.lineTo(x + nx / nl * 18, y + ny / nl * 18); c.stroke(); });
              c.restore(); }
          } else {
            const u = t - 3.3, e = ease.inOutSine(range(u, 0, 2.6));
            cam2.position.set(lerp(-3.0, -1.4, e), lerp(0.6, 0.25, e), lerp(7.0, 6.2, e));
            alvo.set(lerp(0.6, 1.0, e), lerp(1.15, 1.05, e), 0.8); cam2.lookAt(alvo);
            RO.update(u, 0.25); PR.rotation.y = 0.5 + 0.05 * u;
            st.bloom = 0.5; st.draw(S2, cam2, { cor: "#000", a: 1 - range(u, 0, 0.2) });
            const c = st.ctx, kb = range(u, 0.9, 1.3);
            if (kb > 0) {   // régua da espessura ao lado do prédio
              p1.set(2.0, -0.3, 1.6); p2.set(2.0, 0.3, 1.6);
              const [x1, y1] = AN.proj(p1, cam2), [x2, y2] = AN.proj(p2, cam2);
              c.save(); c.globalAlpha = kb; c.strokeStyle = AN.AZUL; c.lineWidth = 4; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
              c.moveTo(x1 - 16, y1); c.lineTo(x1 + 16, y1); c.moveTo(x2 - 16, y2); c.lineTo(x2 + 16, y2); c.stroke(); c.restore();
            }
          }
        }
