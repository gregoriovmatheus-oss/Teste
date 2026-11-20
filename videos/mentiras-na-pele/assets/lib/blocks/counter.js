/**
 * counter.js — contador / termômetro em 2D HTML (sem Three). De f08 e do HUD.
 *
 *   const c = createCounter(document.getElementById("fNN-root"), {
 *     x: 70, y: 668, unidade: "°C", casas: 2,
 *     passos: [[0, 37], [2.8, 36.99], [4.2, 36.98]],     // degraus (com pulso), ou:
 *     // linear: { t0: 0, t1: 4, de: 5, ate: 0 },
 *     termometro: { min: 36.9, max: 37.02 },              // tubo + bulbo; null = só o número
 *     nota: { t: 4.2, texto: "−0,02 °C" },                 // linha menor que aparece em t
 *   });
 *   c.update(t)   // chame no hf-seek (pode ser o mesmo render da cena 3D)
 *
 * Números com vírgula (pt-BR). Cores: { texto, destaque, quente } (padrão R01).
 * Fique dentro de y 168-1330 e longe dos 140 px da direita.
 */
const CSS = `
.kc { position: absolute; width: 420px; height: 360px; pointer-events: none; }
.kc-panel { position: absolute; inset: 0; border-radius: 20px; background: rgba(11,16,24,0.72); border: 2px solid rgba(238,242,246,0.18); }
.kc-tube { position: absolute; left: 44px; top: 30px; width: 40px; height: 240px; border-radius: 20px; border: 3px solid rgba(238,242,246,0.85); overflow: hidden; background: rgba(238,242,246,0.06); }
.kc-fill { position: absolute; left: 6px; right: 6px; bottom: 0; border-radius: 12px; }
.kc-bulb { position: absolute; left: 30px; top: 252px; width: 68px; height: 68px; border-radius: 50%; border: 3px solid rgba(238,242,246,0.85); }
.kc-ticks { position: absolute; left: 92px; top: 40px; width: 18px; height: 220px; background: repeating-linear-gradient(to bottom, rgba(238,242,246,0.6) 0 2px, transparent 2px 22px); }
.kc-read { position: absolute; left: 128px; top: 64px; font-family: "Anton", sans-serif; font-size: 112px; line-height: 1; white-space: nowrap; }
.kc.sem-tubo .kc-read { left: 36px; }
.kc-num { display: inline-block; transform-origin: 50% 60%; }
.kc-unit { font-size: 48px; margin-left: 6px; opacity: 0.9; }
.kc-nota { position: absolute; left: 132px; top: 210px; font-family: "Montserrat", sans-serif; font-weight: 600; font-size: 40px; white-space: nowrap; }
.kc.sem-tubo .kc-nota { left: 40px; }
`;

const fmt = (v, casas) => v.toFixed(casas).replace(".", ",").replace("-", "−");

export function createCounter(container, {
  x = 70, y = 668, unidade = "", casas = 2,
  passos = null, linear = null,
  termometro = { min: 0, max: 1 },
  nota = null,
  painel = true,
  cores = { texto: "#ffffff", destaque: "#8fcbf2", quente: ["#e8b24a", "#e8743a"] },
} = {}) {
  if (!document.getElementById("kc-css")) {
    const st = document.createElement("style");
    st.id = "kc-css";
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  const el = document.createElement("div");
  el.className = "kc" + (termometro ? "" : " sem-tubo");
  el.style.left = x + "px";
  el.style.top = y + "px";
  el.setAttribute("data-layout-ignore", "");
  el.innerHTML =
    (painel ? `<div class="kc-panel"></div>` : "") +
    (termometro ? `<div class="kc-tube"><div class="kc-fill"></div></div><div class="kc-bulb"></div><div class="kc-ticks"></div>` : "") +
    `<div class="kc-read" style="color:${cores.texto}"><span class="kc-num"></span><span class="kc-unit">${unidade}</span></div>` +
    (nota ? `<div class="kc-nota" style="color:${cores.destaque}">${nota.texto}</div>` : "");
  container.appendChild(el);
  const num = el.querySelector(".kc-num"), fill = el.querySelector(".kc-fill"), bulb = el.querySelector(".kc-bulb"), notaEl = el.querySelector(".kc-nota");
  if (fill) fill.style.background = `linear-gradient(${cores.quente[0]}, ${cores.quente[1]})`;
  if (bulb) bulb.style.background = `radial-gradient(circle at 40% 40%, #f0a050, ${cores.quente[1]} 70%)`;

  function valor(t) {
    if (linear) {
      const p = Math.min(1, Math.max(0, (t - linear.t0) / (linear.t1 - linear.t0)));
      return { v: linear.de + (linear.ate - linear.de) * p, pulso: 0 };
    }
    let v = passos[0][1], tk = -Infinity;
    for (const [ts, vs] of passos) if (t >= ts) { v = vs; tk = ts; }
    const a = t - tk; // pulso curto em cada degrau
    const pulso = a < 0.08 ? a / 0.08 : a < 0.33 ? 1 - (a - 0.08) / 0.25 : 0;
    return { v, pulso: tk === passos[0][0] ? 0 : pulso };
  }

  function update(t) {
    const { v, pulso } = valor(t);
    const txt = fmt(v, casas);
    if (num.textContent !== txt) num.textContent = txt;
    num.style.transform = `scale(${(1 + 0.12 * pulso).toFixed(3)})`;
    if (fill && termometro) {
      const p = Math.min(1, Math.max(0, (v - termometro.min) / (termometro.max - termometro.min)));
      fill.style.height = (20 + 70 * p).toFixed(1) + "%";
    }
    if (notaEl) notaEl.style.opacity = t >= nota.t ? Math.min(1, (t - nota.t) / 0.25) : 0;
  }
  update(0);
  return { el, update };
}
