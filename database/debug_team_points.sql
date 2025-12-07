-- Query para depurar puntos de un equipo específico
SELECT 
  u.username,
  t.name as team_name,
  m.matchday,
  m.utc_datetime,
  CASE 
    WHEN m.home_team_id = t.id THEN 'Local' 
    ELSE 'Visitante' 
  END as side,
  m.home_score,
  m.away_score,
  pmp.breakdown_json->>'role' as role_at_match,
  pmp.breakdown_json->>'match_result' as result,
  pmp.points
FROM participant_match_points pmp
JOIN matches m ON m.id = pmp.match_id
JOIN season_participants sp ON sp.id = pmp.participant_id
JOIN users u ON u.id = sp.user_id
JOIN teams t ON t.id = (pmp.breakdown_json->>'team_id')::uuid
WHERE (pmp.breakdown_json->>'team_id')::uuid = '22af3b75-1cc6-4c76-9637-c3f8d055b629'
ORDER BY u.username, m.utc_datetime;
