-- Fix calculate_match_points function to use correct enum values including the new SUPLENTE
CREATE OR REPLACE FUNCTION calculate_match_points(p_match_id UUID)
RETURNS VOID AS $$
DECLARE
  v_match RECORD;
  v_selection RECORD;
  v_points INTEGER;
  v_result TEXT;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM matches WHERE id = p_match_id AND status = 'FINISHED';
  
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Calculate points for each participant's selections
  FOR v_selection IN 
    SELECT ps.*, sp.id as participant_id
    FROM participant_selections ps
    JOIN season_participants sp ON sp.id = ps.participant_id
    WHERE ps.season_id = v_match.season_id
      AND (ps.team_id = v_match.home_team_id OR ps.team_id = v_match.away_team_id)
  LOOP
    -- Determine match result for this team
    IF v_selection.team_id = v_match.home_team_id THEN
      IF v_match.home_score > v_match.away_score THEN
        v_result := 'WIN';
      ELSIF v_match.home_score = v_match.away_score THEN
        v_result := 'DRAW';
      ELSE
        v_result := 'LOSS';
      END IF;
    ELSE
      IF v_match.away_score > v_match.home_score THEN
        v_result := 'WIN';
      ELSIF v_match.away_score = v_match.home_score THEN
        v_result := 'DRAW';
      ELSE
        v_result := 'LOSS';
      END IF;
    END IF;

    -- Calculate points based on role
    -- SUMAR logic (includes legacy SUPLENTE_SUMAR if you want it to count, otherwise move to ELSE)
    -- Assuming SUPLENTE_SUMAR was intended to SUM, but if it's a substitute it usually gets 0.
    -- If SUPLENTE means "Substitute who doesn't play/score", it goes to ELSE (0 points).
    
    IF v_selection.role = 'SUMAR' THEN
      CASE v_result
        WHEN 'WIN' THEN v_points := 3;
        WHEN 'DRAW' THEN v_points := 1;
        WHEN 'LOSS' THEN v_points := 0;
      END CASE;
    
    -- RESTAR logic
    ELSIF v_selection.role = 'RESTAR' THEN
      CASE v_result
        WHEN 'WIN' THEN v_points := -3;
        WHEN 'DRAW' THEN v_points := -1;
        WHEN 'LOSS' THEN v_points := 0;
      END CASE;
      
    -- SUPLENTE, SUPLENTE_SUMAR, SUPLENTE_RESTAR (0 points)
    ELSE
      v_points := 0;
    END IF;

    -- Insert or update points
    INSERT INTO participant_match_points (season_id, participant_id, match_id, points, breakdown_json)
    VALUES (
      v_match.season_id,
      v_selection.participant_id,
      p_match_id,
      v_points,
      jsonb_build_object(
        'team_id', v_selection.team_id,
        'role', v_selection.role,
        'match_result', v_result,
        'points', v_points
      )
    )
    ON CONFLICT (season_id, participant_id, match_id) 
    DO UPDATE SET 
      points = EXCLUDED.points,
      breakdown_json = EXCLUDED.breakdown_json;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Recalculate points for all currently finished matches
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM matches WHERE status = 'FINISHED' LOOP
    PERFORM calculate_match_points(r.id);
  END LOOP;
END;
$$;
