/*META {"imports": ["oceano"], "rotulos": [{"de": 1.1, "ate": 2.0, "texto": "Quase <span class=\"y\">vazio</span>"}, {"de": 3.3, "ate": 4.7, "texto": "<span class=\"k\">RECUPERAÇÃO</span><br>Décadas, talvez <span class=\"y\">séculos</span>"}, {"de": 3.3, "ate": 7.99, "texto": "<span class=\"chip le\">● Lento<small>décadas a séculos</small></span>", "sai": false}, {"de": 4.74, "ate": 7.99, "sai": false, "top": 660, "texto": "A água voltou.<br><span class=\"y\">A vida, não.</span>"}], "css": "    .chip{display:inline-block;font-family:\"JetBrains Mono\",\"Menlo\",monospace;font-weight:500;font-size:28px;letter-spacing:.14em;line-height:1.1;padding:14px 26px;border-radius:6px;text-shadow:none;text-transform:uppercase;background:rgba(4,8,16,.62);text-align:left}.chip.im{color:#ff8a4c;border:2px solid #ff8a4c}.chip.le{color:#7cc8ff;border:2px solid #7cc8ff}.chip.di{color:#ffd28a;border:2px solid #ffd28a}.chip small{display:block;font-size:20px;color:rgba(255,255,255,.8);letter-spacing:.1em;margin-top:6px}#f13-r3{top:1262px!important;height:110px;left:0;right:0;justify-content:center;align-items:flex-start}\n", "D0": 7.99} */
        const O = OCEANO, G0 = 65.3;
        try { await document.fonts.load('500 26px "JetBrains Mono"'); } catch (e) {}
        // o oceano de volta: azul, mas vazio. Recife morto (branco/cinza), neve marinha, raios de luz, nenhum peixe.
        const st = T.createToyStage(canvas, { fov: 50, ceu: ["#1f6e9c", "#0a2a40"], nevoa: [6, 90], corNevoa: "#0f4766", nuvens: 0, exposicao: 1.1, luz: 0.9 });
        const S = st.scene, cam = st.cam;
        st.hemi.color.setHex(0x9fd8ff); st.key.color.setHex(0xd8f0ff); st.rim.color.setHex(0x5fb0d8);
        const alt = (x, z) => 0.9 * O.fbm(x * 0.06, z * 0.06, 4, 131) + 0.12 * Math.sin(x * 0.9 + z * 0.3);
        S.add(O.terreno({ w: 220, d: 220, sx: 70, sz: 70, cz: -60, alt, cor: (x, z, y, c) => O.mistura(c, 0x8f8a78, 0xc2b99c, (y + 0.9) / 1.8) }));
        const rr = mulberry32(132), tipos = ["galho", "cerebro", "leque", "tubo"], corais = [];
        for (let i = 0; i < 26; i++) {
          const x = (rr() - 0.5) * 26, z = 4 - rr() * 40, c = O.coral(140 + i, tipos[i % 4], 0xd8d2c4);
          c.branquear(1, 0.25 + rr() * 0.5); c.group.position.set(x, alt(x, z) - 0.05, z); c.group.scale.setScalar(0.8 + rr() * 0.9); c.group.rotation.y = rr() * 6; S.add(c.group); corais.push(c);
        }
        // superfície vista de baixo
        const sup = new THREE.Mesh(new THREE.PlaneGeometry(400, 400, 40, 40), new THREE.MeshBasicMaterial({ color: 0x7fd0f0, transparent: true, opacity: 0.55, side: THREE.DoubleSide, fog: false }));
        sup.rotation.x = Math.PI / 2; sup.position.y = 16; S.add(sup);
        const sp = sup.geometry.attributes.position, sb = Float32Array.from(sp.array);
        // raios de luz (planos aditivos)
        const rc = document.createElement("canvas"); rc.width = 64; rc.height = 256;
        { const g = rc.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(200,240,255,0.55)"); gr.addColorStop(1, "rgba(200,240,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
          const gx = g.createLinearGradient(0, 0, 64, 0); gx.addColorStop(0, "rgba(0,0,0,1)"); gx.addColorStop(0.5, "rgba(0,0,0,0)"); gx.addColorStop(1, "rgba(0,0,0,1)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = gx; g.fillRect(0, 0, 64, 256); }
        const rt = new THREE.CanvasTexture(rc); rt.colorSpace = THREE.SRGBColorSpace;
        const raios = Array.from({ length: 9 }, (_, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(3 + rr() * 4, 26), new THREE.MeshBasicMaterial({ map: rt, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }));
          m.position.set((rr() - 0.5) * 34, 3, -6 - rr() * 30); m.rotation.set(0, rr() * 3, 0.25); m.userData.f = rr() * 6; S.add(m); return m; });
        // neve marinha
        const NN = 500, ng = new THREE.BufferGeometry(), np = new Float32Array(NN * 3), ns = [];
        for (let i = 0; i < NN; i++) ns.push([(rr() - 0.5) * 40, rr() * 16, 6 - rr() * 45, rr()]);
        ng.setAttribute("position", new THREE.BufferAttribute(np, 3));
        S.add(new THREE.Points(ng, new THREE.PointsMaterial({ color: 0xe8f4ff, size: 0.09, map: O.texPonto(), transparent: true, depthWrite: false, opacity: 0.8 })));
        // um único peixinho ao longe: "quase" vazio
        const pz = O.peixe(0x9fb3bd, 150); pz.group.scale.setScalar(0.9); S.add(pz.group);
        function render(t) {
          for (let i = 0; i < sp.count; i++) sp.setZ(i, 0.35 * Math.sin(sb[i * 3] * 0.15 + t * 1.2) * Math.cos(sb[i * 3 + 1] * 0.12 - t));
          sp.needsUpdate = true;
          raios.forEach((m) => { m.material.opacity = 0.5 + 0.35 * Math.sin(t * 0.9 + m.userData.f); });
          for (let i = 0; i < NN; i++) { const [x, y, z, f] = ns[i]; np.set([x + Math.sin(t * 0.5 + f * 9) * 0.3, ((y - t * 0.35) % 16 + 16) % 16, z], i * 3); }
          ng.attributes.position.needsUpdate = true;
          pz.group.position.set(lerp(14, 4, t / D), 4.5, -26); pz.group.rotation.y = Math.PI; pz.tail.rotation.y = Math.sin(t * 7) * 0.4;
          const u = t / D, e = ease.inOutSine(u);
          cam.position.set(lerp(-2, 1.5, u), lerp(3.2, 5.0, e), lerp(12, 0, u));
          cam.lookAt(lerp(0, 1, u), lerp(1.2, 6.5, ease.inOutCubic(range(t, 4.5, 7.99))), lerp(-20, -30, u));
          st.sol(0, -10, 40, 0);
          st.draw(S, cam, { cor: "#000", a: 0.35 * range(t, 6.2, 7.99) });
        }
