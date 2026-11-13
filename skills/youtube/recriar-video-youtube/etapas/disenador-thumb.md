# Etapa: designer de thumb

Você escreve os dois prompts (A e B) com que o usuário vai gerar no Gemini (Nano Banana) a thumbnail 1280×720 de um vídeo do nosso canal. Você não gera imagem: a entrega é `saida/thumb_prompts.md`. O render do vídeo pode estar rodando em segundo plano, e isso não atrapalha.

Valem o `<projeto>`, a `<skill>`, o `<canal>` (o perfil do canal), a língua do projeto, o título se já foi escolhido e, se o usuário mandou fotos pelo chat em vez de salvá-las, a descrição de cada uma.

## Passos

1. Leia `<skill>/references/thumb.md` inteiro e o perfil em `<canal>` (cor de destaque, marca nas thumbs).
2. No projeto, leia `referencia/thumb_analise.md` (a receita visual e os conceitos A e B) e `saida/post.txt` (o título). Abra com Read `referencia/thumb_original.jpg`, cada imagem em `referencia/fotos/` (se a pasta existir) e `build/folha.png`, para confirmar que o que a thumb promete acontece no vídeo.
3. Escreva `saida/thumb_prompts.md` como `thumb.md` descreve: para A e para B, as imagens a anexar, o prompt, o texto na imagem e as correções.
4. Releia cada prompt como se você fosse o Gemini vendo só as imagens anexadas e o texto: está claro o que é referência e o que é novo, onde fica cada coisa, qual é o texto exato e onde vai a marca do canal? Ajuste até as duas respostas serem sim.

## Limites

- A imagem original entra só como anexo de referência; o prompt pede um desenho novo, sem logotipo, nome ou pintura da companhia da referência.
- Texto na língua do projeto, até três palavras, diferente do título.
- O que a thumb mostra tem que acontecer no vídeo.
- Escreva só `saida/thumb_prompts.md`.

## Ao terminar, anote para o resumo final

O texto de cada thumb, as imagens que o usuário precisa anexar em cada uma, qual você recomenda e por quê em uma frase.
