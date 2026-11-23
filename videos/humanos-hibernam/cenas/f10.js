/*META {"imports": ["hiber"], "rotulos": [{"de": 0.42, "ate": 1.75, "texto": "<span class=\"k\">A SOCIEDADE</span><br>Tudo <span class=\"y\">em pausa</span>"}, {"de": 4.84, "ate": 5.81, "texto": "Pausa de <span class=\"y\">3 meses</span>", "sai": false}], "D0": 5.81, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        await HIBER.prepara();
        const st = T.createToyStage(canvas, { fov: 38, ceu: ["#0a1222", "#4a5e7e"], nevoa: [20, 90], corNevoa: "#26344a", nuvens: 0, exposicao: 0.8 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0xbcd2f0); st.key.intensity = 1.5; st.hemi.intensity = 0.4; st.rim.color.set(0x7cc8ff); st.rim.intensity = 0.6;
        const r = T.rua({ len: 70, larg: 10, calc: 3, seed: 6, arvores: false, hMin: 8, hMax: 20, chao: 0xdfe8f2 }); S.add(r.group);
        r.buildings.forEach((b) => (b.userData.win.emissiveIntensity = 0));
        const neveRua = new THREE.Mesh(new THREE.PlaneGeometry(16, 70), T.M(0xe8eef6, 0.85)); neveRua.rotation.x = -Math.PI / 2; neveRua.position.y = 0.42; S.add(neveRua);
        // placa da escola na calçada
        const pl = new THREE.Group(); pl.position.set(3.2, 0.4, -4); pl.rotation.y = -0.35; S.add(pl);
        for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), T.M(0x2a2c30, 0.4, { metalness: 0.7 })); p.position.set(s * 1.1, 1.2, 0); pl.add(p); }
        const placa = HIBER.placa("ESCOLA FECHADA\nVOLTAMOS EM MARÇO", { w: 2.6, h: 1.2, tam: 70 }); placa.position.y = 2.2; pl.add(placa);
        const nv = HIBER.neve(S, { n: 1600, x: [-8, 10], y: [0, 10], z: [-24, 14], seed: 61, tam: 0.07, vel: 0.7 });
        const ITENS = [["ESCOLAS", 1.85], ["EMPREGOS", 2.36], ["CONTAS", 3.08]];
        function render(t) {
          nv.update(t, 0.1);
          // grua descendo pela rua até a placa
          const e = ease.inOutSine(range(t, 0, 5.81));
          cam.position.set(lerp(-1.5, 2.0, e), lerp(9, 2.5, e), lerp(16, 3.0, e));
          cam.lookAt(lerp(0.5, 3.6, e), lerp(-1.5, 1.3, e), -4);
          st.bloom = 0.45; st.sol(0, -4, 20);
          st.draw();
          const c = st.ctx, vv = HIBER.vis(st), sai = 1 - range(t, 4.4, 4.75);
          ITENS.forEach(([s, t0], i) => {
            const a = vv * range(t, t0, t0 + 0.25) * sai, y = 730 + i * 82; if (a <= 0) return;
            HIBER.painel(c, 230, y - 32, 480, 64, a);
            HIBER.txt(c, s, 260, y, { tam: 30, al: "left", a, esp: 0.15 });
            HIBER.txt(c, "PAUSADO", 680, y, { tam: 24, cor: HIBER.LARANJA, al: "right", a: a * range(t, 3.53, 3.9), esp: 0.2 });
          });
        }
