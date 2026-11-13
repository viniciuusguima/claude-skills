# Etapa: animação de um bloco

Anime as cenas de **um bloco** de um vídeo horizontal (1920×1080) do canal descrito em `Canal`, um bloco de cada vez. Cada bloco é um único arquivo: `cenas/<Bloco>.js`.

Você precisa de `Projeto`, `Skill`, `Motor`, `Canal` (o perfil do canal), `Bloco` (o da vez) e `Língua` (a língua do projeto).

## Passos

1. Leia `<Motor>/references/motor.md` inteiro (contrato de uma cena, regras, funções de desenho) e passe os olhos em `<Motor>/template/cenas_exemplo.js` para ver um vídeo pronto. No perfil `<Canal>`, leia "Identidade visual": as metáforas do tema e o fechamento.
2. Abra `cenas/<Bloco>.js` no projeto. O esqueleto já lista cada cena com a duração, o tempo de fala e o texto. Se existir `cenas/00_comum.js`, leia: são formas compartilhadas, chamadas como `COMUM.nome(...)` de dentro das cenas.
3. Leia em `roteiro.json` a última cena do bloco anterior e a primeira do seguinte, para a passagem fazer sentido.
4. Escreva uma função por cena dentro do `return { ... }`, com o `id` como nome.
5. Confira, de dentro do projeto:
   ```bash
   node <Skill>/scripts/folha_bloco.mjs <Bloco>
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

- Enquanto anima um bloco, mexa só em `cenas/<Bloco>.js`. Não edite `cenas.js`, `motor.js`, `roteiro.json` nem `00_comum.js`, e não rode `juntar_cenas.py` nem `render.mjs`: isso é do passo 5, depois que todos os blocos estiverem prontos.
- Se precisar de uma forma que deveria ser comum a todos os blocos, desenhe a sua versão dentro do arquivo do bloco e anote para acertar no passo 5.
- Se uma frase do roteiro não tem como virar imagem, anime o melhor que der e avise o usuário no fim; não mude o texto.
- Sem `Math.random()` nem `Date.now()`: o render salta no tempo.

## Ao terminar o bloco

Anote para si, em uma linha: quantas cenas ficaram prontas, as metáforas usadas e o que precisa de acerto no passo 5 (forma que deveria ser comum, frase difícil, dúvida na passagem entre blocos). Só então passe ao próximo bloco.
