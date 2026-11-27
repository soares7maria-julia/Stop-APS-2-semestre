


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."bump_room_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE public.rooms
    SET last_activity_at = NOW()
    WHERE id = COALESCE(NEW.room_id, OLD.room_id);

    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."bump_room_activity"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "is_private" boolean DEFAULT false NOT NULL,
    "max_players" integer DEFAULT 8 NOT NULL,
    "difficulty" "text" DEFAULT 'normal'::"text" NOT NULL,
    "total_rounds" integer DEFAULT 3 NOT NULL,
    "categories" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "status" "text" DEFAULT 'waiting'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_activity_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "valid_difficulty" CHECK (("difficulty" = ANY (ARRAY['facil'::"text", 'medio'::"text", 'dificil'::"text"]))),
    CONSTRAINT "valid_max_players" CHECK ((("max_players" >= 2) AND ("max_players" <= 30))),
    CONSTRAINT "valid_status" CHECK (("status" = ANY (ARRAY['waiting'::"text", 'playing'::"text", 'finished'::"text"]))),
    CONSTRAINT "valid_total_rounds" CHECK ((("total_rounds" >= 1) AND ("total_rounds" <= 20)))
);


ALTER TABLE "public"."rooms" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_room"("p_name" "text", "p_is_private" boolean, "p_max_players" integer, "p_difficulty" "text", "p_total_rounds" integer, "p_categories" "text"[], "p_username" "text", "p_avatar" "text") RETURNS "public"."rooms"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_room public.rooms%ROWTYPE;
    v_username TEXT;
    v_avatar TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Não autenticado.';
    END IF;

    IF p_name IS NULL OR LENGTH(TRIM(p_name)) = 0
       OR LENGTH(TRIM(p_name)) > 40 THEN
        RAISE EXCEPTION 'Nome de sala inválido.';
    END IF;

    IF p_max_players IS NULL OR p_max_players < 2 OR p_max_players > 30 THEN
        RAISE EXCEPTION 'Número de jogadores inválido.';
    END IF;

    IF p_total_rounds IS NULL OR p_total_rounds < 1 OR p_total_rounds > 20 THEN
        RAISE EXCEPTION 'Número de rodadas inválido.';
    END IF;

    IF COALESCE(p_difficulty, 'medio') NOT IN ('facil', 'medio', 'dificil') THEN
        RAISE EXCEPTION 'Dificuldade inválida.';
    END IF;

    IF p_categories IS NULL OR COALESCE(ARRAY_LENGTH(p_categories, 1), 0) < 1 THEN
        RAISE EXCEPTION 'Escolha pelo menos uma categoria.';
    END IF;

    SELECT
        COALESCE(NULLIF(TRIM(p_username), ''), username, 'Jogador'),
        COALESCE(NULLIF(p_avatar, ''), avatar, '🙂')
    INTO v_username, v_avatar
    FROM public.profiles
    WHERE id = auth.uid();

    INSERT INTO public.rooms (
        name, code, owner_id, is_private, max_players,
        difficulty, total_rounds, categories
    )
    VALUES (
        TRIM(p_name),
        public.generate_room_code(),
        auth.uid(),
        COALESCE(p_is_private, FALSE),
        p_max_players,
        COALESCE(p_difficulty, 'medio'),
        p_total_rounds,
        p_categories
    )
    RETURNING * INTO v_room;

    INSERT INTO public.room_players (
        room_id, player_id, username, avatar
    )
    VALUES (
        v_room.id, auth.uid(), v_username, v_avatar
    );

    RETURN v_room;
END;
$$;


