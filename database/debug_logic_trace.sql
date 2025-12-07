-- Debug version extended to calculate points AND check loop inclusion
DROP FUNCTION IF EXISTS debug_calculate_match_points(UUID, UUID);

CREATE OR REPLACE FUNCTION debug_calculate_match_points(p_match_id UUID, p_target_participant_id UUID)
RETURNS TABLE (log_message TEXT) AS $$
DECLARE
  v_match RECORD;
  v_participant_id UUID;
  v_team_id UUID;
  v_role TEXT;
  v_points INTEGER;
  v_result TEXT;
  v_change_before RECORD;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;
  RETURN QUERY SELECT 'Match: ' || v_match.home_score || '-' || v_match.away_score;

  v_participant_id := p_target_participant_id;
  v_team_id := v_match.away_team_id; -- Almeria is Away

  -- ... (Lógica de cambio igual que antes) ...
  SELECT * INTO v_change_before FROM participant_changes 
  WHERE participant_id = v_participant_id 
    AND (from_team_id = v_team_id OR to_team_id = v_team_id) 
    AND executed_at <= v_match.utc_datetime::timestamptz
  ORDER BY executed_at DESC LIMIT 1;

  IF FOUND THEN
      IF v_change_before.to_team_id = v_team_id THEN
         v_role := v_change_before.to_role::text;
      ELSE
         v_role := NULL;
      END IF;
  END IF;
  
  RETURN QUERY SELECT 'Determined Role: ' || COALESCE(v_role, 'NULL');

  IF v_role IS NOT NULL THEN
    -- Determine match result
    IF v_team_id = v_match.home_team_id THEN
      IF v_match.home_score > v_match.away_score THEN v_result := 'WIN';
      ELSIF v_match.home_score = v_match.away_score THEN v_result := 'DRAW';
      ELSE v_result := 'LOSS'; END IF;
    ELSE
      -- AWAY TEAM LOGIC
      IF v_match.away_score > v_match.home_score THEN v_result := 'WIN';
      ELSIF v_match.away_score = v_match.home_score THEN v_result := 'DRAW';
      ELSE v_result := 'LOSS'; END IF;
    END IF;
    
    RETURN QUERY SELECT 'Match Result for Team: ' || v_result;

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
    END IF;
    
    RETURN QUERY SELECT 'Calculated Points: ' || v_points;
  END IF;

END;
$$ LANGUAGE plpgsql;

SELECT * FROM debug_calculate_match_points(
  '8f3a5ff1-8a29-45c7-9e3f-e5ff05e44ae6', 
  'd0199b08-8313-4e99-81eb-f8373beccee1'
);

-- Check if Ricardo is in the loop list
SELECT DISTINCT participant_id 
FROM participant_changes 
WHERE season_id = 'ba174a20-334f-4ac6-adb2-6dbb4363faba' -- Season ID del partido
AND (from_team_id IN ('741c352c-d43e-4416-a2ca-46436b092798', 'a71e44a0-46ec-4e0a-a779-bb1f651ec56a') 
  OR to_team_id IN ('741c352c-d43e-4416-a2ca-46436b092798', 'a71e44a0-46ec-4e0a-a779-bb1f651ec56a'))
AND participant_id = 'd0199b08-8313-4e99-81eb-f8373beccee1'; -- Ricardo ID
