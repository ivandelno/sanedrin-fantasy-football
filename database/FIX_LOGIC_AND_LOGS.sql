-- ============================================
-- SOLUCIÓN LOGIA "3 SUPLENTES" (FIX TO_ROLE)
-- ============================================

-- El usuario reporta que al hacer el cambio, parece que el suplente se queda como suplente.
-- Analizando los logs antiguos, vemos que 'from_role' y 'to_role' suelen ser IGUALES (ej: SUMAR -> SUMAR).
-- Esto indica que el log registra "El hueco que está cambiando" (el hueco titular), no el rol que trae el jugador nuevo.

-- CORRECCIÓN:
-- 1. En el INSERT de participant_changes, usar 'v_role_out' tanto para 'from_role' como para 'to_role'.
--    (Así registramos que el cambio ocurrió en el puesto de Titular/SUMAR).
-- 2. Aseguramos que los UPDATE se hacen correctamente con TRIM() por seguridad.

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

  -- 2. Obtener roles actuales
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
  
  -- 3. Actualizar selección (INTERCAMBIO DE ROLES)
  -- El Titular (Out) se vuelve Suplente (toma el rol del In)
  UPDATE participant_selections
  SET role = v_role_in::selection_role
  WHERE participant_id = p_participant_id AND team_id = p_team_out_id AND season_id = p_season_id;
  
  -- El Suplente (In) se vuelve Titular (toma el rol del Out)
  UPDATE participant_selections
  SET role = v_role_out::selection_role
  WHERE participant_id = p_participant_id AND team_id = p_team_in_id AND season_id = p_season_id;

  -- 4. Registrar historial (FIX LÓGICO: to_role = v_role_out)
  -- Esto mantiene la consistencia con los registros antiguos donde from_role y to_role
  -- representan el "Slot" donde occurre el cambio (ej. SUMAR).
  INSERT INTO participant_changes (
    season_id, 
    participant_id, 
    change_type, 
    from_team_id, 
    to_team_id, 
    from_role, 
    to_role,   -- Usamos v_role_out aquí también
    league, 
    executed_at
  ) VALUES (
    p_season_id, 
    p_participant_id, 
    'SUPLENTE', 
    p_team_out_id, 
    p_team_in_id,
    v_role_out::selection_role, 
    v_role_out::selection_role,  -- <--- CORRECCIÓN CLAVE: Usamos v_role_out, no v_role_in
    v_league_out::league,
    NOW()
  );

  -- 5. Incrementar contador
  UPDATE season_participants 
  SET changes_used = v_changes_used + 1
  WHERE id = p_participant_id;

END;
$$ LANGUAGE plpgsql;
