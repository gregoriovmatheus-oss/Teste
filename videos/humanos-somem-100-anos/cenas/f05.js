/*META {"imports": ["avenida"], "css": ".rot-t .selo{display:inline-block;font-family:\"Inter\",sans-serif;font-weight:800;font-size:128px;line-height:1.05;letter-spacing:0.01em;text-transform:uppercase;background:linear-gradient(180deg,#ffffff 35%,#9fd6ff);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 4px 16px rgba(0,0,0,0.65))}.rot-t .sp{display:block;font-family:\"JetBrains Mono\",monospace;font-weight:500;font-size:28px;letter-spacing:0.34em;color:#7cc8ff;margin-bottom:12px;text-transform:uppercase}.rot-t .sl{display:block;width:380px;height:2px;margin:14px auto 0;background:linear-gradient(90deg,rgba(124,200,255,0),#7cc8ff,rgba(124,200,255,0))}", "rotulos": [{"de": 0, "ate": 5.19, "top": 300, "fixo": true, "pulso": 0.2, "texto": "<span class=\"sp\">TEMPO SEM HUMANOS</span><span class=\"selo\">ANOS</span><span class=\"sl\"></span>"}, {"de": 0.85, "ate": 2.9, "texto": "<span class=\"y\">Gelo</span> + <span class=\"y\">calor</span>"}, {"de": 3.1, "ate": 5.19, "texto": "Mato em <span class=\"y\">cada fresta</span>"}], "D0": 5.19} */
        const st = T.createToyStage(canvas, { fov: 48, ceu: ["#8FA9C4", "#E6E2D6"], nevoa: [40, 280], luz: 0.85 });
        const S = st.scene, cam = st.cam;
        const av = AVENIDA.avenida(S);
        const bgInv = S.background, bgVer = T.gradTex("#5E95D0", "#F3DDB2");
        // neve caindo (inverno), some quando chega o calor
        const rn = mulberry32(505), NP = 1400, np = new Float32Array(NP * 3), nv = Array.from({ length: NP }, () => [(rn() - 0.5) * 40, rn() * 30, 10 + rn() * 40, rn() * 6, 1.5 + rn()]);
        const ng = new THREE.BufferGeometry(); ng.setAttribute("position", new THREE.BufferAttribute(np, 3));
        const nm = new THREE.PointsMaterial({ color: 0xffffff, size: 0.16, transparent: true, opacity: 0.9, depthWrite: false });
        const neve = new THREE.Points(ng, nm); neve.frustumCulled = false; S.add(neve);
        function render(t) {
          const inverno = 1 - ease.inOutSine(range(t, 1.3, 2.6));
          const racha = ease.inOutSine(range(t, 1.55, 3.0));
          const mato = ease.outCubic(range(t, 2.95, 5.0));
          av.set({ neve: inverno, racha, mato, sujeira: 0.3, ferrugem: 0.12, hera: 0.08 + mato * 0.12 }, t);
          S.background = inverno > 0.5 ? bgInv : bgVer;
          st.key.intensity = lerp(1.4, 3.0, 1 - inverno); st.key.color.setHex(inverno > 0.5 ? 0xdfe8ff : 0xffd2a0);
          nm.opacity = 0.9 * inverno;
          nv.forEach(([x, y0, z, ph, sp], i) => { np[i * 3] = x + Math.sin(t * 1.3 + ph) * 0.6; np[i * 3 + 1] = ((y0 - t * sp) % 30 + 30) % 30; np[i * 3 + 2] = z; });
          ng.attributes.position.needsUpdate = true;
          // começa rente ao asfalto (vê a rachadura e o broto) e sobe até o enquadramento-base
          const e = ease.inOutCubic(range(t, 0.2, 5.19));
          const [bx, by, bz] = av.BASE.pos, [lx, ly, lz] = av.BASE.look;
          cam.position.set(lerp(0.3, bx, e), lerp(1.5, by, e), lerp(28, bz, e));
          cam.lookAt(lerp(-0.6, lx, e), lerp(0.1, ly, e), lerp(17, lz, e));
          st.sol(0, 15, 60);
          st.draw();
        }
