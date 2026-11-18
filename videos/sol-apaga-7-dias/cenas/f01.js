/*META {"imports": ["solkit"], "rotulos": [{"de": 0.05, "ate": 2.3, "top": 660, "texto": "<span class=\"k\">UM EXPERIMENTO MENTAL</span><br>E se o Sol <span class=\"y\">apagasse</span>?"}, {"de": 3.5, "ate": 4.13, "top": 660, "texto": "E ele <span class=\"y\">apaga</span>", "sai": false}], "D0": 4.13} */
        const SK = SOLKIT;
        await SK.fontes();
        const st = T.createToyStage(canvas, { fov: 52, ceu: ["#000000", "#02030a"], nevoa: null, nuvens: 0 });
        const S = SK.espaco(st), cam = st.cam;
        st.bloom = 0.85;
        const ceu = SK.ceuDoc(S, { seed: 11 });
        const s = new THREE.Vector3(0, 0.3, -1).normalize(), w = new THREE.Vector3(0, 1, 0.3).normalize();
        const SUN = s.clone().multiplyScalar(70);
        const sol = SK.criaSol(S, { r: 6.5, pos: SUN.toArray(), halo: 10 });
        const E = await SK.terraDoc(S);
        // meio-dia no Brasil: o Brasil fica de frente para o Sol
        E.aim(-50, -12);
        E.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), s); E.group.rotateZ(Math.PI);
        const alvo = new THREE.Vector3(), c = new THREE.Vector3();
        const rr = mulberry32(17), RAIOS = Array.from({ length: 70 }, () => [rr() * 6.283, 0.6 + rr() * 0.8, rr(), 1 + rr() * 3]);
        function render(t) {
          st.T = t + 0.2; st.D = 4.33;   // gancho: o quadro 0 já é a imagem cheia, sem o "dip" de entrada
          // o evento em câmera lenta (3,35 a 4,1 s): o Sol vira brasa e apaga
          const ap = range(t, 3.4, 4.0);
          const L = t < 3.4 ? 1 + 0.05 * Math.sin(t * 9) * range(t, 2.9, 3.4) : (1 - ease.inOutSine(ap)) * (1 + 0.35 * Math.sin(ap * 10) * (1 - ap));
          sol.set(Math.max(0, L), t);
          // a Terra continua iluminada: a luz que já saiu do Sol ainda está a caminho
          E.set({ sol: s, luz: 1, cidades: 0.9 });
          E.nuv.rotation.y = t * 0.01;
          // voo lento e pesado por cima da Terra; o Sol "nasce" atrás do horizonte
          const e = ease.inOutSine(range(t, 0, 3.6));
          const th = lerp(0.75, 2.42, e), R = lerp(3.3, 3.9, e);
          c.copy(s).multiplyScalar(Math.cos(th)).addScaledVector(w, Math.sin(th)).multiplyScalar(R);
          cam.position.copy(c);
          cam.up.copy(s);
          alvo.set(0, 0, 0).lerp(SUN, 0.16 * ease.inOutSine(range(e, 0.45, 1)));
          // "punch" de câmera no instante do evento
          const pu = Math.exp(-Math.pow((t - 3.62) / 0.25, 2));
          cam.fov = 52 - 5 * pu; cam.updateProjectionMatrix();
          cam.lookAt(alvo);
          st.blur = 2.2 * pu;
          ceu.set(1);
          st.draw();
          // rastros radiais: o último clarão se espalhando do Sol
          const cx = st.ctx, [sx, sy, sz] = SK.proj(SUN, cam);
          const q = range(t, 3.45, 4.1);
          if (q > 0 && q < 1 && sz < 1) {
            cx.save(); cx.globalCompositeOperation = "screen"; cx.lineCap = "round";
            for (const [a, sp, ph, wd] of RAIOS) {
              const r0 = 90 + q * 900 * sp, r1 = r0 + 60 + 260 * sp * (1 - q);
              cx.globalAlpha = (1 - q) * (0.35 + 0.5 * ph); cx.strokeStyle = ph < 0.5 ? "#ffe2b0" : "#ffb070"; cx.lineWidth = wd;
              cx.beginPath(); cx.moveTo(sx + Math.cos(a) * r0, sy + Math.sin(a) * r0); cx.lineTo(sx + Math.cos(a) * r1, sy + Math.sin(a) * r1); cx.stroke();
            }
            cx.restore();
          }
        }
