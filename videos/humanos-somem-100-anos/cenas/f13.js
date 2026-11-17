/*META {"imports": ["avenida"], "rotulos": [{"de": 1.4, "ate": 3.54, "texto": "A natureza<br><span class=\"y\">não esperou</span>"}], "D0": 3.54} */
        const st = T.createToyStage(canvas, { fov: 44, ceu: ["#3F5F98", "#F1AB70"], nevoa: [60, 320], corNevoa: "#d6ad86", luz: 0.95 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.45;
        const av = AVENIDA.avenida(S);
        const off = document.createElement("canvas"); off.width = 1080; off.height = 1920;
        const oc = off.getContext("2d");
        function render(t) {
          const e = ease.inOutSine(range(t, 0, 3.54));
          cam.position.set(lerp(22, -10, e), lerp(30, 24, e), lerp(58, 52, e));
          cam.lookAt(0, 3, lerp(-12, -18, e));
          st.sol(0, 0, 80);
          // antes: cidade limpa, luzes acesas
          av.set({ janelas: 0.6, luzRua: 0.8, farois: 0.5, sinal: 1 }, t);
          st.draw();
          oc.clearRect(0, 0, 1080, 1920); oc.drawImage(canvas, 0, 0);
          // 100 anos depois: a mata toma a avenida
          av.set({ racha: 1, mato: 1, hera: 1, sujeira: 0.9, ferrugem: 1, floresta: 1, fenda: 0.8 }, t);
          st.draw();
          // cortina: o "depois" avança da direita para a esquerda
          const wx = lerp(980, 60, ease.inOutCubic(range(t, 0.25, 3.2)));
          const c = st.ctx;
          c.save(); c.beginPath(); c.rect(0, 0, wx, 1920); c.clip(); c.drawImage(off, 0, 0); c.restore();
          c.save();
          c.fillStyle = "#7cc8ff"; c.shadowColor = "rgba(124,200,255,0.9)"; c.shadowBlur = 18; c.fillRect(wx - 2, 0, 4, 1920);
          c.shadowBlur = 0; c.font = '600 30px "JetBrains Mono", monospace'; c.textBaseline = "middle";
          c.fillStyle = "rgba(10,14,24,0.55)";
          const tagA = "ANTES", tagB = "+100 ANOS";
          const yA = 560;
          if (wx > 200) { c.fillRect(wx - 210, yA - 26, 190, 52); c.fillStyle = "#ffffff"; c.textAlign = "right"; c.fillText(tagA, wx - 36, yA); }
          c.fillStyle = "rgba(10,14,24,0.55)";
          if (wx < 900) { c.fillRect(wx + 20, yA - 26, 250, 52); c.fillStyle = "#7cc8ff"; c.textAlign = "left"; c.fillText(tagB, wx + 36, yA); }
          c.restore();
        }
