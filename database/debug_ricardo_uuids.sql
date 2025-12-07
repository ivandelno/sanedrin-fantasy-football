-- Debug Ricardo Almeria UUIDs and Season IDs
SELECT 
  'Match' as type,
  m.id as match_id,
  m.season_id,
  ht.name as home_team_name,
  ht.id as home_team_id,
  at.name as away_team_name,
  at.id as away_team_id
FROM matches m
JOIN teams ht ON ht.id = m.home_team_id
JOIN teams at ON at.id = m.away_team_id
WHERE m.matchday = 17 AND m.league = 'SEGUNDA' AND (ht.name ILIKE '%Almeria%' OR at.name ILIKE '%Almeria%');

SELECT 
  'Change' as type,
  pc.id as change_id,
  pc.season_id,
  pc.participant_id,
  tt.name as to_team_name,
  tt.id as to_team_id
FROM participant_changes pc
JOIN teams tt ON tt.id = pc.to_team_id
JOIN season_participants sp ON sp.id = pc.participant_id
JOIN users u ON u.id = sp.user_id
WHERE u.username = 'ricardo' AND tt.name ILIKE '%Almeria%';
