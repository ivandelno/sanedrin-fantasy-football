-- Trigger to automatically calculate points when a match finishes
CREATE OR REPLACE FUNCTION trigger_calculate_match_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if status changed to FINISHED or score changed while FINISHED
  IF (NEW.status = 'FINISHED' AND (OLD.status != 'FINISHED' OR NEW.home_score != OLD.home_score OR NEW.away_score != OLD.away_score)) THEN
    PERFORM calculate_match_points(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_match_finish ON matches;

CREATE TRIGGER on_match_finish
AFTER UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION trigger_calculate_match_points();

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
