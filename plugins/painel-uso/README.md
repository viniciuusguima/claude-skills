# painel-uso

Mod para o Claude Code que abre automaticamente, em toda sessão, um painel ao lado do chat mostrando:

- **Tokens** da sessão: total, entrada, saída, cache lido e gravado, separados entre o chat principal e os agentes.
- **Contexto**: quanto da janela de contexto está ocupado, custo estimado e os limites de uso (5h / 7 dias) quando a conta informa.
- **Agentes** (subagentes) iniciados: tipo, descrição, se ainda estão rodando e quantos tokens gastaram.
- **Skills** carregadas na sessão e quantas vezes cada uma foi usada.

No app desktop, no VS Code e no celular o painel vira uma **cena vertical com um Claudezinho laranja** (pixel art) num fundo cinza, feita para caber bonita num painel estreito ao lado do chat:

- **Skills viram acessórios**: cada skill usada na sessão dá um acessório novo pra ele, na ordem em que foram usadas: óculos escuros 🕶️, anel de ouro 💍, cartola 🎩, gravata borboleta 🎀, relógio ⌚, tênis vermelho 👟, balão 🎈, capa de herói 🦸, auréola 😇 e corrente de ouro 📿. A lista embaixo dele mostra qual skill deu qual acessório.
- **Agentes viram Claudezinhos**: cada agente (subagente) iniciado aparece como um Claudezinho menor atrás dele, pulando enquanto roda e mais apagado com ✓ quando termina.
- O balão de fala mostra quanto do contexto está ocupado, e em cima ficam os tokens e as barras dos limites de 5h e 7 dias.

**Quando um limite acaba** (5 horas ou 7 dias chegando a 100%), o Claude e tudo nele **fica cinza**, com olhos de X, uma nuvenzinha de chuva em cima e o aviso "CLAUDE ESGOTADO", dizendo quanto falta para o limite voltar. Quando o limite renova, ele volta a ficar laranja. Para ver esse visual sem esperar o limite, digite `/uso quebrado` (e de novo para desligar).

Tem um botão para pausar a animação. A animação roda localmente e não gasta tokens.

Também mostra um resumo na barra de status e um aviso rápido quando um agente começa.
Se o painel for fechado, digite `/uso` para abrir de novo.

## Instalar

```
/plugin install painel-uso --marketplace <dono>/<repositorio>
```
