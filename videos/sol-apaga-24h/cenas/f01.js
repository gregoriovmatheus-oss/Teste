/*META {"imports": ["solkit"], "rotulos": [{"de": 0.05, "ate": 2.3, "top": 660, "texto": "<span class=\"k\">UM EXPERIMENTO MENTAL</span><br>E se o Sol <span class=\"y\">apagasse</span>?"}, {"de": 3.5, "ate": 4.13, "top": 660, "texto": "E ele <span class=\"y\">apaga</span>", "sai": false}], "D0": 4.13} */
        const SK = SOLKIT;
        await SK.fontes();
        const st = T.createToyStage(canvas, { fov: 58, nevoa: null, nuvens: 0 });
        const S = SK.espaco(st), cam = st.cam;
        SK.estrelas(S, { n: 2200, seed: 11 });
        const s = new THREE.Vector3(0, 0.3, -1).normalize(), w = new THREE.Vector3(0, 1, 0.3).normalize();
        const SUN = s.clone().multiplyScalar(70);
        const sol = SK.criaSol(S, { r: 6.5, pos: SUN.toArray(), halo: 10 });
        const terra = SK.criaTerra(S, st, { detalhe: 32 });
        const alvo = new THREE.Vector3(), c = new THREE.Vector3();
        function render(t) {
          st.T = t + 0.2; st.D = 4.33;   // gancho: o quadro 0 já é a imagem cheia, sem o "dip" de entrada
          // o Sol apaga em 3,57 s ("apaga"): pisca, vira brasa e some em ~0,35 s
          const ap = range(t, 3.5, 3.9);
          const L = t < 3.5 ? 1 + 0.06 * Math.sin(t * 9) * range(t, 3.0, 3.5) : (1 - ease.inCubic(ap)) * (1 + 0.5 * Math.sin(ap * 9) * (1 - ap));
          sol.set(Math.max(0, L), t);
          // a Terra continua iluminada: a luz que já saiu do Sol ainda está a caminho
          terra.set({ sol: s, luz: 1, cidades: 0.7, rotY: 0.3 + t * 0.06, incl: 1.45 });
          // voo por cima da Terra: começa no lado do dia e o Sol "nasce" atrás do horizonte
          const e = ease.inOutSine(range(t, 0, 3.6));
          const th = lerp(0.75, 2.42, e) , R = lerp(3.3, 3.9, e);
          c.copy(s).multiplyScalar(Math.cos(th)).addScaledVector(w, Math.sin(th)).multiplyScalar(R);
          cam.position.copy(c);
          cam.up.copy(s);
          alvo.set(0, 0, 0).lerp(SUN, 0.16 * ease.inOutSine(range(e, 0.45, 1)));
          cam.lookAt(alvo);
          st.draw();
          // brilho do Sol "atrás da câmera" no começo e clarão enquanto brilha
          const cx = st.ctx;
          cx.save(); cx.globalCompositeOperation = "screen";
          const gl = (1 - range(t, 0.5, 2.6)) * 0.55;
          if (gl > 0) { const g = cx.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, "rgba(255,214,150," + gl + ")"); g.addColorStop(1, "rgba(255,214,150,0)"); cx.fillStyle = g; cx.fillRect(0, 0, 1080, 900); }
          cx.globalAlpha = 0.08 * Math.max(0, L); cx.fillStyle = "#ffcf8a"; cx.fillRect(0, 0, 1080, 1920);
          cx.restore();
        }
