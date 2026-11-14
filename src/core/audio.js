// Procedural score & sound design with the Web Audio API (no audio files).
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.lastImpact = 0;
  }

  start() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.enabled = true;
    this.master = ctx.createGain();
    this.master.gain.value = 0.0;
    this.master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 2);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(comp).connect(ctx.destination);

    // reverb
    this.verb = ctx.createConvolver();
    this.verb.buffer = this._impulse(4.5, 2.2);
    this.verbIn = ctx.createGain(); this.verbIn.gain.value = 0.5;
    this.verbIn.connect(this.verb).connect(this.master);

    this.noiseBuf = this._noise(4);

    // drone pad (space)
    this.drone = ctx.createGain(); this.drone.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.Q.value = 0.6;
    this.droneLP = lp;
    for (const [f, type, g] of [[55, 'sawtooth', 0.12], [55.4, 'sawtooth', 0.12], [82.4, 'sine', 0.25], [110, 'triangle', 0.08], [164.8, 'sine', 0.05]]) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
      const gg = ctx.createGain(); gg.gain.value = g;
      o.connect(gg).connect(lp); o.start();
    }
    lp.connect(this.drone);
    this.drone.connect(this.master); this.drone.connect(this.verbIn);

    // airy wind
    this.wind = this._noiseSource(); this.windF = ctx.createBiquadFilter();
    this.windF.type = 'bandpass'; this.windF.frequency.value = 500; this.windF.Q.value = 0.7;
    this.windG = ctx.createGain(); this.windG.gain.value = 0;
    this.wind.connect(this.windF).connect(this.windG).connect(this.master);

    // ethereal zero-g pad (high, shimmering)
    this.pad = ctx.createGain(); this.pad.gain.value = 0;
    for (const f of [523.25, 659.25, 783.99, 987.77, 1318.5]) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.1 + Math.random() * 0.3;
      const lg = ctx.createGain(); lg.gain.value = f * 0.004;
      lfo.connect(lg).connect(o.frequency); lfo.start();
      const g = ctx.createGain(); g.gain.value = 0.03;
      o.connect(g).connect(this.pad); o.start();
    }
    this.pad.connect(this.verbIn); this.pad.connect(this.master);

    // city ambience (filtered noise rumble)
    this.city = this._noiseSource(); this.cityF = ctx.createBiquadFilter();
    this.cityF.type = 'lowpass'; this.cityF.frequency.value = 350;
    this.cityG = ctx.createGain(); this.cityG.gain.value = 0;
    this.city.connect(this.cityF).connect(this.cityG).connect(this.master);

    // heartbeat-like low pulse used in the zero-g section
    this.sub = ctx.createOscillator(); this.sub.type = 'sine'; this.sub.frequency.value = 38;
    this.subG = ctx.createGain(); this.subG.gain.value = 0;
    this.sub.connect(this.subG).connect(this.master); this.sub.start();
  }

  _impulse(sec, decay) {
    const ctx = this.ctx, len = ctx.sampleRate * sec;
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }
  _noise(sec) {
    const ctx = this.ctx, len = ctx.sampleRate * sec;
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = w * 0.5 + last * 3; }
    return b;
  }
  _noiseSource() {
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true; s.start(); return s;
  }

  set(param, value, time = 0.25) {
    if (!this.ctx) return;
    const p = param; const t = this.ctx.currentTime;
    p.cancelScheduledValues(t);
    p.setTargetAtTime(value, t, time);
  }

  /** continuous mix from the director (called every frame, cheap) */
  mix(m) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const s = (p, v, k = 0.3) => { p.setTargetAtTime(v, t, k); };
    s(this.drone.gain, m.drone);
    s(this.droneLP.frequency, m.droneCutoff ?? 600);
    s(this.windG.gain, m.wind);
    s(this.windF.frequency, m.windFreq ?? 500);
    s(this.pad.gain, m.pad, 0.8);
    s(this.cityG.gain, m.city);
    s(this.subG.gain, m.sub ?? 0);
  }

  whoosh(dur = 2.0, up = true, gain = 0.6) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const n = this._noiseSource();
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(up ? 200 : 3000, t);
    f.frequency.exponentialRampToValueAtTime(up ? 4000 : 120, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + dur * 0.85); g.gain.linearRampToValueAtTime(0, t + dur);
    n.connect(f).connect(g).connect(this.master); g.connect(this.verbIn);
    setTimeout(() => n.stop(), (dur + 0.5) * 1000);
  }

  boom(gain = 1, freq = 50, dur = 3.0) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(freq * 2.2, t); o.frequency.exponentialRampToValueAtTime(freq * 0.5, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.master); g.connect(this.verbIn);
    o.start(t); o.stop(t + dur + 0.1);
    const n = this._noiseSource();
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(2500, t); f.frequency.exponentialRampToValueAtTime(80, t + dur * 0.6);
    const g2 = ctx.createGain(); g2.gain.setValueAtTime(gain * 0.8, t); g2.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.8);
    n.connect(f).connect(g2).connect(this.master); g2.connect(this.verbIn);
    setTimeout(() => n.stop(), (dur + 0.5) * 1000);
  }

  ping(freq = 1760, gain = 0.15, dur = 4) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(g); g.connect(this.verbIn); g.connect(this.master);
    o.start(t); o.stop(t + dur);
  }

  impact(k, dist) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastImpact < 0.045) return;
    this.lastImpact = now;
    const att = Math.min(1, 30 / (dist + 10));
    const gain = Math.min(0.9, 0.25 + k * 0.35) * att;
    const ctx = this.ctx, t = now;
    const n = this._noiseSource();
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400 + 2600 * att * Math.random();
    const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6 + k * 0.4);
    n.connect(f).connect(g).connect(this.master); g.connect(this.verbIn);
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(90 + Math.random() * 40, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.5);
    const og = ctx.createGain(); og.gain.setValueAtTime(gain * 0.9, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    o.connect(og).connect(this.master); o.start(t); o.stop(t + 0.8);
    setTimeout(() => n.stop(), 1600);
  }

  suspend() { this.ctx?.suspend(); }
  resume() { this.ctx?.resume(); }
}
