/*META {"imports": ["terra", "aneis"], "rotulos": [{"de": 2.65, "ate": 3.62, "top": 520, "texto": "<span class=\"k\">PLANO DO ANEL</span><br>sobre o <span class=\"y\">equador</span>"}, {"de": 3.65, "ate": 5.77, "top": 520, "texto": "a alguns <span class=\"y\">milhares de km</span><br>de altura"}], "D0": 5.77, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const AN = ANEIS;
        await AN.prepara();
        const st = T.createToyStage(canvas, { fov: 34, ceu: "#000000", nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.hemi.intensity = 0.04; st.key.intensity = 0; st.rim.intensity = 0; st.key.castShadow = false;
        S.add(TERRA.createCeu({ seed: 12, n: 4500, via: 0.55 }));
        const eixo = new THREE.Group(); eixo.rotation.z = 0.41; S.add(eixo);   // eixo da Terra inclinado 23°
        const E = await TERRA.createTerra({ raio: 1 }); eixo.add(E.group);
        E.sol.set(0.85, 0.3, 1).normalize(); E.u.nuvens.value = 0.6; E.u.luzes.value = 0.5;
        const R = AN.anel({ Re: 1, r1: 1.25, r2: 2.4, op: 0.7, br: 1.6, amb: 0.02, sombraA: 0.7 });
        R.mesh.rotation.x = -Math.PI / 2; eixo.add(R.mesh);
        const SH = AN.sombraAnel(1.012, R); eixo.add(SH);
        const alvo = new THREE.Vector3(), up = new THREE.Vector3(), vd = new THREE.Vector3(), d = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), q = new THREE.Vector3();
        function render(t) {
          E.earth.rotation.y = (-40 + 3 * t) * Math.PI / 180; E.nuv.rotation.y = t * 0.01;
          // o anel se forma em volta da Terra (varredura) enquanto a câmera desce para o plano do equador
          R.u.uRev.value = 0.02 + 1.02 * ease.inOutCubic(range(t, 0.15, 2.4));
          const e = ease.inOutSine(range(t, 0, 5.77)), el = lerp(0.62, 0.16, ease.inOutCubic(range(t, 0.3, 4.2))), az = lerp(0.45, -0.2, e), r = lerp(9.6, 8.2, e);
          cam.position.set(Math.sin(az) * Math.cos(el) * r, Math.sin(el) * r, Math.cos(az) * Math.cos(el) * r);
          alvo.set(0, lerp(1.05, 0.85, e), 0); cam.lookAt(alvo);
          R.u.uL.value.copy(E.sol); R.sync();
          st.bloom = 0.7;
          st.draw();
          const c = st.ctx;
          // equador (laranja) desenhado na face visível
          const ka = range(t, 2.6, 3.0) * (1 - range(t, 5.3, 5.7));
          if (ka > 0) { c.save(); c.strokeStyle = AN.LARANJA; c.lineWidth = 4; c.globalAlpha = ka; c.shadowColor = AN.LARANJA; c.shadowBlur = 12; c.beginPath(); let on = false;
            for (let i = 0; i <= 180; i++) { q.copy(E.ponto(i * 2, 0, 1.004)); E.earth.localToWorld(q); const vis = q.dot(vd.copy(cam.position).sub(q)) > 0;
              const [x, y] = AN.proj(q, cam); if (vis) { on ? c.lineTo(x, y) : c.moveTo(x, y); on = true; } else on = false; }
            c.stroke(); c.restore(); }
          // cota da superfície até a borda interna do anel, no limbo
          const kb = range(t, 3.7, 4.1);
          if (kb > 0) { up.set(0, 1, 0).applyQuaternion(eixo.quaternion); vd.copy(cam.position).normalize(); d.crossVectors(up, vd).normalize().negate();
            a.copy(d).multiplyScalar(1.0); b.copy(d).multiplyScalar(lerp(1.0, 1.25, ease.outCubic(kb)));
            const [x1, y1] = AN.proj(a, cam), [x2, y2] = AN.proj(b, cam);
            c.save(); c.strokeStyle = AN.AZUL; c.fillStyle = AN.AZUL; c.lineWidth = 4; c.globalAlpha = kb; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
            [[x1, y1], [x2, y2]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 7, 0, 6.283); c.fill(); }); c.restore();
            AN.etq(c, "ALTITUDE DO ANEL", b, cam, kb, { dy: -150, dx: 220 }); }
        }
