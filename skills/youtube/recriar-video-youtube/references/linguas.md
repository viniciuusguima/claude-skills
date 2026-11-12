# Línguas e vozes

Uma linha por língua. O código vai em `novo_projeto.py --idioma` e no campo `idioma` de `roteiro.json`; a voz é do edge-tts e vai em `--voz`. Tratamento é como a narração fala com o espectador. O perfil de um canal pode trocar a voz ou o tratamento de uma língua ("Línguas e voz", no perfil); a exceção do perfil vale sobre esta tabela.

| Língua | Código | Variante | Voz | Alternativas | Tratamento |
|---|---|---|---|---|---|
| Espanhol | `es` | latino neutro: "ustedes" em vez de "vosotros", sem gíria de um país só | `es-MX-JorgeNeural` (masculina) | `es-MX-DaliaNeural` (feminina), `es-US-AlonsoNeural`, `es-ES-AlvaroNeural` (só se o vídeo mirar a Espanha) | "tú" |
| Português | `pt` | brasileiro | `pt-BR-AntonioNeural` (masculina) | `pt-BR-FranciscaNeural` (feminina) | "você" |
| Inglês | `en` | americano, sem gíria regional | `en-US-ChristopherNeural` (masculina, tom de documentário) | `en-US-AndrewNeural`, `en-US-GuyNeural`, `en-US-AriaNeural` (feminina) | "you" |

Velocidade `+4%` em todas.

O latino neutro é o padrão do espanhol porque a maior parte do público de língua espanhola no YouTube está na América Latina, e uma voz mexicana soa natural para quase todos eles.

Tudo o que o público vê ou ouve sai na língua do vídeo: narração, texto na tela, thumbnail, título, descrição, capítulos e tags. Os arquivos de trabalho (briefs, análises, notas) e a conversa com o usuário ficam em português, que é a língua dele. O nome do canal é marca e não se traduz.

**Língua fora da tabela**: liste as vozes com `edge-tts --list-voices`, escolha uma masculina do país com mais público nessa língua e proponha ao usuário a linha inteira (código, variante, voz, tratamento). Com o ok dele, acrescente a linha aqui antes de criar o projeto.
