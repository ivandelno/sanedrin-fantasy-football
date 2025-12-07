-- RPC to perform a team substitution (Starter <-> Substitute)
-- Only allows swapping if the user has changes available.

CREATE OR REPLACE FUNCTION perform_team_change(
  p_season_id UUID,
  p_participant_id UUID,
  p_team_out_id UUID, -- The current STARTER leaving the lineup (becoming reserve)
  p_team_in_id UUID   -- The current RESERVE entering the lineup (becoming starter)
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
  
  -- Default max changes if config not found
  IF v_max_changes IS NULL THEN v_max_changes := 3; END IF;
  
  IF v_changes_used >= v_max_changes THEN
    RAISE EXCEPTION 'No changes available (Used: %, Max: %)', v_changes_used, v_max_changes;
  END IF;

  -- 2. Get current roles and verify league match
  SELECT role::text, league::text INTO v_role_out, v_league_out
  FROM participant_selections 
  WHERE participant_id = p_participant_id AND team_id = p_team_out_id AND season_id = p_season_id;

  SELECT role::text, league::text INTO v_role_in, v_league_in
  FROM participant_selections 
  WHERE participant_id = p_participant_id AND team_id = p_team_in_id AND season_id = p_season_id;

  IF v_role_out IS NULL OR v_role_in IS NULL THEN
    RAISE EXCEPTION 'Teams not found in user selections';
  END IF;

  IF v_league_out != v_league_in THEN
    RAISE EXCEPTION 'Teams must be in the same league to swap';
  END IF;
  
  IF v_role_in NOT LIKE 'SUPLENTE%' AND v_role_out LIKE 'SUPLENTE%' THEN
      -- User might have swapped IDs. Let's assume strict: Out=Starter, In=Sub.
      RAISE EXCEPTION 'Team In must be a substitute, Team Out must be a starter';
  END IF;
  
  -- 3. Update Selections (Swap roles)
  -- Team Out (Starter) becomes SUPLENTE
  -- Team In (Sub) takes the Starter's Role
  
  -- Warning: If the starter was 'SUMAR', and sub was 'SUPLENTE_SUMAR' or just 'SUPLENTE'?
  -- Using 'SUPLENTE' as the generic reserve role.
  -- But usually we just swap the role values.
  
  UPDATE participant_selections
  SET role = v_role_in::role_enum -- becomes sub
  WHERE participant_id = p_participant_id AND team_id = p_team_out_id AND season_id = p_season_id;
  
  UPDATE participant_selections
  SET role = v_role_out::role_enum -- becomes starter
  WHERE participant_id = p_participant_id AND team_id = p_team_in_id AND season_id = p_season_id;

  -- 4. Record Change
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
    p_team_out_id,
    p_team_in_id,
    v_role_out::role_enum,
    v_role_in::role_enum, -- Logic might define "to_role" as the role the NEW team acquires? 
                          -- Usually "from_role" is what it WAS, "to_role" is what it BECOMES? 
                          -- Or is it about the change itself? 
                          -- Let's stick to recording the swap.
                          -- It seems `participant_changes` tracks "Change event".
                          -- Let's assume standard log: TeamOut was Starter, TeamIn was Sub.
    v_league_out::league_enum,
    NOW(),
    (SELECT COALESCE(MAX(matchday), 0) FROM matches WHERE season_id = p_season_id AND status = 'FINISHED') + 1 -- Approx matchday
  );

  -- 5. Increment usage
  UPDATE season_participants 
  SET changes_used = changes_used + 1
  WHERE id = p_participant_id;

END;
$$ LANGUAGE plpgsql;
