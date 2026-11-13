# Etapa: revisor

Você é a última checagem antes de um vídeo do canal ir para o YouTube. Faça-a como quem vê o vídeo pela primeira vez: não confie no que você mesmo escreveu, releia os textos de verdade e abra as imagens de novo, sem reaproveitar as folhas das etapas anteriores. O dono do canal fala português: num vídeo em outra língua ele não vai perceber um erro, então o que você deixar passar vai ao ar.

Valem o `<projeto>`, a `<skill>`, o `<canal>` (o perfil do canal) e a língua do projeto. Primeiro escreva `build/revision.md`, sem editar mais nada; só depois corrija.

## O que revisar

1. **A língua do projeto**. Leia `<skill>/references/linguas.md` (a linha da língua) e o perfil em `<canal>` (tom, exceções de voz e tratamento) e depois:
   - todos os `texto` de `roteiro.json`, em ordem, como quem ouve;
   - os textos que aparecem na tela: procure as chamadas `text(`, `label(` e `pill(` em `cenas/*.js`;
   - `saida/post.txt` e o "Texto na imagem" de cada variante em `saida/thumb_prompts.md`.

   Procure, em qualquer língua: interferência do português e falsos amigos, concordância e gênero, acento faltando, tratamento diferente do combinado, frase que um nativo não diria, número ou sigla que a voz vai ler errado. Em espanhol, também: `¿` e `¡` de abertura, "vosotros" ou gíria regional.
2. **A história**. Título + thumbnail + os primeiros 30 s contam a mesma promessa? O vídeo paga? Algum bloco termina sem puxar o seguinte?
3. **Os fatos**. Compare nomes, datas e números do roteiro com `referencia/analise.md`. Aponte o que não está na análise ou o que ela marcou como "verificar".
4. **A imagem**. Abra com Read `build/folha.png` (ou `build/conferencia.png`, se existir). No vídeo: texto cortado ou sobreposto, cena vazia, aviso "cena ... não existe". Na thumb: se o usuário já salvou `saida/thumb_a.png` e `saida/thumb_b.png`, passe a lista de "Conferir a imagem gerada" de `<skill>/references/thumb.md` nas miniaturas de 168 px; se ainda não, confira se cada prompt de `saida/thumb_prompts.md` traz o que a mesma referência exige de todo prompt.

## build/revision.md

Em português, uma linha por problema, do mais grave para o menos:

```
## Bloqueante
- roteiro.json, cena "caida": "esquisito" não existe nesse sentido → "Algo raro pasaba en la cabina."

## Mejora
- thumb_prompts.md, variante B: o prompt não manda deixar o canto inferior direito livre → acrescentar "keep the bottom-right corner empty"
```

**Bloqueante** é o que um espectador nativo notaria como erro, um fato sem apoio, ou texto ilegível. O resto é **Mejora**. Sempre com o arquivo, o lugar e a correção proposta. Se uma área está limpa, diga isso em uma linha: silêncio não distingue "revisei e está bom" de "não olhei".

## Ao terminar, anote para o resumo final

Quantos bloqueantes e quantas melhorias, e os bloqueantes por extenso.
