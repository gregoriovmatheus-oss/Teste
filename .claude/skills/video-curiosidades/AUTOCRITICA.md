# Autocrítica (21/11): erros que já cometi e como não repetir

Escrita depois de 11 vídeos e de uma noite revisando tudo. Leia antes de planejar um vídeo novo.

## Visual
1. **Pessoas de brinquedo, sem rosto:** a crítica mais repetida.
   - **Correção:** R11 com `lowpoly.pessoa` (olhos, sobrancelhas, nariz, boca, barba, mãos com dedos, jaqueta aberta) e emoção em cada close.
   - **Limite honesto:** 3D feito à mão não chega na ilustração gerada por IA da referência. Se o usuário quiser chegar mais perto, ofereça gerar imagens (HeyGen, pago) em vez de prometer.
2. **Texto cobrindo o assunto:**
   - o presente tapava o título (mentiras);
   - cabeças tapavam o título (pausar);
   - a vaca ficava sob o HUD (animais).
   - **Correção:** checar sobreposição no snapshot antes do render e seguir as zonas em y da SKILL.
3. **Câmera que atravessa objetos ou perde o assunto:** a lavoura e o cano no vídeo do Sol, e o satélite pequeno ou perto demais. Nos snapshots, olhe o início, o meio e o fim de cada cena.
4. **Corvo com cara de balão e navio de blocos:** animal ou objeto principal precisa de silhueta reconhecível. Faça um teste isolado antes de usar na cena.

## Dados e HUD
5. **Medidor que ficava até o fim e contradizia a cena** (mentiras, pensamentos, pausar). Corrigido no `doc.py`: o medidor some no fim do capítulo.
6. **Número inventado para preencher o HUD** ("SEMELHANÇA 99,6%"). Só entra número com fonte. Sem fonte, use rótulo de texto.

## Áudio
7. **Narração rápida demais** (velocidade 1.36, vídeo de 56 s). O padrão agora é 1.08.
8. **A tag do sfx sumia toda vez que `cenas.py` rodava.** Corrigido no `comum.py`.

## Processo
9. **Renders duplicados:** um `pgrep -f slug` achava o próprio shell. Use só `fila-render.sh`, que roda solto e um vídeo por vez.
10. **Snapshot durante render dá timeout:** a CPU fica cheia. Espere o render acabar.
11. **5 agentes de montagem ao mesmo tempo estouraram o limite de 5 h.** Use no máximo 2 e retome com SendMessage.
12. **Scripts importantes no scratchpad**, como `clona.sh` e a fila, se perdem com o container. Agora estão no kit; nada essencial fica fora do repositório.
13. **Kit desatualizado:** os vídeos clonavam o projeto anterior em vez de usar o kit. Agora `kit/template` é o fluxo real. Ao melhorar um script num vídeo, copie de volta para o kit.
14. **Excesso de texto no chat e prévias grandes:** o usuário pediu rapidez e economia. Mande uma folha de contato pequena e um resumo de 3 a 5 linhas.
15. **Prometer o que o 3D não entrega:** "100% melhor" ou "85% da referência" sem medir. Diga o que melhorou e o que continua abaixo.