ALTER FUNCTION "public"."create_room"("p_name" "text", "p_is_private" boolean, "p_max_players" integer, "p_difficulty" "text", "p_total_rounds" integer, "p_categories" "text"[], "p_username" "text", "p_avatar" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_room_by_code"("p_code" "text") RETURNS SETOF "public"."rooms"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT *
    FROM public.rooms
    WHERE code = UPPER(TRIM(p_code))
      AND last_activity_at > NOW() - INTERVAL '10 minutes';
$$;


ALTER FUNCTION "public"."find_room_by_code"("p_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_room_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_alphabet TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    v_code TEXT;
    i INT;
BEGIN
    LOOP
        v_code := '';

        FOR i IN 1..6 LOOP
            v_code := v_code ||
                SUBSTR(
                    v_alphabet,
                    1 + FLOOR(RANDOM() * LENGTH(v_alphabet))::INT,
                    1
                );
        END LOOP;

        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM public.rooms WHERE code = v_code
        );
    END LOOP;

    RETURN v_code;
END;
$$;


ALTER FUNCTION "public"."generate_room_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_stats"() RETURNS TABLE("games_played" integer, "games_won" integer, "best_score" integer, "total_points" bigint)
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$
    SELECT
        COALESCE(s.games_played, 0),
        COALESCE(s.games_won, 0),
        COALESCE(s.best_score, 0),
        COALESCE(
            (
                SELECT SUM(h.points)
                FROM public.game_history h
                WHERE h.player_id = auth.uid()
            ),
            0
        )::BIGINT
    FROM (SELECT 1) x
    LEFT JOIN public.player_stats s
        ON s.player_id = auth.uid();
$$;


ALTER FUNCTION "public"."get_my_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ranking"("p_limit" integer DEFAULT 50) RETURNS TABLE("player_id" "uuid", "display_name" "text", "avatar" "text", "best_score" integer, "games_played" integer, "games_won" integer)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    SELECT
        s.player_id,
        p.username,
        p.avatar,
        s.best_score,
        s.games_played,
        s.games_won
    FROM public.player_stats s
    JOIN public.profiles p ON p.id = s.player_id
    ORDER BY s.best_score DESC, s.updated_at ASC
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
$$;


ALTER FUNCTION "public"."get_ranking"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar)
    VALUES (
        NEW.id,
        COALESCE(
            NULLIF(NEW.raw_user_meta_data ->> 'username', ''),
            CASE
                WHEN NEW.email IS NOT NULL
                THEN split_part(NEW.email, '@', 1)
                ELSE 'Convidado'
            END
        ),
        NEW.raw_user_meta_data ->> 'avatar'
    );

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_room_member"("p_room_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.room_players
        WHERE room_id = p_room_id
          AND player_id = auth.uid()
    );
$$;


