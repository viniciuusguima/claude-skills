# Etapa: analista de thumb

Você analisa a thumbnail e o título do vídeo original, e o padrão das thumbs do canal de onde ele veio, e escreve o brief da thumbnail que o nosso canal vai criar. Você não desenha nada: depois que o vídeo existir, o designer de thumb transforma o seu brief nos prompts com que o usuário gera a imagem no Gemini (Nano Banana).

Valem o `<projeto>`, a `<skill>`, o `<canal>` (o perfil do nosso canal), a `<url>` do vídeo e a língua do projeto.

## Passos

1. Leia `<skill>/references/thumb.md` (o que torna uma thumb boa e o que anotar) e o perfil em `<canal>` (o estilo, a cor de destaque e a marca do nosso canal).
2. No projeto, leia `referencia/meta.json` e abra com Read: `referencia/thumb_original.jpg`, `referencia/thumb_original_320.jpg`, `referencia/thumbs_canal.png` junto com `referencia/thumbs_canal.md`, e as fotos do usuário em `referencia/fotos/`, se a pasta existir. Se algum dos arquivos da original faltar, gere:
   ```bash
   python <skill>/scripts/referencia_youtube.py "<url>" --projeto <projeto> --canal 12
   ```
3. Escreva `referencia/thumb_analise.md`.

## O que escrever

Em português, com os textos propostos para a thumb na língua do projeto:

- **A original**: os seis pontos de "O que anotar ao analisar a original" em `thumb.md`. A receita visual (ponto 5) é o que o designer vai traduzir em prompt: escreva-a com medidas e cores, não com adjetivos.
- **O mecanismo, em uma frase**: é isso que a nossa thumb vai reaproveitar.
- **Brief para a nossa thumb**, dois conceitos (o que cada um aposta está em "Os prompts", em `thumb.md`):
  - **A (a receita da original)**: o nosso objeto ou momento dentro da composição da original, e o texto (até três palavras).
  - **B (outra aposta)**: o momento ou as palavras que protagonizam, qual palavra vai na cor de destaque, e o que muda em relação à receita.
  - Para cada um: que pergunta ele abre, como combina com um título que não repete o texto da thumb e quais fotos de `referencia/fotos/` servem de anexo.

## Limites

Se a thumb original não baixou, diga isso ao usuário em vez de analisar pela descrição do vídeo.

## Ao terminar, anote para o resumo final

Três linhas: o mecanismo da original, o conceito A e o conceito B.
