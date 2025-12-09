-- ============================================
-- FIX: CORREGIR CLASIFICACIÓN (Posición y Cambios)
-- ============================================

-- Este script actualiza la función de clasificación para:
-- 1. Devolver 'rank_position' en lugar de 'position' (coincidiendo con el frontend).
-- 2. Incluir la columna 'changes_used' que faltaba.

CREATE OR REPLACE FUNCTION get_participant_standings(p_season_id UUID)
RETURNS TABLE (
  participant_id UUID,
  user_id UUID,
  username TEXT,
  total_points BIGINT,
  rank_position INTEGER, -- Renombrado para coincidir con React
  matches_played BIGINT,
  changes_used INTEGER   -- Añadido
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
      COALESCE(sp.changes_used, 0) as changes_used, -- Obtener cambios usados
      ROW_NUMBER() OVER (ORDER BY COALESCE(ps.total_points, 0) DESC, sp.created_at ASC) as val_position
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
    r.val_position::INTEGER as rank_position,
    r.matches_played,
    r.changes_used
  FROM ranked r
  ORDER BY r.val_position;
END;
$$ LANGUAGE plpgsql;
