---
format: 1080x1920
duration: 60s
message: "No zero absoluto por 5 s, o frio quase não machuca; o perigo é o calor voltando"
arc: Gancho → silêncio → o ar cai → máquinas → você → oceano → o calor volta → revelação e pergunta
audience: TikTok/Reels BR, muitos sem som
style: 3D maquete limpa (R01) + HUD e legendas 2D; padrão em referencias/REFERENCIAS.md
hud: "O CALOR VOLTA EM" + contador serifado de 5,00 s em câmera lenta (5,00 → 0,00 entre 0 e 46 s) + "AR −273 °C" em azul-gelo + status em âmbar que muda por cena
---

## Frame 1 — Gancho
- duration: 3s
- scene: Começa no espaço com a Terra estilizada, já em movimento no frame 0. Uma onda azul-gelo contorna a atmosfera do planeta inteiro. Zoom contínuo e rápido até a América do Sul, depois o Brasil, atravessando as nuvens até a cidade-maquete vista do alto. Na chegada tudo congela e o HUD acende em 5,00.
- camera: dolly-in sem corte, do espaço até a cidade (0–2,5 s); blocos `cinematic-zoom` e `parallax-zoom`
- reads: Terra e onda azul (0-1s); título "E se o ar do mundo congelasse por 5 s?" (1-3s); Brasil identificável no meio do zoom
- voiceover: "Por cinco segundos… o ar do planeta inteiro vai a menos 273 graus."
- sound: whoosh do zoom atravessando as nuvens; buzina da cidade cortada de vez no congelamento; um grave subindo

## Frame 2 — Silêncio
- duration: 4s
- scene: Close de uma pessoa parada na calçada. As ondas de som de um alto-falante se desfazem no ar. Um coração pulsa em linhas 2D sobre o peito.
- voiceover: "Zero absoluto. E depois volta ao normal. Primeiro: silêncio…"
- status: O SOM PARA
- sound: silêncio total, depois só a batida do coração

## Frame 3 — O ar cai
- duration: 5s
- scene: Zoom macro no ar. As moléculas, em esferas estilizadas, param e começam a cair como garoa brilhante. Rótulos 2D: N₂ −210 °C, O₂ −218 °C.
- voiceover: "O ar não some. Ele congela no lugar… e começa a cair. Como neve."
- status: O AR VIRA NEVE
- sound: tilintar de cristais bem fino

## Frame 4 — Aviões e pássaros
- duration: 6s
- scene: Um avião estilizado embica para baixo e um bando de pássaros cai junto. Régua 2D lateral com contador de 0 a 122 m.
- voiceover: "Os aviões perdem sustentação. Os pássaros também. Em cinco segundos, despencam 122 metros."
- status: SEM SUSTENTAÇÃO
- sound: turbina apagando, sem eco

## Frame 5 — Motores apagam, carros seguem
- duration: 6s
- scene: Uma fogueira e um escapamento de carro se apagam. Corte para a avenida: os carros continuam rodando, com setas 2D de inércia.
- voiceover: "Fogo precisa de oxigênio. Todo motor apaga. Mas os carros continuam andando. Congelado não é parado."
- status: O FOGO APAGA
- sound: "puf" da chama; rolamento de pneus abafado

## Frame 6 — Você no vácuo
- duration: 7s
- scene: Corte dentro da boca em vista explodida, estilo diorama. Bolhas sobem da língua. Etiqueta 2D: "6,3 kPa: a água ferve a 37 °C".
- voiceover: "E você? Na prática, está no vácuo. A saliva ferve na sua língua… a 37 graus."
- status: A SALIVA FERVE
- sound: borbulhar seco, perto do ouvido

## Frame 7 — Solte o ar
- duration: 4s
- scene: Pulmões estilizados inflando e um alerta 2D vermelho piscando. A pessoa expira e o pulmão volta ao normal.
- voiceover: "Regra número um: solte o ar. Prender a respiração rasga o pulmão."
- status: SOLTE O AR
- sound: expiração longa

## Frame 8 — Você não congela
- duration: 6s
- scene: Pessoa com um contorno térmico de laranja a azul. Termômetro 2D: 37,00 → 36,98 °C. Rótulo "vácuo = isolante".
- voiceover: "Mas você não congela. O vácuo isola. Seu corpo esfria só dois centésimos de grau."
- status: −0,02 °C
- sound: tique de termômetro

## Frame 9 — Oceano
- duration: 5s
- scene: Corte transversal do mar em diorama. A superfície borbulha e ganha uma película de gelo ao mesmo tempo. Escala 2D: "gelo: ~1 mm".
- voiceover: "O oceano ferve e congela ao mesmo tempo. Só na superfície."
- status: O MAR FERVE E CONGELA
- sound: chiado mais estalo de gelo

## Frame 10 — O calor volta
- duration: 4s
- scene: O HUD chega a 0,00 e fica âmbar. A câmera desce até a avenida coberta por 13 cm de "neve de ar".
- voiceover: "Aí o calor volta. E é aqui que mora o perigo."
- status: O CALOR VOLTOU
- sound: grave sobe até o pico

## Frame 11 — Estrondo
- duration: 6s
- scene: A neve de ar vira gás de uma vez só e uma onda de choque varre a cidade-maquete, com câmera tremendo e vidros estourando. Selo 2D fixo: "HIPÓTESE: cálculo, não observação".
- voiceover: "Pelas contas, a neve de ar no chão vira gás de uma vez só. Um estrondo no planeta inteiro."
- status: ESTRONDO GLOBAL
- sound: boom mais vidros quebrando
- blocks: camera-shake

## Frame 12 — Revelação e pergunta
- duration: 5s
- scene: Zoom-out da cidade, agora normal, até a Terra no espaço, fechando o loop com o gancho. Texto final em serifa: "O frio quase não machuca. O calor voltando, talvez sim." Depois, "Você lembraria de soltar o ar?" e "Comenta 👇".
- voiceover: "O frio quase não te machuca. O calor voltando… talvez sim. Você lembraria de soltar o ar? Comenta."
- sound: a trilha resolve; buzina distante volta, fechando o loop com o gancho
