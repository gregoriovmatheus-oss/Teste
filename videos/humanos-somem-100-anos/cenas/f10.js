/*META {"imports": ["avenida"], "rotulos": [{"de": 0, "ate": 5.55, "top": 580, "fixo": true, "pulso": 0.2, "texto": "<span class=\"sp\">TEMPO SEM HUMANOS</span><span class=\"selo\">100 ANOS</span><span class=\"sl\"></span>"}, {"de": 1.1, "ate": 2.85, "texto": "Árvores no meio das <span class=\"y\">avenidas</span>"}, {"de": 2.95, "ate": 5.55, "texto": "<span class=\"k\">ESTACIONAMENTOS</span><br>viram <span class=\"y\">floresta</span>"}], "D0": 5.55, "css": ".rot-t .selo{display:inline-block;font-family:\"Inter\",sans-serif;font-weight:800;font-size:112px;line-height:1.05;letter-spacing:0.01em;text-transform:uppercase;background:linear-gradient(180deg,#ffffff 35%,#9fd6ff);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 4px 16px rgba(0,0,0,0.65))}.rot-t .sp{display:block;font-family:\"JetBrains Mono\",monospace;font-weight:500;font-size:28px;letter-spacing:0.34em;color:#7cc8ff;margin-bottom:12px;text-transform:uppercase}.rot-t .sl{display:block;width:380px;height:2px;margin:14px auto 0;background:linear-gradient(90deg,rgba(124,200,255,0),#7cc8ff,rgba(124,200,255,0))}#f10-r2,#f10-r3{align-items:flex-end}#f10-r2-in,#f10-r3-in{font-size:68px}"} */
        const st = T.createToyStage(canvas, { fov: 46, ceu: ["#4A6CA3", "#F3B477"], nevoa: [40, 260], corNevoa: "#d9b48c", luz: 0.95 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.5;
        const av = AVENIDA.avenida(S);
        const aves = T.bando(S, { n: 30, seed: 1001, cor: 0x3a3f46 });
        const cervo = AVENIDA.fauna("cervo", { fase: 0.2 }); cervo.group.position.set(1.5, 0.12, 6); cervo.group.rotation.y = 2.2; S.add(cervo.group);
        function render(t) {
          const fl = lerp(0.18, 1, ease.inOutSine(range(t, 0.4, 4.8)));
          av.set({ racha: 1, mato: 1, hera: lerp(0.55, 1, range(t, 0, 4)), sujeira: 0.9, ferrugem: 1, floresta: fl, fenda: 0.6 }, t);
          cervo.update(t, { cabeca: -1.1 + Math.sin(t * 1.3) * 0.08 });
          aves.update(t, [-20 + t * 6, 26 + t, -30], [10, 3, 6], 0.2, 0.6);
          const e = ease.inOutSine(range(t, 0, 5.55));
          const [bx, by, bz] = av.BASE.pos, [lx, ly, lz] = av.BASE.look;
          cam.position.set(lerp(bx, -1.5, e), lerp(by, 13, e), lerp(bz, 36, e));
          cam.lookAt(lerp(lx, 0, e), lerp(ly, 4, e), lerp(lz, -26, e));
          st.sol(0, 0, 70);
          st.draw();
        }
