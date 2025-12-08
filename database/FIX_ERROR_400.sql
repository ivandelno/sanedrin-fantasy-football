-- ==========================================
-- SOLUCIÓN COMPLETA PARA EL ERROR DE CAMBIOS
-- ==========================================
-- Ejecuta TODO este script en el Editor SQL de Supabase para arreglar el error.

-- 1. Añadir la columna que falta (changes_used)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'season_participants' 
                   AND column_name = 'changes_used') THEN
        ALTER TABLE season_participants 
        ADD COLUMN changes_used INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Actualizar la función para LEER los cambios (para que la web los vea)
DROP FUNCTION IF EXISTS get_participant_standings(UUID);

CREATE OR REPLACE FUNCTION get_participant_standings(p_season_id UUID)
RETURNS TABLE (
  participant_id UUID,
  user_id UUID,
  username TEXT,
  total_points BIGINT,
  "position" INTEGER,
  matches_played BIGINT,
  changes_used INTEGER -- Nuevo campo retornado
) AS $$
BEGIN
  RETURN QUERY
  WITH points_summary AS (
    SELECT 
      pmp.participant_id,
      SUM(pmp.points) as total_points,
      COUNT(DISTINCT pmp.match_id) as matches_played
    FROM participant_match_points pmp
    WHERE pmp.season_id = p_season_id
    GROUP BY pmp.participant_id
  ),
  ranked AS (
    SELECT 
      sp.id as participant_id,
      sp.user_id,
      u.username,
      COALESCE(ps.total_points, 0) as total_points,
      COALESCE(ps.matches_played, 0) as matches_played,
      COALESCE(sp.changes_used, 0) as changes_used, -- Leemos de la tabla
      ROW_NUMBER() OVER (ORDER BY COALESCE(ps.total_points, 0) DESC) as "position"
    FROM season_participants sp
    JOIN users u ON u.id = sp.user_id
    LEFT JOIN points_summary ps ON ps.participant_id = sp.id
    WHERE sp.season_id = p_season_id
  )
  SELECT 
    r.participant_id,
    r.user_id,
    r.username,
    r.total_points,
    r."position"::INTEGER,
    r.matches_played,
    r.changes_used
  FROM ranked r
  ORDER BY r."position";
END;
$$ LANGUAGE plpgsql;

-- 3. Actualizar la función para REALIZAR cambios (reasegurando que existe)
CREATE OR REPLACE FUNCTION perform_team_change(
  p_season_id UUID,
  p_participant_id UUID,
  p_team_out_id UUID,
  p_team_in_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_max_changes INTEGER;
  v_changes_used INTEGER;
  v_role_out TEXT;
  v_role_in TEXT;
  v_league_out TEXT;
  v_league_in TEXT;
BEGIN
  -- Verificar cambios disponibles
  SELECT max_changes INTO v_max_changes FROM season_config WHERE season_id = p_season_id;
  SELECT changes_used INTO v_changes_used FROM season_participants WHERE id = p_participant_id;
  
  v_max_changes := COALESCE(v_max_changes, 3);
  v_changes_used := COALESCE(v_changes_used, 0);
  
  IF v_changes_used >= v_max_changes THEN
    RAISE EXCEPTION 'No te quedan cambios disponibles (Usados: %, Max: %)', v_changes_used, v_max_changes;
  END IF;

  -- Verificar roles y ligas
  SELECT role::text, league::text INTO v_role_out, v_league_out
  FROM participant_selections 
  WHERE participant_id = p_participant_id AND team_id = p_team_out_id AND season_id = p_season_id;

  SELECT role::text, league::text INTO v_role_in, v_league_in
  FROM participant_selections 
  WHERE participant_id = p_participant_id AND team_id = p_team_in_id AND season_id = p_season_id;

  IF v_role_out IS NULL THEN RAISE EXCEPTION 'Equipo titular no encontrado'; END IF;
  IF v_role_in IS NULL THEN RAISE EXCEPTION 'Equipo suplente no encontrado'; END IF;
  IF v_league_out != v_league_in THEN RAISE EXCEPTION 'Deben ser de la misma liga'; END IF;
  IF v_role_in NOT LIKE 'SUPLENTE%' THEN RAISE EXCEPTION 'El entrante debe ser suplente'; END IF;
  
  -- Realizar el intercambio DE ROLES (no IDs)
  UPDATE participant_selections
  SET role = v_role_in::role_enum
  WHERE participant_id = p_participant_id AND team_id = p_team_out_id AND season_id = p_season_id;
  
  UPDATE participant_selections
  SET role = v_role_out::role_enum
  WHERE participant_id = p_participant_id AND team_id = p_team_in_id AND season_id = p_season_id;

  -- Registrar historial
  INSERT INTO participant_changes (
    season_id, participant_id, change_type, from_team_id, to_team_id, 
    from_role, to_role, league, executed_at, matchday
  ) VALUES (
    p_season_id, p_participant_id, 'SUPLENTE', p_team_out_id, p_team_in_id,
    v_role_out::role_enum, v_role_in::role_enum, v_league_out::league_enum, NOW(),
    (SELECT COALESCE(MAX(matchday), 0) + 1 FROM matches WHERE season_id = p_season_id AND status = 'FINISHED' LIMIT 1)
  );

  -- IMPORTANTE: Incrementar contador
  UPDATE season_participants 
  SET changes_used = v_changes_used + 1
  WHERE id = p_participant_id;

END;
$$ LANGUAGE plpgsql;
