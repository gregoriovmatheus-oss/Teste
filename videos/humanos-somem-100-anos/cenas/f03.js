/*META {"imports": ["avenida"], "css": ".rot-t .selo{display:inline-block;font-family:\"Inter\",sans-serif;font-weight:800;font-size:128px;line-height:1.05;letter-spacing:0.01em;text-transform:uppercase;background:linear-gradient(180deg,#ffffff 35%,#9fd6ff);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 4px 16px rgba(0,0,0,0.65))}.rot-t .sp{display:block;font-family:\"JetBrains Mono\",monospace;font-weight:500;font-size:28px;letter-spacing:0.34em;color:#7cc8ff;margin-bottom:12px;text-transform:uppercase}.rot-t .sl{display:block;width:380px;height:2px;margin:14px auto 0;background:linear-gradient(90deg,rgba(124,200,255,0),#7cc8ff,rgba(124,200,255,0))}", "rotulos": [{"de": 0, "ate": 6.71, "top": 300, "fixo": true, "pulso": 0.2, "texto": "<span class=\"sp\">TEMPO SEM HUMANOS</span><span class=\"selo\">HORAS</span><span class=\"sl\"></span>"}, {"de": 2.5, "ate": 4.3, "texto": "Rede elétrica <span class=\"y\">caindo</span>"}, {"de": 4.7, "ate": 6.71, "texto": "<span class=\"k\">EM ATÉ</span><br><span class=\"y\">2 dias</span>"}], "D0": 6.71} */
        const st = T.createToyStage(canvas, { fov: 46, ceu: ["#070C22", "#2B2D52"], nevoa: [60, 320], corNevoa: "#141a33", luz: 0.35, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        st.hemi.color.setHex(0x8fa6ff); st.hemi.intensity = 0.32; st.key.color.setHex(0xaab8ff); st.rim.intensity = 0.1; S.environment = null;
        const av = AVENIDA.avenida(S);
        // estrelas (aparecem quando a cidade apaga)
        const rs = mulberry32(303), sp = new Float32Array(600 * 3);
        for (let i = 0; i < 600; i++) { const a = rs() * 6.28, e = 0.15 + rs() * 1.2, d = 900; sp[i * 3] = Math.cos(a) * Math.cos(e) * d; sp[i * 3 + 1] = Math.sin(e) * d; sp[i * 3 + 2] = Math.sin(a) * Math.cos(e) * d - 200; }
        const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
        const sm = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
        S.add(new THREE.Points(sg, sm));
        function render(t) {
          // 3,3 s: a rede começa a cair (prédio a prédio); ~6 s: tudo apagado
          const ap = ease.inOutSine(range(t, 3.3, 6.1));
          const rua = t < 4.9 ? 1 : t < 5.25 ? (Math.sin(t * 60) > 0 ? 0.9 : 0.1) : 0;
          av.set({ janelas: 1, apagao: ap, skyline: ease.inOutSine(range(t, 3.0, 5.6)), luzRua: rua, farois: lerp(0.9, 0.35, range(t, 0, 6.7)), sinal: t < 4.9 ? 1 : 0, sujeira: 0.08 }, t);
          sm.opacity = 0.9 * range(t, 4.8, 6.4);
          const e = ease.inOutSine(range(t, 0, 6.71));
          const [bx, by, bz] = av.BASE.pos, [lx, ly, lz] = av.BASE.look;
          cam.position.set(lerp(bx, 7, e), lerp(by, 24, e), lerp(bz, 72, e));
          cam.lookAt(lerp(lx, 0, e), lerp(ly, 10, e), lerp(lz, -40, e));
          st.sol(0, 0, 80);
          st.draw();
        }
