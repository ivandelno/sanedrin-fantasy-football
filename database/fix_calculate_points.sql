-- Fix calculate_match_points to respect historical changes (participant_changes)
CREATE OR REPLACE FUNCTION calculate_match_points(p_match_id UUID)
RETURNS VOID AS $$
DECLARE
  v_match RECORD;
  v_participant_id UUID;
  v_team_id UUID;
  v_role TEXT;
  v_points INTEGER;
  v_result TEXT;
  v_change_before RECORD;
  v_change_after RECORD;
  v_current_selection RECORD;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM matches WHERE id = p_match_id AND status = 'FINISHED';
  
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Iterate over all participants who have EVER had the home or away team selected
  -- This covers current selections AND past selections (via changes)
  FOR v_participant_id IN
    SELECT DISTINCT participant_id FROM participant_selections 
    WHERE season_id = v_match.season_id AND team_id IN (v_match.home_team_id, v_match.away_team_id)
    UNION
    SELECT DISTINCT participant_id FROM participant_changes 
    WHERE season_id = v_match.season_id AND (from_team_id IN (v_match.home_team_id, v_match.away_team_id) OR to_team_id IN (v_match.home_team_id, v_match.away_team_id))
  LOOP
    
    -- Check for both Home and Away teams for this participant
    FOREACH v_team_id IN ARRAY ARRAY[v_match.home_team_id, v_match.away_team_id]
    LOOP
      v_role := NULL;

      -- 1. Check for the latest change BEFORE or AT the match date
      SELECT * INTO v_change_before FROM participant_changes 
      WHERE participant_id = v_participant_id 
        AND (from_team_id = v_team_id OR to_team_id = v_team_id) 
        AND executed_at <= v_match.utc_datetime::timestamptz
      ORDER BY executed_at DESC LIMIT 1;

      IF FOUND(v_change_before) THEN
        -- A change happened before the match. What was the result?
        IF v_change_before.to_team_id = v_team_id THEN
          -- Team was added or moved to this role
          v_role := v_change_before.to_role::text;
        ELSIF v_change_before.from_team_id = v_team_id THEN
          -- Team was removed or moved from this role
          IF v_change_before.change_type = 'SUPLENTE' THEN
            v_role := 'SUPLENTE'; -- Swapped to bench
          ELSE
            v_role := NULL; -- Removed (EXTRAORDINARY)
          END IF;
        END IF;

      ELSE
        -- 2. No change before match. Check for the first change AFTER the match.
        SELECT * INTO v_change_after FROM participant_changes 
        WHERE participant_id = v_participant_id 
          AND (from_team_id = v_team_id OR to_team_id = v_team_id) 
          AND executed_at > v_match.utc_datetime::timestamptz
        ORDER BY executed_at ASC LIMIT 1;

        IF FOUND(v_change_after) THEN
          -- A change happened after. What was the state before it?
          IF v_change_after.from_team_id = v_team_id THEN
            -- Team was moved FROM this role, so it WAS in this role before.
            v_role := v_change_after.from_role::text;
          ELSIF v_change_after.to_team_id = v_team_id THEN
            -- Team was moved TO this role, so it was NOT in this role before.
            IF v_change_after.change_type = 'SUPLENTE' THEN
              v_role := 'SUPLENTE'; -- Was on bench before swap
            ELSE
              v_role := NULL; -- Was not selected before addition
            END IF;
          END IF;

        ELSE
          -- 3. No changes ever for this team. Check current selections.
          SELECT role::text INTO v_role FROM participant_selections 
          WHERE participant_id = v_participant_id AND team_id = v_team_id;
          
          -- If not found in current selections, v_role remains NULL (correct)
        END IF;
      END IF;

      -- If we identified a valid role, calculate points
      IF v_role IS NOT NULL THEN
        -- Determine match result
        IF v_team_id = v_match.home_team_id THEN
          IF v_match.home_score > v_match.away_score THEN v_result := 'WIN';
          ELSIF v_match.home_score = v_match.away_score THEN v_result := 'DRAW';
          ELSE v_result := 'LOSS'; END IF;
        ELSE
          IF v_match.away_score > v_match.home_score THEN v_result := 'WIN';
          ELSIF v_match.away_score = v_match.home_score THEN v_result := 'DRAW';
          ELSE v_result := 'LOSS'; END IF;
        END IF;

        -- Calculate points based on role
        v_points := 0;
        IF v_role IN ('SUMAR', 'SUPLENTE_SUMAR') THEN
          CASE v_result
            WHEN 'WIN' THEN v_points := 3;
            WHEN 'DRAW' THEN v_points := 1;
            WHEN 'LOSS' THEN v_points := 0;
          END CASE;
        ELSIF v_role IN ('RESTAR', 'SUPLENTE_RESTAR') THEN
          CASE v_result
            WHEN 'WIN' THEN v_points := -3;
            WHEN 'DRAW' THEN v_points := -1;
            WHEN 'LOSS' THEN v_points := 0;
          END CASE;
        ELSE
           -- SUPLENTE or others get 0 points
           v_points := 0;
        END IF;

        -- Insert or update points
        INSERT INTO participant_match_points (season_id, participant_id, match_id, points, breakdown_json)
        VALUES (
          v_match.season_id,
          v_participant_id,
          p_match_id,
          v_points,
          jsonb_build_object(
            'team_id', v_team_id,
            'role', v_role,
            'match_result', v_result,
            'points', v_points
          )
        )
        ON CONFLICT (season_id, participant_id, match_id) 
        DO UPDATE SET 
          points = EXCLUDED.points,
          breakdown_json = EXCLUDED.breakdown_json;
      END IF;
      
    END LOOP; -- End team loop
  END LOOP; -- End participant loop
END;
$$ LANGUAGE plpgsql;

-- Recalculate points for all currently finished matches to apply the fix
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM matches WHERE status = 'FINISHED' LOOP
    PERFORM calculate_match_points(r.id);
  END LOOP;
END;
$$;
