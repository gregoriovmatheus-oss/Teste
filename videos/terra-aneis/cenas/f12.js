/*META {"imports": ["terra", "aneis"], "rotulos": [{"de": 0.3, "ate": 2.6, "top": 520, "texto": "<span class=\"k\">CRATERAS DAQUELA ÉPOCA</span><br><span class=\"y\">quase todas</span>…"}, {"de": 2.7, "ate": 4.41, "top": 520, "texto": "…perto do<br><span class=\"o\">antigo equador</span>"}], "D0": 4.41, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const AN = ANEIS;
        await AN.prepara();
        const st = T.createToyStage(canvas, { fov: 34, ceu: "#000000", nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.hemi.intensity = 0.04; st.key.intensity = 0; st.rim.intensity = 0; st.key.castShadow = false;
        S.add(TERRA.createCeu({ seed: 43, n: 4500, via: 0.5 }));
        const E = await TERRA.createTerra({ raio: 1 }); S.add(E.group);
        E.sol.set(0.3, 0.35, 1).normalize(); E.u.nuvens.value = 0.35; E.u.luzes.value = 0.3;
        // antigo equador: grande círculo inclinado (posições reconstruídas, estilizado), no referencial da Terra que gira
        const nA = new THREE.Vector3(0.55, 0.83, 0.1).normalize(), e1 = new THREE.Vector3().crossVectors(nA, new THREE.Vector3(0, 0, 1)).normalize(), e2 = new THREE.Vector3().crossVectors(nA, e1);
        const circ = (th, lat, out) => out.copy(e1).multiplyScalar(Math.cos(th) * Math.cos(lat)).addScaledVector(e2, Math.sin(th) * Math.cos(lat)).addScaledVector(nA, Math.sin(lat));
        const rr = mulberry32(19), CR = [];
        for (let i = 0; i < 21; i++) { const fora = i === 7 || i === 15; CR.push({ th: rr() * 6.283, lat: (rr() - 0.5) * (fora ? 1.4 : 0.32) + (fora ? 0.7 : 0), t0: 0.3 + i * 0.075, s: 0.7 + rr() * 0.6 }); }
        // anel fantasma no plano do antigo equador
        const anelG = new THREE.Group(); anelG.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nA); E.earth.add(anelG);
        const R = AN.anel({ Re: 1, r1: 1.3, r2: 1.95, op: 0.5, br: 1.1, amb: 0.02, cor: 0xd8b898, sombraA: 0.7 }); anelG.add(R.mesh);
        const alvo = new THREE.Vector3(), q = new THREE.Vector3(), w = new THREE.Vector3();
        const visivel = (p) => p.dot(w.copy(cam.position).sub(p)) > 0;
        function render(t) {
          E.earth.rotation.set(0.15, (20 + 6 * t) * Math.PI / 180, 0);
          R.u.uVis.value = 0.55 * range(t, 3.2, 4.0);
          const e = ease.inOutSine(range(t, 0, 4.41)), az = lerp(0.25, -0.15, e), el = lerp(0.3, 0.18, e), r = lerp(5.8, 6.4, e);
          cam.position.set(Math.sin(az) * Math.cos(el) * r, Math.sin(el) * r, Math.cos(az) * Math.cos(el) * r);
          alvo.set(0, 0.95, 0); cam.lookAt(alvo);
          E.group.updateMatrixWorld(true); R.u.uL.value.copy(E.sol); R.sync();
          st.bloom = 0.6; st.draw();
          const c = st.ctx;
          // linha do antigo equador
          const ke = range(t, 3.2, 3.7);
          if (ke > 0) { c.save(); c.strokeStyle = AN.LARANJA; c.lineWidth = 5; c.globalAlpha = ke; c.shadowColor = AN.LARANJA; c.shadowBlur = 14; c.setLineDash([18, 12]); c.beginPath(); let on = false;
            for (let i = 0; i <= 160; i++) { circ(i / 160 * 6.283, 0, q).multiplyScalar(1.006); E.earth.localToWorld(q); const [x, y] = AN.proj(q, cam);
              if (visivel(q)) { on ? c.lineTo(x, y) : c.moveTo(x, y); on = true; } else on = false; }
            c.stroke(); c.restore(); }
          // crateras aparecendo uma a uma
          CR.forEach((k) => { const a = range(t, k.t0, k.t0 + 0.25); if (a <= 0) return; circ(k.th, k.lat, q).multiplyScalar(1.004); E.earth.localToWorld(q); if (!visivel(q)) return;
            const [x, y] = AN.proj(q, cam), pul = 1 + 0.6 * (1 - a);
            c.save(); c.globalAlpha = a; c.strokeStyle = "#ffb07a"; c.fillStyle = "rgba(255,138,76,0.55)"; c.lineWidth = 3;
            c.beginPath(); c.arc(x, y, 11 * k.s * pul, 0, 6.283); c.fill(); c.stroke();
            c.globalAlpha = a * (1 - a) * 2; c.beginPath(); c.arc(x, y, 30 * k.s * pul, 0, 6.283); c.stroke(); c.restore(); });
        }
