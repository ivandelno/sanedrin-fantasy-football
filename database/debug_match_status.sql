-- Verificar estado de los partidos para el equipo en cuestión
SELECT 
  m.id,
  m.matchday,
  m.league,
  m.status,
  m.home_score,
  m.away_score,
  m.utc_datetime,
  ht.name as home_team,
  at.name as away_team
FROM matches m
JOIN teams ht ON ht.id = m.home_team_id
JOIN teams at ON at.id = m.away_team_id
WHERE (m.home_team_id = '22af3b75-1cc6-4c76-9637-c3f8d055b629' OR m.away_team_id = '22af3b75-1cc6-4c76-9637-c3f8d055b629')
AND m.matchday IN (7, 13, 15)
ORDER BY m.matchday;
