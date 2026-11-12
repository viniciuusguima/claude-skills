# Canal: Bitácora de Vuelo

Tudo o que o público vê ou ouve é na língua do projeto, que o usuário escolhe a cada vídeo: narração, texto na tela, thumbnail, título, descrição, capítulos e tags. Os arquivos de trabalho (briefs, análises, notas) e a conversa com o usuário ficam em português, que é a língua dele. O nome do canal, "Bitácora de Vuelo", é marca e não se traduz.

## Línguas

Uma linha por língua. O código vai em `novo_projeto.py --idioma` e no campo `idioma` de `roteiro.json`; a voz é do edge-tts e vai em `--voz`. Tratamento é como a narração fala com o espectador.

| Língua | Código | Variante | Voz | Alternativas | Tratamento |
|---|---|---|---|---|---|
| Espanhol | `es` | latino neutro: "ustedes" em vez de "vosotros", sem gíria de um país só | `es-MX-JorgeNeural` (masculina) | `es-MX-DaliaNeural` (feminina), `es-US-AlonsoNeural`, `es-ES-AlvaroNeural` (só se o vídeo mirar a Espanha) | "tú" |
| Português | `pt` | brasileiro | `pt-BR-AntonioNeural` (masculina) | `pt-BR-FranciscaNeural` (feminina) | "você" |
| Inglês | `en` | americano, sem gíria regional | `en-US-ChristopherNeural` (masculina, tom de documentário) | `en-US-AndrewNeural`, `en-US-GuyNeural`, `en-US-AriaNeural` (feminina) | "you" |

Velocidade `+4%` em todas.

O latino neutro é o padrão do espanhol porque a maior parte do público de língua espanhola no YouTube está na América Latina, e uma voz mexicana soa natural para quase todos eles.

**Língua fora da tabela**: liste as vozes com `edge-tts --list-voices`, escolha uma masculina do país com mais público nessa língua e proponha ao usuário a linha inteira (código, variante, voz, tratamento). Com o ok dele, acrescente a linha aqui antes de criar o projeto.

## Tom

O nome do canal é um diário de bordo: quem narra esteve lá, anotou o que viu e conta em ordem. Frases curtas, tempo presente nos momentos de tensão, números e horas exatos quando existem. Sem sensacionalismo e sem prometer no título o que o vídeo não entrega.

## Identidade visual

| Item | Valor |
|---|---|
| Vídeo | o estilo do motor: branco sobre preto, bonecos sob holofote, painéis HUD |
| Cor de destaque | âmbar `#FFC400`, só na thumbnail (texto em destaque e cantoneiras). O vídeo continua em preto e branco |
| Thumbnail | ilustrada, gerada pelo usuário no Gemini (Nano Banana) com os prompts de `saida/thumb_prompts.md`. O estilo acompanha a thumb de referência; a marca abaixo é o que fica igual em todas |
| Marca nas thumbs | três cantoneiras na cor de destaque (superior esquerdo, inferior esquerdo, superior direito), como no modelo `template/thumb.html`. É o que faz as thumbs do canal se reconhecerem lado a lado |
| Fechamento do vídeo | cartão final com a frase-chave na língua do projeto e "BITÁCORA DE VUELO" (igual em todas as línguas) |

## Trello e Drive

Etiqueta **azul** no quadro "Produção de Vídeos" e pasta "Bitácora de Vuelo" no Drive. Endereços em `references/publicar.md`.

## A definir

Itens que só o usuário pode decidir. Pergunte no primeiro vídeo, grave a resposta na seção certa acima e apague a linha daqui. Enquanto estiverem aqui, valem os padrões das tabelas.

- **Tema do canal**: do que o Bitácora de Vuelo fala (aviação, viagens, sobrevivência, outro)? O tom e os exemplos do roteirista dependem disso.
- **Cor de destaque**: o âmbar é um palpite inicial. Confirmar ou trocar.
- **Sotaque do espanhol**: confirmar o latino neutro (voz mexicana) ou trocar para o espanhol da Espanha.
