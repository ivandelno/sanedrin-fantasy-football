-- ============================================
-- SOLUCIÓN DEFINITIVA (V2) - ERROR "TYPE DOES NOT EXIST"
-- ============================================

-- El error anterior ocurría porque intentábamos convertir texto a un tipo 'ENUM' 
-- que no existe en tu base de datos (tus tablas usan TEXTO normal).
-- Este script corrige eso eliminando esas conversiones (::role_enum, ::league_enum).

-- 1. Asegurar columna changes_used (por si acaso)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'season_participants' 
                   AND column_name = 'changes_used') THEN
        ALTER TABLE season_participants 
        ADD COLUMN changes_used INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Corregir la función RPC (Eliminando los casteos a ENUM)
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
  SELECT role, league INTO v_role_out, v_league_out
  FROM participant_selections 
  WHERE participant_id = p_participant_id AND team_id = p_team_out_id AND season_id = p_season_id;

  SELECT role, league INTO v_role_in, v_league_in
  FROM participant_selections 
  WHERE participant_id = p_participant_id AND team_id = p_team_in_id AND season_id = p_season_id;

  IF v_role_out IS NULL THEN RAISE EXCEPTION 'Equipo titular no encontrado'; END IF;
  IF v_role_in IS NULL THEN RAISE EXCEPTION 'Equipo suplente no encontrado'; END IF;
  IF v_league_out != v_league_in THEN RAISE EXCEPTION 'Deben ser de la misma liga'; END IF;
  IF v_role_in NOT LIKE 'SUPLENTE%' THEN RAISE EXCEPTION 'El entrante debe ser suplente'; END IF;
  
  -- Realizar el intercambio (SIN CASTEO ::role_enum, es TEXTO)
  UPDATE participant_selections
  SET role = v_role_in
  WHERE participant_id = p_participant_id AND team_id = p_team_out_id AND season_id = p_season_id;
  
  UPDATE participant_selections
  SET role = v_role_out
  WHERE participant_id = p_participant_id AND team_id = p_team_in_id AND season_id = p_season_id;

  -- Registrar historial (SIN CASTEOS)
  INSERT INTO participant_changes (
    season_id, participant_id, change_type, from_team_id, to_team_id, 
    from_role, to_role, league, executed_at, matchday
  ) VALUES (
    p_season_id, p_participant_id, 'SUPLENTE', p_team_out_id, p_team_in_id,
    v_role_out, v_role_in, v_league_out, NOW(),
    (SELECT COALESCE(MAX(matchday), 0) + 1 FROM matches WHERE season_id = p_season_id AND status = 'FINISHED' LIMIT 1)
  );

  -- Incrementar contador
  UPDATE season_participants 
  SET changes_used = v_changes_used + 1
  WHERE id = p_participant_id;

END;
$$ LANGUAGE plpgsql;
