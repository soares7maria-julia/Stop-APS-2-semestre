# Stop! — guia do projeto

Jogo de Stop multiplayer feito com React, Vite e Supabase. O app permite jogar como convidado ou com uma conta, criar e entrar em salas, jogar rodadas em tempo real, contestar respostas por votação e consultar o ranking.

## Requisitos

- Node.js instalado
- Acesso ao projeto Supabase usado pelo app

## Preparar e executar

Na pasta `STOP - PROTÓTIPO FINAL`:

```bash
npm install
cp .env.example .env.local
```

Edite `.env.local` e preencha as duas variáveis com os dados do projeto Supabase. Depois inicie o app:

```bash
npm run dev
```

Para gerar a versão de produção localmente, use `npm run build`. Para pré-visualizar essa versão, use `npm run preview`.

## Variáveis de ambiente

O cliente Supabase em `src/services/supabase.js` usa:

| Variável | Para que serve |
|---|---|
| `VITE_SUPABASE_URL` | Endereço do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública usada pelo navegador |

O arquivo `.env.example` contém apenas valores de exemplo. Coloque os valores reais somente em `.env.local` ou nas variáveis de ambiente da hospedagem. Não use nem publique uma chave `service_role` no app.

## Como o app usa o Supabase

- **Autenticação:** cadastro e login por e-mail e senha, sessão persistente e login anônimo para convidado.
- **Salas:** criação e busca de salas, entrada por código, lista pública, jogadores e atualização de presença. Na sala privada, o código/link de convite funciona como credencial de acesso.
- **Partida em tempo real:** canais Realtime da sala enviam eventos de início, letra, respostas, STOP e resultados; o lobby também usa Realtime para jogadores e chat.
- **Contestação:** na revisão da rodada, cada jogador pode contestar respostas dos demais. A maioria dos outros jogadores exclui a resposta e zera seus pontos; o autor recebe um aviso. Todos concluem a revisão antes que o dono possa publicar o resultado.
- **Pontuação e ranking:** o app chama as funções `submit_score`, `get_ranking` e `get_my_stats` e consulta o histórico do jogador em `game_history`.
- **Perfil:** o app atualiza nome e avatar em `profiles`.

Esses nomes correspondem às chamadas existentes em `src/services/authService.js`, `src/services/roomService.js` e `src/services/gameService.js`. O banco do Supabase associado ao endereço publicado já foi preparado para essas chamadas. Este repositório não contém scripts SQL de criação do banco; para configurar outro projeto Supabase, obtenha os scripts reais do projeto com a responsável pelo banco, em vez de executar SQL reconstruído a partir deste guia.

## Estrutura do código

- `src/pages`: páginas ligadas às rotas, que coordenam navegação e serviços.
- `src/screens`: conteúdo visual das telas do jogo.
- `src/components`: componentes reutilizados, como botões, campos e cartões.
- `src/context/AuthContext.jsx`: sessão, perfil e pontuação pendente compartilhados entre páginas.
- `src/services`: comunicação com Supabase Auth, salas, pontuação e ranking.
- `src/lib`: validação, cálculo de pontos, áudio e tradução de erros.
- `src/App.jsx`: rotas da aplicação.
- `src/main.jsx`: montagem do React no documento HTML.

Os arquivos `src/screens/AuthScreen.jsx` e `src/screens/ProfileScreen.jsx` são telas antigas mantidas como referência; as rotas atuais usam `src/pages/LoginPage.jsx`, `src/pages/RegisterPage.jsx` e `src/pages/ProfilePage.jsx`.

## Aplicação publicada

[https://stop-aps-2-semestre.vercel.app/](https://stop-aps-2-semestre.vercel.app/)

## Tecnologias utilizadas

As versões abaixo correspondem às dependências instaladas e verificadas no projeto.

| Tecnologia | Versão |
|---|---:|
| Node.js | 24.18.0 |
| npm | 11.16.0 |
| React | 19.3.1 |
| React DOM | 19.3.1 |
| Vite | 7.3.8 |
| @vitejs/plugin-react | 5.2.0 |
| Tailwind CSS | 4.3.5 |
| @tailwindcss/vite | 4.3.5 |
| React Router DOM | 7.18.5 |
| Zod | 4.6.7 |
| Supabase JS | 2.119.0 |

### Banco de dados e serviços

O projeto utiliza o Supabase como serviço de backend, com:

- **Supabase Auth:** autenticação de usuários cadastrados e visitantes.
- **PostgreSQL:** armazenamento dos dados.
- **Supabase Realtime:** atualização de informações das salas e dos jogadores em tempo real.
- **Row Level Security (RLS):** controle de acesso aos dados.
- **Funções SQL:** operações de criação e entrada em salas, ranking e registro de pontuações.