ALTER FUNCTION "public"."is_room_member"("p_room_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."join_room_by_code"("p_code" "text", "p_username" "text", "p_avatar" "text") RETURNS "public"."rooms"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_room public.rooms%ROWTYPE;
    v_count INT;
    v_already BOOLEAN;
    v_username TEXT;
    v_avatar TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Não autenticado.';
    END IF;

    SELECT * INTO v_room
    FROM public.rooms
    WHERE code = UPPER(TRIM(p_code))
      AND last_activity_at > NOW() - INTERVAL '10 minutes'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sala não encontrada ou expirada.';
    END IF;

    v_already := EXISTS (
        SELECT 1
        FROM public.room_players
        WHERE room_id = v_room.id
          AND player_id = auth.uid()
    );

    IF NOT v_already THEN
        IF v_room.status <> 'waiting' THEN
            RAISE EXCEPTION 'A partida já começou.';
        END IF;

        SELECT COUNT(*) INTO v_count
        FROM public.room_players
        WHERE room_id = v_room.id;

        IF v_count >= v_room.max_players THEN
            RAISE EXCEPTION 'Sala cheia.';
        END IF;
    END IF;

    SELECT
        COALESCE(NULLIF(TRIM(p_username), ''), username, 'Jogador'),
        COALESCE(NULLIF(p_avatar, ''), avatar, '🙂')
    INTO v_username, v_avatar
    FROM public.profiles
    WHERE id = auth.uid();

    INSERT INTO public.room_players (
        room_id, player_id, username, avatar
    )
    VALUES (
        v_room.id, auth.uid(), v_username, v_avatar
    )
    ON CONFLICT (room_id, player_id) DO UPDATE
    SET
        username = EXCLUDED.username,
        avatar = EXCLUDED.avatar;

    RETURN v_room;
END;
$$;


ALTER FUNCTION "public"."join_room_by_code"("p_code" "text", "p_username" "text", "p_avatar" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_public_rooms"() RETURNS TABLE("id" "uuid", "code" "text", "name" "text", "owner_id" "uuid", "total_rounds" integer, "difficulty" "text", "categories" "text"[], "max_players" integer, "player_count" bigint, "created_at" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT
        r.id,
        r.code,
        r.name,
        r.owner_id,
        r.total_rounds,
        r.difficulty,
        r.categories,
        r.max_players,
        (
            SELECT COUNT(*)
            FROM public.room_players p
            WHERE p.room_id = r.id
        ),
        r.created_at
    FROM public.rooms r
    WHERE r.is_private = FALSE
      AND r.status = 'waiting'
      AND r.last_activity_at > NOW() - INTERVAL '10 minutes'
    ORDER BY r.created_at DESC;
$$;


ALTER FUNCTION "public"."list_public_rooms"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_stats" (
    "player_id" "uuid" NOT NULL,
    "best_score" integer DEFAULT 0 NOT NULL,
    "games_played" integer DEFAULT 0 NOT NULL,
    "games_won" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."player_stats" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_score"("p_points" integer, "p_won" boolean DEFAULT false, "p_players" integer DEFAULT 1, "p_rounds" integer DEFAULT 1) RETURNS "public"."player_stats"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_row public.player_stats;
BEGIN
    IF v_uid IS NULL
       OR COALESCE((auth.jwt() ->> 'is_anonymous')::BOOLEAN, FALSE) THEN
        RAISE EXCEPTION 'Faça login com uma conta para registrar a pontuação.';
    END IF;

    IF p_points IS NULL OR p_points < 0 OR p_points > 100000 THEN
        RAISE EXCEPTION 'Pontuação inválida.';
    END IF;

    IF p_players IS NULL OR p_players < 1 OR p_players > 30 THEN
        RAISE EXCEPTION 'Quantidade de jogadores inválida.';
    END IF;

    IF p_rounds IS NULL OR p_rounds < 1 OR p_rounds > 20 THEN
        RAISE EXCEPTION 'Quantidade de rodadas inválida.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = v_uid
    ) THEN
        RAISE EXCEPTION 'Perfil não encontrado.';
    END IF;

    INSERT INTO public.player_stats AS s
        (player_id, best_score, games_played, games_won)
    VALUES
        (v_uid, p_points, 1, CASE WHEN p_won THEN 1 ELSE 0 END)
    ON CONFLICT (player_id) DO UPDATE SET
        best_score = GREATEST(s.best_score, EXCLUDED.best_score),
        games_played = s.games_played + 1,
        games_won = s.games_won + EXCLUDED.games_won,
        updated_at = NOW()
    RETURNING * INTO v_row;

    INSERT INTO public.game_history
        (player_id, points, won, players, rounds)
    VALUES
        (v_uid, p_points, COALESCE(p_won, FALSE), p_players, p_rounds);

    RETURN v_row;
END;
$$;


ALTER FUNCTION "public"."submit_score"("p_points" integer, "p_won" boolean, "p_players" integer, "p_rounds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_room"("p_room" "uuid") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    UPDATE public.rooms
    SET last_activity_at = NOW()
    WHERE id = p_room
      AND (
          owner_id = auth.uid()
          OR public.is_room_member(p_room)
      );
$$;


ALTER FUNCTION "public"."touch_room"("p_room" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."game_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_id" "uuid" NOT NULL,
    "points" integer DEFAULT 0 NOT NULL,
    "won" boolean DEFAULT false NOT NULL,
    "players" integer DEFAULT 1 NOT NULL,
    "rounds" integer DEFAULT 1 NOT NULL,
    "played_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."game_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text" NOT NULL,
    "avatar" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."room_players" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "is_ready" boolean DEFAULT false NOT NULL,
    "score" integer DEFAULT 0 NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "username" "text" DEFAULT 'Jogador'::"text" NOT NULL,
    "avatar" "text" DEFAULT '🙂'::"text" NOT NULL
);


ALTER TABLE "public"."room_players" OWNER TO "postgres";


ALTER TABLE ONLY "public"."game_history"
    ADD CONSTRAINT "game_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_stats"
    ADD CONSTRAINT "player_stats_pkey" PRIMARY KEY ("player_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."room_players"
    ADD CONSTRAINT "room_players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."room_players"
    ADD CONSTRAINT "unique_player_per_room" UNIQUE ("room_id", "player_id");



CREATE INDEX "game_history_played_at_idx" ON "public"."game_history" USING "btree" ("played_at" DESC);



CREATE INDEX "game_history_player_id_idx" ON "public"."game_history" USING "btree" ("player_id");



CREATE INDEX "player_stats_best_score_idx" ON "public"."player_stats" USING "btree" ("best_score" DESC);



CREATE INDEX "room_players_player_idx" ON "public"."room_players" USING "btree" ("player_id");



CREATE INDEX "rooms_public_idx" ON "public"."rooms" USING "btree" ("is_private", "last_activity_at");



CREATE OR REPLACE TRIGGER "room_players_bump" AFTER INSERT OR DELETE ON "public"."room_players" FOR EACH ROW EXECUTE FUNCTION "public"."bump_room_activity"();



ALTER TABLE ONLY "public"."game_history"
    ADD CONSTRAINT "game_history_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_stats"
    ADD CONSTRAINT "player_stats_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_players"
    ADD CONSTRAINT "room_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_players"
    ADD CONSTRAINT "room_players_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "atualizar propria prontidao" ON "public"."room_players" FOR UPDATE TO "authenticated" USING (("player_id" = "auth"."uid"())) WITH CHECK (("player_id" = "auth"."uid"()));



CREATE POLICY "atualizar proprio perfil" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "cadastrar proprio perfil" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "dono atualiza sala" ON "public"."rooms" FOR UPDATE TO "authenticated" USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "dono exclui sala" ON "public"."rooms" FOR DELETE TO "authenticated" USING (("owner_id" = "auth"."uid"()));



ALTER TABLE "public"."game_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ranking publico" ON "public"."player_stats" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."room_players" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rooms" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sair ou dono remove jogador" ON "public"."room_players" FOR DELETE TO "authenticated" USING ((("player_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."rooms" "r"
  WHERE (("r"."id" = "room_players"."room_id") AND ("r"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "ver proprio historico" ON "public"."game_history" FOR SELECT TO "authenticated" USING (("player_id" = "auth"."uid"()));



CREATE POLICY "visualizar jogadores da sala" ON "public"."room_players" FOR SELECT TO "authenticated" USING ((("player_id" = "auth"."uid"()) OR "public"."is_room_member"("room_id")));



CREATE POLICY "visualizar proprio perfil" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "visualizar salas acessiveis" ON "public"."rooms" FOR SELECT TO "authenticated" USING ((((NOT "is_private") AND ("last_activity_at" > ("now"() - '00:10:00'::interval))) OR ("owner_id" = "auth"."uid"()) OR "public"."is_room_member"("id")));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."bump_room_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."bump_room_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."bump_room_activity"() TO "service_role";



GRANT ALL ON TABLE "public"."rooms" TO "anon";
GRANT ALL ON TABLE "public"."rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."rooms" TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_room"("p_name" "text", "p_is_private" boolean, "p_max_players" integer, "p_difficulty" "text", "p_total_rounds" integer, "p_categories" "text"[], "p_username" "text", "p_avatar" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_room"("p_name" "text", "p_is_private" boolean, "p_max_players" integer, "p_difficulty" "text", "p_total_rounds" integer, "p_categories" "text"[], "p_username" "text", "p_avatar" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_room"("p_name" "text", "p_is_private" boolean, "p_max_players" integer, "p_difficulty" "text", "p_total_rounds" integer, "p_categories" "text"[], "p_username" "text", "p_avatar" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."find_room_by_code"("p_code" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."find_room_by_code"("p_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_room_by_code"("p_code" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."generate_room_code"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."generate_room_code"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_my_stats"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_my_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_stats"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_ranking"("p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_ranking"("p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_ranking"("p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ranking"("p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_room_member"("p_room_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_room_member"("p_room_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_room_member"("p_room_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."join_room_by_code"("p_code" "text", "p_username" "text", "p_avatar" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."join_room_by_code"("p_code" "text", "p_username" "text", "p_avatar" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."join_room_by_code"("p_code" "text", "p_username" "text", "p_avatar" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."list_public_rooms"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_public_rooms"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_public_rooms"() TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."player_stats" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."player_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."player_stats" TO "service_role";



REVOKE ALL ON FUNCTION "public"."submit_score"("p_points" integer, "p_won" boolean, "p_players" integer, "p_rounds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."submit_score"("p_points" integer, "p_won" boolean, "p_players" integer, "p_rounds" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_score"("p_points" integer, "p_won" boolean, "p_players" integer, "p_rounds" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."touch_room"("p_room" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."touch_room"("p_room" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_room"("p_room" "uuid") TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."game_history" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."game_history" TO "authenticated";
GRANT ALL ON TABLE "public"."game_history" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."room_players" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."room_players" TO "authenticated";
GRANT ALL ON TABLE "public"."room_players" TO "service_role";



GRANT UPDATE("is_ready") ON TABLE "public"."room_players" TO "authenticated";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







