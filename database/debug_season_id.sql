-- Verificar season_id
SELECT 
  'Match J7' as type, m.season_id 
FROM matches m WHERE m.matchday = 7 AND (m.home_team_id = '22af3b75-1cc6-4c76-9637-c3f8d055b629' OR m.away_team_id = '22af3b75-1cc6-4c76-9637-c3f8d055b629')
UNION ALL
SELECT 
  'Selection Angelito', ps.season_id 
FROM participant_selections ps 
JOIN season_participants sp ON sp.id = ps.participant_id
JOIN users u ON u.id = sp.user_id
WHERE u.username = 'angelito' AND ps.team_id = '22af3b75-1cc6-4c76-9637-c3f8d055b629';
