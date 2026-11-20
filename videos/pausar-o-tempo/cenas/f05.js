/*META {"imports": ["pausa"], "rotulos": [{"de": 0.3, "ate": 1.95, "texto": "<span class=\"k\">O SOM</span><br>Uma <span class=\"y\">onda</span> no ar"}], "D0": 4.12} */
        // f05 — o som como onda de pressão: moléculas se comprimindo em anéis a partir de um alto-falante.
        //       Com o ar parado (2,2 s) as frentes de onda congelam e o osciloscópio vira uma linha reta: silêncio.
        const st = T.createToyStage(canvas, { fov: 42, ceu: ["#04060c", "#0c1322"], nevoa: [10, 46], corNevoa: "#060911", nuvens: 0, exposicao: 1.1 });
        const S = st.scene, cam = st.cam;
        st.key.castShadow = false; st.hemi.intensity = 0.5; st.rim.color.set(0x7cc8ff);
        // alto-falante
        const fal = new THREE.Group(); S.add(fal); fal.position.set(-7, 0, 0);
        T.mesh(T.roundBox(1.6, 3.2, 1.6, 0.15), 0x1b1e24, fal, 0.4).position.y = -1.6;
        const cone = T.mesh(new THREE.ConeGeometry(0.62, 0.45, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0x2c3038, roughness: 0.6, side: THREE.DoubleSide }), fal); cone.rotation.z = Math.PI / 2; cone.position.set(0.95, 0.3, 0);
        const membr = PAUSA.glow(0x7cc8ff, 2.2, fal); membr.position.set(1.0, 0.3, 0);
        // campo de moléculas em pontos: deslocamento radial a partir da fonte (onda longitudinal)
        const NX = 120, NY = 70, NZ = 3, N = NX * NY * NZ, W = PAUSA.pontos(S, N, { tam: 1, atenua: 260 });
        const rr = mulberry32(505), B = [];
        for (let i = 0; i < N; i++) { const x = -6 + rr() * 22, y = -4.5 + rr() * 9.5, z = (rr() - 0.5) * 2.4; B.push([x, y, z, Math.hypot(x + 6, y - 0.3, z)]); W.Z[i] = 0.12 + rr() * 0.06; }
        const TS = 2.2, k = 2.4, w = 9;
        function render(t) {
          const te = PAUSA.tMundo(t, TS, 0.2);
          for (let i = 0; i < N; i++) {
            const [x, y, z, r] = B[i], ph = k * r - w * te, d = 0.16 * Math.sin(ph) * Math.exp(-r * 0.03), f = (r + d) / r;
            W.P.set([-6 + (x + 6) * f, 0.3 + (y - 0.3) * f, z * f], i * 3);
            const comp = 0.5 + 0.5 * Math.cos(ph), frente = r < w / k * te + 0.5 ? 1 : 0.15;
            W.C.set([lerp(0.25, 0.6, comp), lerp(0.45, 0.85, comp), 1], i * 3); W.A[i] = (0.25 + 0.75 * comp * comp) * frente;
          }
          W.sync();
          const vib = t < TS ? Math.sin(t * w) : 0; cone.position.x = 0.95 + vib * 0.05; membr.material.opacity = 0.35 + 0.35 * Math.abs(vib);
          st.bloom = 0.75;
          const e = ease.inOutSine(range(t, 0, 4.12));
          cam.position.set(lerp(-1, 3.5, e), lerp(6.5, 3.0, e), lerp(12.5, 10.5, e));
          cam.lookAt(lerp(1, 0.5, e), lerp(-0.6, 0.2, e), 0);
          st.sol(0, 0, 20);
          st.draw();
          // osciloscópio (pressão num ponto do ar): onda até 2,2 s, depois linha reta
          const c = st.ctx, gx = 140, gy = 1370, gw = 800, gh = 150, ga = PAUSA.vis(t, 0.4, 4.12);
          if (ga > 0) {
            c.save(); c.globalAlpha = ga; c.fillStyle = "rgba(4,10,20,0.55)"; c.fillRect(gx - 24, gy - gh / 2 - 60, gw + 48, gh + 100);
            c.strokeStyle = "rgba(124,200,255,0.25)"; c.lineWidth = 1; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + gw, gy); c.stroke();
            c.strokeStyle = t < TS + 0.4 ? PAUSA.AZUL : PAUSA.LARANJA; c.lineWidth = 4; c.beginPath();
            for (let px = 0; px <= gw; px += 3) { const tt = te - (1 - px / gw) * 1.2; const v = tt < te && te < TS + 0.3 ? Math.sin(tt * w * 1.0) * (1 - range(t, TS, TS + 0.3)) : 0; c.lineTo(gx + px, gy - v * gh * 0.42); }
            c.stroke(); c.restore();
            PAUSA.texto(c, "PRESSÃO DO AR", gx, gy - gh / 2 - 30, { a: ga, cor: PAUSA.AZUL, tam: 22, esp: 0.3 });
            PAUSA.texto(c, t < 2.84 ? "" : "SILÊNCIO · 0 dB", gx + gw, gy - gh / 2 - 30, { a: ga * range(t, 2.84, 3.0), cor: PAUSA.LARANJA, tam: 30, alinha: "right", esp: 0.2 });
          }
        }
