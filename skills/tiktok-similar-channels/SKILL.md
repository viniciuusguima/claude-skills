---
name: tiktok-similar-channels
description: Recebe um canal do TikTok (@handle ou link) e descobre quantos canais do mesmo estilo existem, em quais línguas, e quais são os mais parecidos (clones, concorrentes diretos, versões em outros idiomas). Use sempre que o usuário mandar um perfil do TikTok e pedir canais parecidos, concorrentes, "quantos canais existem assim", "tem desse estilo em outras línguas/idiomas", versões gringas ou brasileiras de um canal, lacunas de idioma para replicar um formato, ou benchmarking de nicho no TikTok, mesmo que não use a palavra "similar". Funciona sem chave de API (navegador interno + busca na web) e fica mais rápido com SCRAPECREATORS_API_KEY.
---

# Canais parecidos no TikTok

O usuário manda um canal. A resposta que ele quer é: **quantos canais fazem a mesma coisa, em quais línguas, quais são os mais parecidos e onde ainda não tem ninguém**. Normalmente ele está avaliando se dá para replicar o formato em outro idioma ou entender a concorrência. Por isso o relatório precisa separar "mesmo estilo de verdade" de "só fala do mesmo assunto": contar todo canal que menciona a mesma palavra-chave infla o número e não ajuda a decidir nada.

O TikTok não tem endpoint público de "contas parecidas". Toda contagem é um **mínimo encontrado** por amostragem de buscas, não o total do universo. Diga isso no relatório.

## Modo de coleta

- **Com `SCRAPECREATORS_API_KEY` no ambiente:** use a API (mais rápido, mais resultados por busca). Veja `references/scrapecreators.md`. Cada chamada custa 1 crédito; avise antes se o plano passar de ~100 chamadas.
- **Sem chave (padrão):** use o navegador interno do app. A busca de usuários e de vídeos do TikTok funciona sem login. Os extratores estão em `scripts/`:
  - `scripts/extract_profile.js` — com a aba em `tiktok.com/@handle`, retorna perfil, números e os vídeos visíveis (legenda, hashtags, views).
  - `scripts/extract_search.js` — com a aba em `tiktok.com/search/user?q=...` ou `/search/video?q=...`, retorna os resultados estruturados.

  Leia o arquivo e passe o conteúdo inteiro para a ferramenta de JavaScript do navegador, depois de navegar. Agrupe navegação + extração numa única chamada em lote para economizar idas e voltas.

  - **Embed do perfil** (`https://www.tiktok.com/embed/@handle`): não pede login e mostra bio, seguidores, curtidas, views e miniaturas dos vídeos recentes. Depois de 3–4 perfis abertos em sequência, o TikTok trava o perfil completo atrás de um popup de login e a grade de vídeos não carrega. A partir daí, verifique candidatos pelo embed (`get_page_text` para os números e um `zoom` na faixa de miniaturas para o visual, que sai barato). As legendas não aparecem no embed nem no oEmbed. Pegue-as nas buscas de vídeo, que mostram legenda e autor.

Cuidados no navegador: se aparecer o popup de login, clique em "Skip"/feche; se cair num fluxo de cadastro (data de nascimento etc.), aperte Escape ou recarregue. Nunca preencha dados, nunca faça login nem crie conta. Se o TikTok mostrar captcha, pare de buscar nessa rodada e complete com busca na web.

## Fluxo

### 1. Ler o canal-semente

Abra o perfil, rode `extract_profile.js` (com `window.__TT_SCROLLS = 2` para pegar ~30 vídeos) e tire um screenshot da grade de vídeos para ver o estilo visual. Se o popup cobrir a grade, feche-o antes ou use o embed.

Abra também o link da bio. Ele costuma revelar para que o canal existe: marketing de um app, venda de curso ou kit, newsletter. Isso muda a leitura do relatório, porque um canal de produto tem concorrentes diferentes de um canal de criador. O link também ajuda a achar redes de contas: dois perfis com a mesma bio ou o mesmo domínio provavelmente são do mesmo dono.

### 2. Montar a "impressão digital" do estilo

Escreva, para você mesmo, uma ficha curta. É ela que decide o que conta como "mesmo estilo":

| Campo | Exemplo |
|---|---|
| Nicho | IA para programar, vibe coding |
| Formato | esquete curto de humor, a IA como personagem |
| Visual | 3D animado estilo voxel, cenas noturnas, texto na tela |
| Modelo de título/gancho | "Claude, [pedido absurdo] + emoji" |
| Hashtags recorrentes | #claudecode #vibecoding #aitools |
| Idioma | inglês |
| Tamanho | 11,3 mil seguidores, 64 vídeos, conta criada em 2026-10 |
| Link/produto na bio | sim, promove um app |

### 3. Planejar as buscas

