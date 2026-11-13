# Etapa: animador de um bloco

Você anima as cenas de **um bloco** por vez de um vídeo horizontal (1920×1080) do canal descrito em `<canal>`, na ordem do vídeo. Cada bloco é um único arquivo: `cenas/<Bloco>.js`.

Valem o `<projeto>`, a `<skill>`, o `<motor>`, o `<canal>` (o perfil do canal), o `<Bloco>` da vez e a língua do projeto.

## Passos

1. Leia `<motor>/references/motor.md` inteiro (contrato de uma cena, regras, funções de desenho) e passe os olhos em `<motor>/template/cenas_exemplo.js` para ver um vídeo pronto. No perfil `<canal>`, leia "Identidade visual": as metáforas do tema e o fechamento.
2. Abra `cenas/<Bloco>.js` no projeto. O esqueleto já lista cada cena com a duração, o tempo de fala e o texto. Se existir `cenas/00_comum.js`, leia: são formas compartilhadas, chamadas como `COMUM.nome(...)` de dentro das cenas.
3. Leia em `roteiro.json` a última cena do bloco anterior e a primeira do seguinte, para a passagem fazer sentido.
4. Escreva uma função por cena dentro do `return { ... }`, com o `id` como nome.
5. Confira, de dentro do projeto:
   ```bash
   node <skill>/scripts/folha_bloco.mjs <Bloco>
   ```
   Abra `build/folha_<Bloco>.png` com Read. Para olhar de perto: `--cenas id1,id2 --fracs 0.2,0.5,0.9`.
6. Corrija e repita até a folha ficar limpa.

## O que cada cena precisa fazer

- **Mostrar** a frase com uma metáfora visual simples (as de "Metáforas visuais" no perfil do canal, ou outra do mesmo tipo: mapa, relógio, painel, silhueta), em vez de escrever a frase na tela.
- Bater com a fala: os momentos-chave usam frações de `k` (`k * 0.6` = 60% da fala).
- Um foco por cena, algo mudando a cada segundo.
- Texto na tela **na língua do projeto**, com a ortografia completa (acentos; em espanhol, `¿ ¡`), poucas palavras, texto principal de 60 px para cima (o vídeo também é visto no celular).
- Números e dinheiro: formate você mesmo, no padrão da língua do projeto. `brl` só serve para valores em reais num vídeo em português.
- Cena com `"continua": true` no roteiro começa do estado em que a anterior terminou.

## O que procurar na folha

Texto cortado ou sobreposto, elemento fora da tela ou a menos de 80 px da borda, cena vazia, cena apertada, o aviso "cena ... não existe", cenas vizinhas iguais demais.

## Limites

- Em cada bloco, mexa só em `cenas/<Bloco>.js`. Não edite `cenas.js`, `motor.js`, `roteiro.json`, `00_comum.js` nem o arquivo de outro bloco, e deixe `juntar_cenas.py` e `render.mjs` para o passo 5 do SKILL.md.
- Se precisar de uma forma comum a todos os blocos, crie `cenas/00_comum.js` (formato no topo de `juntar_cenas.py`) e ajuste os blocos já animados que a usariam.
- Se uma frase do roteiro não tem como virar imagem, anime o melhor que der e anote para o resumo final; não mude o texto.
- Sem `Math.random()` nem `Date.now()`: o render salta no tempo.

## Ao terminar, anote para o resumo final

Quantas cenas ficaram prontas, as metáforas usadas em uma linha, e o que ficou pendente (forma que deveria ser comum, frase difícil, dúvida na passagem entre blocos).
