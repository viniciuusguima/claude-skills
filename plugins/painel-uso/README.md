# painel-uso

Mod para o Claude Code que abre automaticamente, em toda sessão, um painel ao lado do chat mostrando:

- **Tokens** da sessão: total, entrada, saída, cache lido e gravado, separados entre o chat principal e os agentes.
- **Contexto**: quanto da janela de contexto está ocupado, custo estimado e os limites de uso (5h / 7 dias) quando a conta informa.
- **Agentes** (subagentes) iniciados: tipo, descrição, se ainda estão rodando e quantos tokens gastaram.
- **Skills** carregadas na sessão e quantas vezes cada uma foi usada.

No app desktop, no VS Code e no celular o painel vira um **sistema solar 3D animado**: o contexto é um planeta de vidro que vai se enchendo de líquido, os agentes são luas em órbita (brilhando enquanto rodam), as skills são estrelas douradas no cinturão externo e os limites de 5h/7 dias são anéis em volta do planeta. Tem um botão para pausar a animação. A animação roda localmente e não gasta tokens.

Também mostra um resumo na barra de status e um aviso rápido quando um agente começa.
Se o painel for fechado, digite `/uso` para abrir de novo.

## Instalar

```
/plugin install painel-uso --marketplace <dono>/<repositorio>
```
