/*META {"imports": ["oceano"], "rotulos": [{"de": 0.75, "ate": 4.45, "texto": "<span class=\"k\">VOLUME DOS OCEANOS</span><br><span class=\"y\">1,3 bilhão</span><br>de km³ de água"}, {"de": 0.15, "ate": 4.45, "texto": "<span class=\"chip im\">● Imediato<small>em minutos</small></span>", "sai": true}], "css": "    .chip{display:inline-block;font-family:\"JetBrains Mono\",\"Menlo\",monospace;font-weight:500;font-size:28px;letter-spacing:.14em;line-height:1.1;padding:14px 26px;border-radius:6px;text-shadow:none;text-transform:uppercase;background:rgba(4,8,16,.62);text-align:left}.chip.im{color:#ff8a4c;border:2px solid #ff8a4c}.chip.le{color:#7cc8ff;border:2px solid #7cc8ff}.chip.di{color:#ffd28a;border:2px solid #ffd28a}.chip small{display:block;font-size:20px;color:rgba(255,255,255,.8);letter-spacing:.1em;margin-top:6px}#f02-r2{top:1262px!important;height:110px;left:0;right:0;justify-content:center;align-items:flex-start}\n", "D0": 4.51} */
        const O = OCEANO, G0 = 5.36;
        try { await document.fonts.load('500 26px "JetBrains Mono"'); } catch (e) {}
        const st = T.createToyStage(canvas, { fov: 46, ceu: ["#23406b", "#e8b483"], nevoa: [700, 2600], corNevoa: "#b59b84", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        // margem continental: costa (+z) -> plataforma -> talude com cânions -> planície abissal (-z)
        const alt = (x, z) => {
          let y;
          if (z > 120) y = (z - 120) * 0.12 + 6 * O.fbm(x * 0.02, z * 0.02, 3, 4) + 2;
          else if (z > -150) y = -0.06 * (120 - z);
          else if (z > -430) { const k = (-150 - z) / 280; y = -16 - 150 * (k * k * (3 - 2 * k)); }
          else y = -166;
          const talude = clamp((-120 - z) / 60) * clamp((z + 470) / 60);
          for (const cx of [-95, -10, 70, 150]) y -= 22 * talude * Math.exp(-(((x - cx + 12 * Math.sin(z * 0.02)) / 11) ** 2));
          y += (z < -380 ? 7 : 2.2) * O.fbm(x * 0.025, z * 0.025, 4, 8);
          return y;
        };
        const cor = (x, z, y, c) => {
          if (z > 120 && y > 1) O.mistura(c, 0x6f7f45, 0x9a8a5e, (O.ruido(x * 0.03, z * 0.03, 2) + 1) / 2);
          else if (y > -18) O.mistura(c, 0xc0a57a, 0x9e8763, (O.ruido(x * 0.05, z * 0.05, 3) + 1) / 2);
          else if (y > -150) O.mistura(c, 0x8b7963, 0x655748, (-y - 18) / 130);
          else O.mistura(c, 0x5d5044, 0x4a4038, (O.ruido(x * 0.03, z * 0.03, 6) + 1) / 2);
        };
        const chao = O.terreno({ w: 640, d: 1240, sx: 70, sz: 140, cz: -370, alt, cor });
        S.add(chao);
        const cp = chao.geometry.attributes.position, cc = chao.geometry.attributes.color, base = Float32Array.from(cc.array);
        const agua = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000, 1, 1), T.TOON({ color: 0x175670, roughness: 0.16, transparent: true, opacity: 0.93 }));
        agua.rotation.x = -Math.PI / 2; agua.material.envMapIntensity = 0.6; S.add(agua);
        // borda d'água: anel de espuma (tira fina por cima do terreno)
        const nivel = (t) => -1.5 - 172 * ease.inOutCubic(range(t, 0.15, 4.4));
        const cW = new THREE.Color(0xf2efe6), cM = new THREE.Color(0x3b3127), tmp = new THREE.Color();
        function render(t) {
          const wl = nivel(t);
          agua.position.y = wl;
          // terreno molhado logo acima da linha d'água, espuma na borda
          for (let i = 0; i < cp.count; i++) {
            const d = cp.getY(i) - wl;
            tmp.setRGB(base[i * 3], base[i * 3 + 1], base[i * 3 + 2]);
            if (d > 0 && cp.getY(i) < -1) {
              tmp.lerp(cM, 0.45 * clamp(1 - d / 40));
              tmp.lerp(cW, 0.85 * clamp(1 - d / 1.6));
            }
            cc.setXYZ(i, tmp.r, tmp.g, tmp.b);
          }
          cc.needsUpdate = true;
          const u = t / D, e = ease.inOutSine(u);
          const cy = Math.max(wl + 26, lerp(48, -40, e));
          cam.position.set(lerp(-150, -60, e), cy, lerp(-760, -640, e));
          cam.lookAt(lerp(20, 40, e), lerp(-5, -85, e), lerp(-200, -260, e));
          st.sol(0, -300, 420);
          st.key.castShadow = true;
          st.draw();
        }
