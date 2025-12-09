-- ============================================
-- SOLUCIÓN ERROR TIPO "LEAGUE"
-- ============================================

-- El error indica que la columna 'league' usa un tipo ENUM llamado 'league'.
-- Debemos castear el texto explícitamente a este tipo: ::league

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
  -- 1. Verificar cambios disponibles
  SELECT max_changes INTO v_max_changes FROM season_config WHERE season_id = p_season_id;
  SELECT changes_used INTO v_changes_used FROM season_participants WHERE id = p_participant_id;
  
  v_max_changes := COALESCE(v_max_changes, 3);
  v_changes_used := COALESCE(v_changes_used, 0);
  
  IF v_changes_used >= v_max_changes THEN
    RAISE EXCEPTION 'No te quedan cambios disponibles (Usados: %, Max: %)', v_changes_used, v_max_changes;
  END IF;

  -- 2. Obtener roles actuales (Leemos como TEXTO)
  SELECT role::text, league::text INTO v_role_out, v_league_out
  FROM participant_selections 
  WHERE participant_id = p_participant_id AND team_id = p_team_out_id AND season_id = p_season_id;

  SELECT role::text, league::text INTO v_role_in, v_league_in
  FROM participant_selections 
  WHERE participant_id = p_participant_id AND team_id = p_team_in_id AND season_id = p_season_id;

  -- Validaciones
  IF v_role_out IS NULL THEN RAISE EXCEPTION 'Equipo titular no encontrado'; END IF;
  IF v_role_in IS NULL THEN RAISE EXCEPTION 'Equipo suplente no encontrado'; END IF;
  
  IF v_league_out != v_league_in THEN RAISE EXCEPTION 'Deben incluir equipos de la misma liga'; END IF;
  IF v_role_in NOT LIKE 'SUPLENTE%' THEN RAISE EXCEPTION 'El equipo que entra debe ser suplente'; END IF;
  
  -- 3. Actualizar selección (Casteo ::selection_role)
  UPDATE participant_selections
  SET role = v_role_in::selection_role
  WHERE participant_id = p_participant_id AND team_id = p_team_out_id AND season_id = p_season_id;
  
  UPDATE participant_selections
  SET role = v_role_out::selection_role
  WHERE participant_id = p_participant_id AND team_id = p_team_in_id AND season_id = p_season_id;

  -- 4. Registrar historial (Casteo ::selection_role Y ::league)
  INSERT INTO participant_changes (
    season_id, 
    participant_id, 
    change_type, 
    from_team_id, 
    to_team_id, 
    from_role, 
    to_role, 
    league, 
    executed_at
  ) VALUES (
    p_season_id, 
    p_participant_id, 
    'SUPLENTE', 
    p_team_out_id, 
    p_team_in_id,
    v_role_out::selection_role, 
    v_role_in::selection_role,  
    v_league_out::league,   -- <--- CORRECCIÓN AQUÍ (Casteo a tipo enum)
    NOW()
  );

  -- 5. Incrementar contador
  UPDATE season_participants 
  SET changes_used = v_changes_used + 1
  WHERE id = p_participant_id;

END;
$$ LANGUAGE plpgsql;
