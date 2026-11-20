/*META {"imports": ["pausa"], "rotulos": [{"de": 0.2, "ate": 1.9, "texto": "<span class=\"k\">O AR</span><br>O ar <span class=\"y\">também</span>"}], "D0": 7.95} */
        // f04 — moléculas de ar (N₂ e O₂) voando a ~500 m/s com rastro; travam no ar (4,4 s). Depois a câmera recua e revela
        //       um rosto de perfil diante de uma "parede" de moléculas paradas: respirar seria puxar uma parede.
        const st = T.createToyStage(canvas, { fov: 46, ceu: ["#04060c", "#0e1626"], nevoa: [6, 34], corNevoa: "#070b14", nuvens: 0, exposicao: 1.15 });
        const S = st.scene, cam = st.cam;
        st.key.castShadow = false; st.key.intensity = 1.6; st.key.color.set(0xcfe4ff); st.hemi.intensity = 0.6; st.rim.color.set(0x7cc8ff); st.rim.intensity = 1.6;
        const MOL = PAUSA.moleculas(S, { n: 150, seed: 404, caixa: [-1.6, 14, -5, 6, -9, 5] });
        const PAR = PAUSA.moleculas(S, { n: 70, seed: 405, caixa: [-3.05, -2.25, -1.4, 1.5, -1.8, 1.8], cores: [0xff8a4c, 0xffb58a], o2: 0.3 });
        PAR.at.material = PAR.at.material.clone(); PAR.at.material.emissive = new THREE.Color(0xff6a2c); PAR.at.material.emissiveIntensity = 0;
        // rosto de perfil (humano grande) olhando para +x, boca diante da parede
        const H = PAUSA.pessoa({ cor: 0x2a3340, cabelo: 0x2b1d16 }); H.group.scale.setScalar(3.6); H.group.position.set(-4.3, -6.25, 0); S.add(H.group);
        const heroi = MOL.P[7]; heroi.v.set(1, 0.25, 0.4).normalize().multiplyScalar(7);
        MOL.at.setColorAt(14, new THREE.Color(0xff8a4c)); MOL.at.setColorAt(15, new THREE.Color(0xff8a4c));
        const TS = 4.35, TB = 5.1;
        function render(t) {
          const te = PAUSA.tMundo(t, TS, 0.22) * 0.55, vk = 1 - range(t, TS - 0.1, TS + 0.45);
          MOL.update(te, vk); PAR.update(te, 0);
          const parede = ease.inOutSine(range(t, 5.5, 7.3));
          PAR.at.material.emissiveIntensity = 0.9 * parede; PAR.at.visible = t > TB - 0.2;
          H.pose(t, { cabeca: 0.05, respira: Math.sin(Math.PI * range(t, 5.6, 7.4)) * 0.4 });
          H.group.visible = t > TB - 0.2;
          st.bloom = 0.6 + 0.3 * parede;
          let c0, l0;
          if (t < TB) { // voo entre as moléculas, seguindo a molécula-herói
            const e = ease.inOutSine(range(t, 0, TB));
            const hp = heroi.pos || new THREE.Vector3();
            cam.position.set(lerp(1.5, 6, e), lerp(-0.5, 1.2, e), lerp(5.5, 3.2, e));
            cam.lookAt(lerp(5, hp.x, range(t, 2.0, 2.8)), lerp(0.5, hp.y, range(t, 2.0, 2.8)), lerp(-3, hp.z, range(t, 2.0, 2.8)));
          } else { // recua e revela o rosto diante da parede
            const e = ease.inOutCubic(range(t, TB, 7.95));
            cam.position.set(lerp(1.2, -1.2, e), lerp(0.8, 0.6, e), lerp(3.2, 8.2, e));
            cam.lookAt(lerp(-1.8, -2.9, e), lerp(0.4, 0.1, e), 0);
          }
          st.sol(0, 0, 15);
          st.draw(S, cam, t > TB - 0.15 && t < TB + 0.15 ? { cor: "#05070d", a: 1 - Math.abs(t - TB) / 0.15 } : null);
          const c = st.ctx;
          if (t < TB && heroi.pos) {
            const [hx, hy, ok] = PAUSA.proj(heroi.pos, cam);
            const vel = t < 4.71 ? "500 m/s" : "0 m/s";
            if (ok) PAUSA.tag(c, hx, hy, hx > 540 ? hx - 200 : hx + 200, hy > 1000 ? hy - 260 : hy + 220, [["MOLÉCULA DE AR", PAUSA.AZUL], [vel, t < 4.71 ? "#fff" : PAUSA.LARANJA]], { a: PAUSA.vis(t, 2.7, TB - 0.05) });
          } else {
            const [wx, wy] = PAUSA.proj(new THREE.Vector3(-2.6, 1.2, 0), cam);
            PAUSA.tag(c, wx, wy, 700, 560, [["AR TRAVADO", PAUSA.LARANJA], ["uma parede", "#fff"]], { a: PAUSA.vis(t, 6.9, 7.95), cor: PAUSA.LARANJA });
            // seta de inspiração bloqueada
            const k = PAUSA.vis(t, 5.47, 7.95), [bx, by] = PAUSA.proj(new THREE.Vector3(-3.35, -0.05, 0), cam), [ax, ay] = PAUSA.proj(new THREE.Vector3(-0.4, -0.05, 0), cam);
            if (k > 0) { c.save(); c.globalAlpha = k; c.strokeStyle = PAUSA.AZUL; c.lineWidth = 6; c.setLineDash([18, 12]); c.beginPath(); c.moveTo(ax, ay); c.lineTo(lerp(ax, bx, 0.62), lerp(ay, by, 0.62)); c.stroke();
              c.setLineDash([]); c.strokeStyle = PAUSA.LARANJA; const xx = lerp(ax, bx, 0.62), yy = lerp(ay, by, 0.62); c.beginPath(); c.moveTo(xx - 22, yy - 22); c.lineTo(xx + 22, yy + 22); c.moveTo(xx + 22, yy - 22); c.lineTo(xx - 22, yy + 22); c.stroke(); c.restore();
              PAUSA.texto(c, "INSPIRAR", (ax + bx) / 2 + 60, ay + 60, { a: k, cor: PAUSA.AZUL, tam: 26, esp: 0.3 }); }
          }
        }
