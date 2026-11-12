# painel-uso

Mod para o Claude Code que abre automaticamente, em toda sessão, um painel ao lado do chat mostrando:

- **Tokens** da sessão: total, entrada, saída, cache lido e gravado, separados entre o chat principal e os agentes.
- **Contexto**: quanto da janela de contexto está ocupado, custo estimado e os limites de uso (5h / 7 dias) quando a conta informa.
- **Agentes** (subagentes) iniciados: tipo, descrição, se ainda estão rodando e quantos tokens gastaram.
- **Skills** carregadas na sessão e quantas vezes cada uma foi usada.

Também mostra um resumo na barra de status e um aviso rápido quando um agente começa.
Se o painel for fechado, digite `/uso` para abrir de novo.

## Instalar

No terminal, numa sessão do Claude Code:

```
/plugin install painel-uso --marketplace viniciuusguima/claude-skills
```

Responda `y` para adicionar o marketplace e escolha o escopo de usuário (Enter), para valer em todas as sessões.

Pelo shell:

```
claude plugin install painel-uso --marketplace viniciuusguima/claude-skills
```

No app desktop, onde `/plugin` não roda: clique no + ao lado da caixa de mensagem, depois Plugins, Add marketplace com `viniciuusguima/claude-skills`, e então Add plugin.
