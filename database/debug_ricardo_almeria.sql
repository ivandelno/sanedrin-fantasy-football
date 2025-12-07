-- Debug Ricardo's Almeria points
-- 1. Get Match details for Almeria in Matchday 17
SELECT 
  m.id as match_id,
  m.matchday,
  m.utc_datetime,
  m.status,
  ht.name as home_team,
  at.name as away_team,
  m.home_score,
  m.away_score
FROM matches m
JOIN teams ht ON ht.id = m.home_team_id
JOIN teams at ON at.id = m.away_team_id
WHERE (ht.name = 'Almería' OR at.name = 'Almería') -- Check accent/spelling if needed, usually 'Almería' or 'Almeria'
  AND m.matchday = 17
  AND m.league = 'SEGUNDA';

-- 2. Get Ricardo's participant_id
SELECT 
  sp.id as participant_id,
  u.username
FROM season_participants sp
JOIN users u ON u.id = sp.user_id
WHERE u.username = 'ricardo';

-- 3. Get changes for Ricardo involving Almeria or Valladolid
SELECT 
  pc.id,
  pc.executed_at,
  pc.change_type,
  ft.name as from_team,
  tt.name as to_team,
  pc.from_role,
  pc.to_role
FROM participant_changes pc
JOIN season_participants sp ON sp.id = pc.participant_id
JOIN users u ON u.id = sp.user_id
LEFT JOIN teams ft ON ft.id = pc.from_team_id
LEFT JOIN teams tt ON tt.id = pc.to_team_id
WHERE u.username = 'ricardo'
ORDER BY pc.executed_at DESC;
