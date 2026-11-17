/*META {"imports": ["oceano"], "rotulos": [{"de": 1.25, "ate": 3.3, "texto": "<span class=\"k\">VIDA MARINHA</span><br>Fim <span class=\"y\">imediato</span>"}, {"de": 1.25, "ate": 5.95, "texto": "<span class=\"chip im\">● Imediato<small>peixes · corais · baleias</small></span>", "sai": true}], "css": "    .chip{display:inline-block;font-family:\"JetBrains Mono\",\"Menlo\",monospace;font-weight:500;font-size:28px;letter-spacing:.14em;line-height:1.1;padding:14px 26px;border-radius:6px;text-shadow:none;text-transform:uppercase;background:rgba(4,8,16,.62);text-align:left}.chip.im{color:#ff8a4c;border:2px solid #ff8a4c}.chip.le{color:#7cc8ff;border:2px solid #7cc8ff}.chip.di{color:#ffd28a;border:2px solid #ffd28a}.chip small{display:block;font-size:20px;color:rgba(255,255,255,.8);letter-spacing:.1em;margin-top:6px}#f08-r2{top:1262px!important;height:110px;left:0;right:0;justify-content:center;align-items:flex-start}\n", "D0": 6.01} */
        const O = OCEANO, G0 = 35.56;
        const st = T.createToyStage(canvas, { fov: 48, ceu: ["#2b4a78", "#e7b383"], nevoa: [60, 380], corNevoa: "#c4a283", nuvens: 0, exposicao: 1.08 });
        const S = st.scene, cam = st.cam;
        const alt = (x, z) => 0.8 * O.fbm(x * 0.05, z * 0.05, 4, 81) + 0.1 * Math.sin(x * 0.7 + 2 * O.ruido(x * 0.05, z * 0.05, 82));
        S.add(O.terreno({ w: 300, d: 300, sx: 80, sz: 80, cz: -60, alt, cor: (x, z, y, c) => O.mistura(c, 0x9d8c6e, 0xc4b18b, (y + 0.8) / 1.6 + 0.25 * O.ruido(x * 0.15, z * 0.15, 83)) }));
        const rr = mulberry32(84);
        // recife no seco: corais perdendo a cor (branqueamento) diante da câmera
        const tipos = ["galho", "cerebro", "leque", "tubo"], CC = [0xe8743b, 0xb24f8e, 0xe0b23a, 0xd8574a, 0x7f5bb5, 0x46a69a];
        const corais = [];
        for (let i = 0; i < 20; i++) {
          const x = -6 + (rr() - 0.5) * 22, z = -2 - rr() * 16, c = O.coral(90 + i, tipos[i % 4], CC[i % 6]);
          c.group.position.set(x, alt(x, z) - 0.05, z); c.group.scale.setScalar(0.7 + rr() * 0.6); c.group.rotation.y = rr() * 6; S.add(c.group); corais.push(c);
        }
        // peixes se debatendo
        const cores = [0xd0a03a, 0x9fb3bd, 0xd06a3a, 0x6d8a9a, 0xe0c060, 0xb0503a];
        const pe = Array.from({ length: 9 }, (_, i) => { const f = O.peixe(cores[i % 6], 100 + i); f.group.scale.setScalar(1.7); S.add(f.group);
          const x = 6 - i * 2.3 + rr() * 1.2, z = 3 - rr() * 6; return { f, x, z, y: alt(x, z), fase: rr() * 6, giro: rr() * 6 }; });
        // baleia encalhada
        const bal = A.createAnimal("baleia", { fase: 0.2 }); bal.group.scale.setScalar(1.25); S.add(bal.group);
        const BX = -18, BZ = -6; bal.group.position.set(BX, alt(BX, BZ) + 2.0, BZ); bal.group.rotation.set(0.28, 0.5, 0.03);
        function render(t) {
          corais.forEach((c, i) => c.branquear(ease.inOutSine(range(t, 1.1 + (i % 5) * 0.25, 4.6 + (i % 4) * 0.3))));
          for (const p of pe) {
            const ph = t * 2.4 + p.fase, pulo = Math.pow(Math.max(0, Math.sin(ph)), 5);
            p.f.group.position.set(p.x, p.y + 0.14 + pulo * 0.7, p.z);
            p.f.group.rotation.set(Math.PI / 2 - pulo * 0.6, 0, p.giro + pulo * 0.8);
            p.f.tail.rotation.y = Math.sin(ph * 4) * 0.8 * (0.25 + pulo);
          }
          bal.update(t, { nada: 0.12 });
          bal.tail.rotation.z = 0.15 + Math.sin(t * 0.9) * 0.12;
          bal.group.scale.y = 1.25 * (1 + Math.sin(t * 1.3) * 0.015);
          const u = t / D, e = ease.inOutSine(u);
          cam.position.set(lerp(9, -8, e), lerp(1.6, 3.6, e), lerp(8, 11, e));
          cam.lookAt(lerp(3, -15, e), lerp(0.4, 1.6, e), lerp(-4, -6, e));
          st.sol(-4, -4, 30);
          st.draw();
          O.etiqueta(st.ctx, cam, new THREE.Vector3(-6, 1.6, -9), "CORAIS SECANDO", { dx: -40, dy: -260, tam: 26, a: range(t, 2.4, 2.8) - range(t, 4.2, 4.5) });
          O.etiqueta(st.ctx, cam, new THREE.Vector3(BX + 2, alt(BX, BZ) + 4.5, BZ), "BALEIA ENCALHADA", { dx: 60, dy: -200, tam: 26, a: range(t, 3.0, 3.4) });
        }
