-- Ver quién tiene al Cádiz seleccionado
SELECT 
  u.username, 
  ps.role, 
  ps.league,
  ps.participant_id
FROM participant_selections ps
JOIN season_participants sp ON sp.id = ps.participant_id
JOIN users u ON u.id = sp.user_id
WHERE ps.team_id = '22af3b75-1cc6-4c76-9637-c3f8d055b629';

-- Ver si hay cambios históricos para Cádiz y Angelito
SELECT 
  u.username,
  pc.*
FROM participant_changes pc
JOIN season_participants sp ON sp.id = pc.participant_id
JOIN users u ON u.id = sp.user_id
WHERE (pc.from_team_id = '22af3b75-1cc6-4c76-9637-c3f8d055b629' OR pc.to_team_id = '22af3b75-1cc6-4c76-9637-c3f8d055b629')
AND u.username ILIKE '%angelito%';
