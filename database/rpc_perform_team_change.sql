-- RPC to perform a team substitution (Starter <-> Substitute)
-- Only allows swapping if the user has changes available.

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
  -- 1. Check changes availability
  SELECT max_changes INTO v_max_changes FROM season_config WHERE season_id = p_season_id;
  SELECT changes_used INTO v_changes_used FROM season_participants WHERE id = p_participant_id;
  
  -- Default values
  v_max_changes := COALESCE(v_max_changes, 3);
  v_changes_used := COALESCE(v_changes_used, 0);
  
  IF v_changes_used >= v_max_changes THEN
    RAISE EXCEPTION 'No te quedan cambios disponibles (Usados: %, Max: %)', v_changes_used, v_max_changes;
  END IF;

  -- 2. Get current roles and verified league
  SELECT role::text, league::text INTO v_role_out, v_league_out
  FROM participant_selections 
  WHERE participant_id = p_participant_id AND team_id = p_team_out_id AND season_id = p_season_id;

  SELECT role::text, league::text INTO v_role_in, v_league_in
  FROM participant_selections 
  WHERE participant_id = p_participant_id AND team_id = p_team_in_id AND season_id = p_season_id;

  IF v_role_out IS NULL THEN
    RAISE EXCEPTION 'Equipo titular no encontrado en tu selección';
  END IF;

  IF v_role_in IS NULL THEN
     RAISE EXCEPTION 'Equipo suplente no encontrado en tu selección';
  END IF;

  IF v_league_out != v_league_in THEN
    RAISE EXCEPTION 'Los equipos deben ser de la misma liga para cambiarse';
  END IF;
  
  -- Simplified role check: just ensure In is Sub, Out is NOT Sub
  IF v_role_in NOT LIKE 'SUPLENTE%' THEN
      RAISE EXCEPTION 'El equipo que entra debe ser suplente';
  END IF;
  
  IF v_role_out LIKE 'SUPLENTE%' THEN
       RAISE EXCEPTION 'El equipo que sale debe ser titular';
  END IF;
  
  -- 3. Update Selections (Swap roles)
  -- Team Out (Starter) becomes SUPLENTE variant of its role if possible, or just SUPLENTE
  -- Actually, we simply swap the roles stored in DB.
  -- e.g. Out: 'SUMAR', In: 'SUPLENTE' -> Out becomes 'SUPLENTE', In becomes 'SUMAR'
  
  UPDATE participant_selections
  SET role = v_role_in::role_enum
  WHERE participant_id = p_participant_id AND team_id = p_team_out_id AND season_id = p_season_id;
  
  UPDATE participant_selections
  SET role = v_role_out::role_enum
  WHERE participant_id = p_participant_id AND team_id = p_team_in_id AND season_id = p_season_id;

  -- 4. Record Change history
  INSERT INTO participant_changes (
    season_id,
    participant_id,
    change_type,
    from_team_id,
    to_team_id,
    from_role,
    to_role,
    league,
    executed_at,
    matchday
  ) VALUES (
    p_season_id,
    p_participant_id,
    'SUPLENTE',
    p_team_out_id, -- Team LEAVING naming convention in UI
    p_team_in_id,  -- Team ENTERING naming convention in UI
    v_role_out::role_enum, -- Role it had (Starter)
    v_role_in::role_enum,  -- Role it had (Sub)
    v_league_out::league_enum,
    NOW(),
    (SELECT COALESCE(MAX(matchday), 0) + 1 FROM matches WHERE season_id = p_season_id AND status = 'FINISHED' LIMIT 1)
  );

  -- 5. Increment usage
  UPDATE season_participants 
  SET changes_used = v_changes_used + 1
  WHERE id = p_participant_id;

END;
$$ LANGUAGE plpgsql;