Três tipos de consulta, porque cada um pega canais que os outros perdem:

1. **Termos neutros de idioma**: nomes de ferramentas, marcas e hashtags que ninguém traduz (`claude code`, `vibecoding`). Trazem canais de todas as línguas de uma vez.
2. **Nicho traduzido**: o assunto e o modelo de título em cada língua-alvo (pt "Claude, faz meu app", es "Claude, hazme una app", fr "Claude, fais-moi une app", de "Claude, bau mir eine App").
3. **Variações do handle e do nome**: clones costumam usar o mesmo nome com sufixo de idioma (`_es`, `_br`, `.fr`, `jp`). Busque `<nome do canal>` e `<nome> <idioma>`.
4. **O formato em si**: descreva o formato sem citar o assunto ("animated AI skits", "série 3D animada", "sitcom 3D") e busque também "como fazer" esse formato. Se existirem tutoriais virais ensinando a fazer aquilo, é uma tendência e vão surgir clones, o que vale registrar no relatório. Os tutoriais em si entram como C.

Línguas-alvo padrão: inglês, português, espanhol, francês, alemão, italiano, japonês, coreano, indonésio, turco, hindi e árabe. Se o usuário disse outras, use as dele. Para cada língua, 1–2 consultas de usuário + 1 de vídeo costumam bastar; a busca de vídeo é a melhor para achar o formato, porque mostra legendas.

A busca do TikTok prioriza o país do IP. Colocar palavras do idioma na consulta reduz esse viés.

### 4. Executar e juntar candidatos

Para cada consulta, rode a busca de usuários e/ou de vídeos e anote cada handle novo numa tabela única (sem duplicar): handle, seguidores, onde apareceu (consultas) e uma legenda de exemplo. Descarte logo o que é obviamente fora (nome e legenda sem nada a ver, contas oficiais de empresa quando o seed é criador independente, contas com 0 vídeos).

Como complemento, faça 1–2 buscas na web com os termos do nicho. Ela indexa mal canais pequenos e recentes do TikTok, então serve mais para confirmar uma tendência ou achar o site de um canal do que para descobrir canais novos. Não gaste muitas consultas nela.

### 5. Verificar os candidatos

Abra cada candidato plausível. Use `extract_profile.js` enquanto o perfil completo carregar e passe para o embed quando aparecer o login. Para julgar o estilo, olhe as miniaturas: o visual quase sempre decide entre A e B. Priorize por: apareceu em mais de uma consulta > legenda com o mesmo modelo de título > mais seguidores. Verifique até ~30 perfis; se sobrar candidato sem verificar, liste como "não verificado".

Determine o idioma pelas **legendas e pelo texto dos vídeos**, não pelo campo `language` do perfil (é o idioma do app da pessoa).

Classifique cada canal verificado:

- **A — Mesmo estilo**: mesmo nicho + mesmo formato + visual ou gancho muito parecido. Concorrente direto ou clone.
- **B — Mesmo nicho, formato parecido**: entretenimento/esquete sobre o mesmo assunto, mas com visual ou gancho próprio.
- **C — Mesmo nicho, formato diferente**: tutorial, notícia, talking head, dicas.
- **Fora**: só compartilha uma palavra-chave.

Se o canal-semente parecer ser uma versão de outro canal (mesmo logo, mesmo link na bio, criado depois), diga isso: provavelmente é uma rede de contas do mesmo dono.

### 6. Relatório

Salve em `tiktok-research/<handle>-<AAAA-MM-DD>.md` no diretório atual e resuma no chat. Use este modelo:

```markdown
# Canais parecidos com @<handle> — <data>

## Resumo
- Canal-semente: <formato em 1 linha>, <idioma>, <seguidores>.
- Encontrados: <N> canais verificados (A: x · B: y · C: z) em <k> línguas.
- Mais parecido: @... (<idioma>, <seguidores>) — por quê.
- Línguas sem ninguém no mesmo estilo: <lista>  ← oportunidade, se o objetivo for replicar.

## Impressão digital do canal-semente
<tabela da etapa 2>

## Contagem por língua
| Língua | A — mesmo estilo | B — formato parecido | C — mesmo nicho | Total |

## Canais mais parecidos (A e B)
| Canal | Língua | Seguidores | Vídeos | Por que é parecido | Link |

## Mesmo nicho, outro formato (C)
<lista curta: handle, língua, seguidores>

## Como foi feito e limites
- Modo (navegador/API), consultas usadas por língua, quantos perfis verificados.
- Contagem é mínimo encontrado, não total. Busca do TikTok enviesada pelo país do IP. <o que não foi verificado>
```

Números grandes no formato do usuário (pt-BR: "11,3 mil"). Inclua o link de cada canal (`https://www.tiktok.com/@handle`).
