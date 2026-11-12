# Modo API: ScrapeCreators

Use só se `SCRAPECREATORS_API_KEY` estiver definida. Base: `https://api.scrapecreators.com`, todas as rotas são GET com o header `x-api-key`. A maioria custa 1 crédito por chamada; confira o saldo em `/v1/credit/balance` antes de rodadas grandes.

```bash
sc() { curl -s -G "https://api.scrapecreators.com$1" -H "x-api-key: $SCRAPECREATORS_API_KEY" "${@:2}"; }

sc /v1/tiktok/profile --data-urlencode "handle=agentmorphy"           # perfil + números
sc /v3/tiktok/profile/videos --data-urlencode "handle=agentmorphy"    # vídeos recentes (paginado por cursor)
sc /v1/tiktok/search/users --data-urlencode "query=claude code"       # busca de contas
sc /v1/tiktok/search/keyword --data-urlencode "query=claude vibe coding"  # busca de vídeos por palavra
sc /v1/tiktok/search/hashtag --data-urlencode "hashtag=vibecoding"    # vídeos de uma hashtag (sem #)
```

Paginação: as buscas e a lista de vídeos devolvem um `cursor`; repita a chamada com `--data-urlencode "cursor=<valor>"` para a próxima página.

Mapeamento para o fluxo do SKILL.md:
- Etapa 1 (canal-semente): `profile` + `profile/videos`.
- Etapa 4 (candidatos): `search/users`, `search/keyword`, `search/hashtag` por língua.
- Etapa 5 (verificação): `profile` + `profile/videos` de cada candidato.

Salve as respostas brutas em `tiktok-research/raw/` para não pagar duas vezes pela mesma chamada se precisar refazer a análise.
