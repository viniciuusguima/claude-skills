# Escrever o roteiro (roteiro.json)

## Formato

```json
{
  "voz": "pt-BR-AntonioNeural",
  "velocidade": "+6%",
  "formato": "vertical",
  "referencia": "https://www.tiktok.com/@autor/video/123 (tema: ...)",
  "cenas": [
    { "id": "gancho",   "texto": "O aluno que mais erra é o que vai acabar ganhando mais dinheiro." },
    { "id": "crenca",   "texto": "A maioria das pessoas acredita que errar é ficar para trás." },
    { "id": "final",    "texto": "No mundo real, é o preço de descobrir o que está certo.", "continua": true }
  ]
}
```

- `id`: curto, sem espaço nem acento (vira o nome da função em `cenas.js`). Não repita.
- `texto`: o que a voz fala. Uma frase ou uma ideia por cena; cenas de 2 a 6 s funcionam melhor.
  Frase longa demais deixa a cena parada; divida em duas.
- `continua: true`: a cena entra sem fade nem corte (use quando o visual é o mesmo objeto se
  transformando, ex.: etiqueta que vira).

## Estrutura que funciona para vídeos de ~60 s

Os vídeos desse nicho seguem quase sempre o mesmo arco; reaproveite o arco, não as frases:

1. **Gancho** (1 frase, 3 s): afirmação contraintuitiva ou promessa. É o que segura o scroll.
2. **Crença comum** (1–2 frases): o que a maioria pensa.
3. **Virada** (2–3 frases): por que isso não vale no mundo real.
4. **Exemplo concreto** (3–4 frases): uma pessoa, um negócio, números pequenos e específicos.
5. **Princípio** (2–3 frases): a regra por trás do exemplo, com uma frase de efeito curta.
6. **Contraste** (2 frases): quem faz × quem não faz.
7. **Fechamento** (1–2 frases): espelha o gancho e termina numa frase citável.

Mire na mesma duração do original (±10%). Em PT-BR o texto fica uns 15% mais longo que em inglês;
corte palavras em vez de acelerar demais a voz (passar de `+12%` soa robótico).

## Português natural para voz

- Escreva como se fala: "pra", "a gente" e frases curtas soam mais naturais na voz neural do que um texto formal.
- Evite siglas e símbolos (R$, %, nº): escreva por extenso ("reais", "por cento").
- Vírgula vira pausa curta; ponto vira pausa maior. Use para dar ritmo.
- Números: "dez lições" lê melhor que "10 lições".

## Título e hashtags do post (saida/post.txt)

Escreva depois do roteiro pronto, porque o título sai da frase mais forte do vídeo.

**Título** (é o texto que acompanha o vídeo no post):
- Até ~80 caracteres, em PT-BR natural, sem aspas.
- Use a frase-chave ou o gancho do vídeo. Uma frase citável funciona melhor que uma descrição
  ("O fracasso só sai caro quando você para." > "Vídeo sobre fracasso e sucesso").
- Se o original tiver uma frase de efeito na descrição, faça a versão em português dela, sem
  tradução literal, mantendo o mesmo efeito.
- No máximo 1 emoji, e só se combinar com o tom.

**Hashtags**: 5 a 8, todas em português, minúsculas, sem acento (#mentalidade, não #Mentalidade
nem #mentalidadé), porque é assim que o público BR busca.
- Parta das hashtags do original e use o equivalente que o público brasileiro realmente usa, não a
  tradução literal: `#mindset` → `#mentalidade`, `#business` → `#empreendedorismo`,
  `#money` → `#dinheiro` / `#financas`, `#motivation` → `#motivacao`, `#rich` → `#riqueza`
  (ou `#sucesso`), `#success` → `#sucesso`, `#discipline` → `#disciplina`.
- Misture 2–3 amplas (#motivacao, #sucesso) com 3–4 do tema específico do vídeo (#fracasso,
  #aprendizado, #negociosonline).
- Não inclua #fyp/#foryou/#viral: em geral não ajudam e poluem.

Formato do arquivo:
```
TÍTULO
O fracasso só sai caro quando você para.

HASHTAGS
#mentalidade #empreendedorismo #dinheiro #motivacao #sucesso #fracasso #aprendizado

PRONTO PARA COLAR
O fracasso só sai caro quando você para. #mentalidade #empreendedorismo #dinheiro #motivacao #sucesso #fracasso #aprendizado
```
Se o roteiro for adaptação fiel, acrescente o crédito no "pronto para colar" (ex.: `Inspirado em @autor`).

## Roteiro próprio × adaptação

- **Próprio (padrão)**: mantenha o tema e a mensagem central, mas troque o exemplo (outro negócio,
  outra situação), as frases de efeito e a ordem dos argumentos quando fizer sentido.
- **Adaptação fiel** (só se o usuário pedir): traduza o sentido, não palavra por palavra, e lembre o
  usuário de creditar o autor original na legenda do post.
