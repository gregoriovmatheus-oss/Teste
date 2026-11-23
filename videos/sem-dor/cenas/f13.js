/*META {"imports": ["lowpoly", "dor"], "rotulos": [{"de": 3.5, "ate": 6.67, "top": 700, "sai": false, "texto": "<span class=\"k\">A DOR É O ALARME</span><br>Seu corpo tentando te manter <span class=\"y\">vivo</span>"}], "D0": 6.67} */
        const LP = LOWPOLY;
        const st = LP.palco(canvas, { foco: 1.6, faixa: 0.5, desfoque: 26 });
        const { S, cam } = st;
        S.background = new THREE.Color(0x1a1612);
        st.hemi.intensity = 0.9; st.quente.intensity = 2.6;
        const p = LP.pessoa({ seed: 4 }); S.add(p.root);
        const KZ = DOR.cozinhaR11(S, LP);
        KZ.cebola.position.set(0.27, 1.04, 0.47); KZ.cebola.rotation.y = -0.3;
        const esq = p.bracos[0];
        esq.cot.add(KZ.risco); KZ.risco.position.set(-0.025, -0.405, 0.022);
        esq.cot.add(KZ.gota); KZ.gota.position.set(-0.025, -0.41, 0.026);
        LP.bokeh(S, { n: 30, seed: 5, y: [1.2, 3], z: [-6, -2], cores: [0xffc070, 0xffe0b0, 0x7fb6ff] });
        const alvo = new THREE.Vector3(), mp = new THREE.Vector3();
        const ROSTO = [0.02, 1.64, 0.06];
        const TC = 1.75;   // a picada que corta ("cortar o dedo")
        function render(t) {
          const ch = t < TC + 0.1 ? Math.pow(0.5 + 0.5 * Math.sin((t - TC) * Math.PI * 2 * 2.2 + Math.PI / 2), 2) : lerp(1, 0.2, range(t, TC + 0.1, TC + 0.5));
          DOR.poseCozinha(p, ch, KZ.faca, { inclina: lerp(0.3, -0.05, ease.outCubic(range(t, 2.05, 2.4))) });
          // agora dói: a mão esquerda é puxada para o peito
          const pu = ease.outBack(range(t, TC + 0.05, TC + 0.4)), rel = ease.inOutSine(range(t, 3.4, 5.0));
          if (pu > 0) {
            esq.om.rotation.set(lerp(-0.55, -1.05, pu), 0, lerp(0.32, 0.1, pu));
            esq.cot.rotation.set(lerp(-1.05, -1.7, pu), 0, lerp(-0.75, -1.2, pu));
          }
          // grito em "gritar" (2,37 s), depois alívio
          if (t < 2.05) p.emocao("calmo", [0.05, -0.45]);
          else if (t < 3.5) p.emocao("panico", [Math.sin(t * 9) * 0.05, 0.05]);
          else p.emocao(rel < 0.5 ? "medo" : "triste", [0.0, lerp(0.0, -0.15, rel)]);
          KZ.risco.scale.set(range(t, TC, TC + 0.08) || 1e-4, 1, 1);
          const g = ease.outCubic(range(t, TC + 0.2, 4.0));
          KZ.gota.scale.setScalar(g ? 0.5 + g * 0.8 : 1e-4);
          esq.cot.updateMatrixWorld(true); KZ.risco.getWorldPosition(mp);
          // mesma abertura do começo → mãos no corte → corte seco para o rosto gritando → recua devagar
          const a = ease.inOutCubic(range(t, 1.2, 1.65)) * (t < 2.05 ? 1 : 0), b = t >= 2.05 ? 1 : 0;
          const c0 = [0.32, 1.66, 1.62], l0 = [0.04, 1.4, 0.06];
          const c1 = [mp.x - 0.02, mp.y + 0.3, mp.z + 0.46], l1 = [mp.x + 0.01, mp.y - 0.07, mp.z - 0.02];
          const e2 = ease.outCubic(range(t, 2.05, 6.67));
          const c2 = [lerp(0.12, 0.3, e2), lerp(1.68, 1.7, e2), lerp(0.95, 1.75, e2)], l2 = [0.02, lerp(1.52, 1.42, e2), 0.06];
          const P = [0, 1, 2].map((i) => b ? c2[i] : lerp(c0[i], c1[i], a)), L = [0, 1, 2].map((i) => b ? l2[i] : lerp(l0[i], l1[i], a));
          const tr = b ? Math.max(0, 1 - (t - 2.05) / 1.2) * 0.012 : 0;   // tremor do susto
          cam.position.set(P[0] + Math.sin(t * 47) * tr - (b ? 0 : t * 0.025), P[1] + Math.sin(t * 61 + 1) * tr, P[2] - (b ? 0 : t * 0.025)); cam.lookAt(L[0], L[1], L[2]);
          const dRosto = cam.position.distanceTo(alvo.set(...ROSTO)), dMao = cam.position.distanceTo(mp);
          st.U.foco.value = b ? dRosto : lerp(dRosto, dMao, a); st.U.faixa.value = b ? 0.4 : lerp(0.45, 0.18, a);
          st.draw();
          // alarme do corpo: clarão laranja pulsando nas bordas no grito
          const al = range(t, 2.05, 2.2) * (1 - range(t, 2.6, 3.6)) * (0.75 + 0.25 * Math.sin(t * 18));
          if (al > 0) { const c = st.ctx, gr = c.createRadialGradient(540, 760, 300, 540, 900, 1100); gr.addColorStop(0, "rgba(255,90,40,0)"); gr.addColorStop(1, "rgba(255,90,40,0.55)");
            c.globalAlpha = al; c.fillStyle = gr; c.fillRect(0, 0, 1080, 1920); c.globalAlpha = 1; }
        }
