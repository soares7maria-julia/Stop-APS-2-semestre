# Supabase do Stop, versão 3.1 (ajustada ao que já existe)

**Esta versão substitui os pacotes anteriores (v1, v2 e v3). Não rodar os antigos.**
Ela parte das tabelas que a Pessoa 2 já criou (`profiles`, `rooms`, `room_players`) e mantém os nomes delas
(`is_private`, `player_id`, `is_ready`, `score`). O que falta é acrescentado.

## O que muda em relação ao que já existe

| Item | Situação |
|---|---|
| `profiles`, nomes de colunas de `rooms` e `room_players` | Mantidos |
| `rooms.last_activity_at` | **Novo**: controla os 10 minutos de inatividade |
| `rooms.status` | Padronizado em `waiting` / `playing` / `finished` (padrão `waiting`) |
| `room_players.username` e `avatar` | **Novos**: o lobby mostra os jogadores sem ler `profiles` de outros |
| `room_players (room_id, player_id)` | Ganha índice único (um jogador só uma vez por sala) |
| FK `room_players.room_id` | Recriada com `on delete cascade` (excluir sala apaga os jogadores) |
| Valores padrão (`is_ready`, `score`, `joined_at`...) | Definidos, senão o insert do app falha |
| `player_stats` | **Nova**: recorde e estatísticas por jogador (ranking público) |
| `game_history` | **Nova**: histórico de partidas do perfil |

## Decisões

- **Convidado = login anônimo.** O trigger do `profiles` deve criar a linha **também para anônimos**
  (o app envia `username` e `avatar` nos metadados), porque `owner_id` e `player_id` apontam para `profiles`.
  Ver `05_trigger_profiles_ajuste.sql`. Anônimo **nunca** entra no ranking: `submit_score` recusa.
- **Ranking público e recorde:** `player_stats` tem leitura liberada para quem não está logado.
  A gravação só acontece por `submit_score()`, que usa `auth.uid()` e aplica `greatest()` no recorde.
- **Código da sala gerado no Supabase:** a função `create_room` gera o código (único), cria a sala e já coloca o dono como jogador, em uma chamada só. O React não gera código nem insere direto em `rooms`.
- **Sala privada sem senha:** acesso por `code`/link. Salas privadas nunca aparecem na lista pública.
- **10 minutos:** o cron apaga a cada minuto e as consultas também ignoram sala vencida.
- **Só o dono exclui** (policy `owner_id = auth.uid()`). O jogador só consegue alterar o próprio `is_ready`.

## Antes de rodar: três confirmações

1. Rodar `99_diagnostico.sql` e mandar o resultado para a Pessoa 1. Ele mostra colunas, chaves, policies e triggers atuais.
2. **Policies antigas:** o Postgres soma as policies permissivas. Se `rooms` ou `room_players` já tinham policies,
   as antigas e as novas valem juntas. Apagar (`drop policy`) as antigas que liberem mais do que o desejado.
3. **Trigger de `profiles`:** conferir que ele também cria o perfil para anônimos (arquivo 05).

## Passo a passo

### Painel
- **Authentication > Sign In / Providers > Allow anonymous sign-ins:** ligar.
- **Database > Extensions > pg_cron:** ligar.
- **Confirm email:** continua desligado.

### SQL Editor, nesta ordem
1. `99_diagnostico.sql` (só leitura, para conferir)
2. `01_tabelas.sql`
3. `02_funcoes.sql`
4. `03_rls.sql`
5. `04_realtime_e_limpeza.sql`
6. Conferir o trigger com o `05_trigger_profiles_ajuste.sql`

Depois de rodar, executar `notify pgrst, 'reload schema';` para a API enxergar as tabelas novas.
Se algum arquivo der erro, mandar a mensagem para a Pessoa 1.

## O que o React chama

| Função do app | Chamada |
|---|---|
| Registrar pontuação | `rpc('submit_score', { p_points, p_won, p_players, p_rounds })` |
| Ranking (público) | `from('player_stats').select()` ordenado por `best_score` |
| Estatísticas e histórico | `player_stats` e `game_history` do próprio usuário |
| Salas públicas | `rpc('list_public_rooms')` + Realtime em `rooms` |
| Criar sala | `rpc('create_room', { p_name, p_is_private, p_max_players, p_difficulty, p_total_rounds, p_categories, p_username, p_avatar })` (devolve a sala com o código) |
| Entrar por código/link | `rpc('join_room_by_code', { p_code, p_username, p_avatar })` |
| Marcar "pronto" | `update` de `is_ready` em `room_players` |
| Excluir sala | `delete` em `rooms` (só o dono consegue) |
| Manter sala viva | `rpc('touch_room', { p_room })` |

## Testes

1. Conta A faz uma partida de 100 pontos, depois uma de 40: `best_score` continua 100 e `games_played` = 2. Depois uma de 150: vira 150.
2. Sem login, `select` em `player_stats` funciona (ranking público).
3. Convidado anônimo chamando `submit_score` recebe erro.
4. Convidado anônimo cria sala (o código vem pronto do banco) e outra pessoa entra pelo código.
5. Conta B tenta excluir a sala da A: negado.
6. Sala privada não aparece em `list_public_rooms`, mas `join_room_by_code` com o código funciona.
7. Sala parada há mais de 10 min some da lista e é apagada pelo cron (os jogadores dela também).
8. Ninguém consegue `insert`/`update` direto em `player_stats` pelo cliente.