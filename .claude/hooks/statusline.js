#!/usr/bin/env node
// Status line: tokens da última mensagem. Roda no terminal, não gasta tokens do modelo.
const fs = require('fs');
let raw = '';
process.stdin.on('data', d => (raw += d));
process.stdin.on('end', () => {
  let j = {};
  try { j = JSON.parse(raw); } catch {}
  const k = n => (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n));
  let out = 0, ctx = 0;
  try {
    for (const line of fs.readFileSync(j.transcript_path, 'utf8').split('\n')) {
      if (!line) continue;
      let e;
      try { e = JSON.parse(line); } catch { continue; }
      const c = e.message && e.message.content;
      const userText = typeof c === 'string' || (Array.isArray(c) && c.some(p => p.type === 'text'));
      if (e.type === 'user' && userText) out = 0; // nova mensagem do usuário: zera
      const u = e.type === 'assistant' && e.message && e.message.usage;
      if (u) {
        out += u.output_tokens || 0;
        ctx = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
      }
    }
  } catch {}
  const cost = j.cost && j.cost.total_cost_usd;
  const parts = [`msg ${k(out)} saída`, `contexto ${k(ctx)}`];
  if (cost != null) parts.push(`sessão $${cost.toFixed(2)}`);
  console.log(parts.join(' · '));
});
