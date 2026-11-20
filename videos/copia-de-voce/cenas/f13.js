/*META {"imports": ["copia"], "rotulos": [{"de": 0.3, "ate": 1.7, "texto": "Os dois lembram de <span class=\"y\">tudo</span>"}, {"de": 1.75, "ate": 4.2, "texto": "O mesmo direito de ser <span class=\"y\">você</span>"}], "D0": 8.09} */
        // Fechamento: de volta ao quarto. Os mesmos fios nos dois; e agora a cópia abre os olhos e olha para a câmera.
        const st = T.createToyStage(canvas, { ceu: "#081120", nevoa: [6, 22], fov: 46, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        COPIA.amanhecer(st, { forca: 1.1 }); st.bloom = 0.7;
        await COPIA.fontes();
        const Q = COPIA.quarto(S);
        const EU = COPIA.pessoa({ fase: 0.1 }), CO = COPIA.pessoa({ fase: 0.6 });
        EU.deitar(-0.47, 0.9); CO.deitar(0.47, 0.9); S.add(EU.p, CO.p);
        const F = COPIA.fios(S, { n: 18, k: 44, seed: 21, alt: 2.4 });
        const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
        function render(t) {
          // abre os olhos em "ela" (4,75 s) e vira o rosto para a câmera
          const abre = t > 4.8;
          CO.olhos(abre ? 1 : 0);
          const vira = ease.inOutCubic(range(t, 5.0, 6.0));
          CO.olha(lerp(-0.15, 0.32, vira), lerp(0, 0.12, vira));
          EU.olhos(1); EU.olha(0.95 + Math.sin(t * 0.8) * 0.03, 0);
          EU.update(t, {}); CO.update(t, {});
          Q.celA.tela(0); Q.celB.tela(0);
          F.update(t, { A: EU.cabeca(0.1), B: CO.cabeca(0.1), div: 0, a: range(t, 0.1, 0.6) * (1 - range(t, 4.4, 5.0)) });
          // grua: do alto (os dois e os fios) descendo até o rosto da cópia
          const e1 = ease.inOutSine(range(t, 0, 4.6)), e2 = ease.inOutCubic(range(t, 4.6, 8.09));
          const p = v3(-0.1, 5.2, 1.3).lerp(v3(0.3, 3.4, 0.4), e1).lerp(v3(0.78, 2.05, -0.62), e2);
          const l = v3(0, 1.4, -0.4).lerp(v3(0.2, 0.95, -0.55), e1).lerp(v3(0.47, 0.98, -0.86), e2);
          cam.position.copy(p); cam.lookAt(l);
          st.sol(0, 0, 4);
          st.draw();
          const c = st.ctx, a = COPIA.vis(st);
          const r = range(t, 1.9, 2.2) * (1 - range(t, 4.0, 4.3));
          COPIA.tag(c, cam, EU.cabeca(0.04, 0.2), "VOCÊ", { a: a * r, dx: -150, dy: -160 });
          COPIA.tag(c, cam, CO.cabeca(0.04, 0.2), "VOCÊ", { a: a * r, dx: 150, dy: -160 });
          // vinheta extra fechando no olhar
          const v = range(t, 6.2, 8.0);
          if (v > 0) { const g = c.createRadialGradient(540, 760, 200, 540, 900, 1100); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(3,4,10,${0.6 * v})`); c.fillStyle = g; c.fillRect(0, 0, 1080, 1920); }
        }
