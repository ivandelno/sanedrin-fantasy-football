-- ============================================
-- DEBUG: Puntos de Angelito con Espanyol
-- ============================================

DO $$
DECLARE
    v_username TEXT := 'angelito';
    v_team_name TEXT := 'Espanyol'; -- Ajustar si el nombre es R.C.D. Espanyol o similar
    v_season_id UUID;
    v_participant_id UUID;
    v_team_id UUID;
BEGIN
    -- 1. Obtener ID de la temporada activa (o la última creada)
    SELECT id INTO v_season_id FROM seasons ORDER BY created_at DESC LIMIT 1;

    -- 2. Obtener ID del participante
    SELECT sp.id INTO v_participant_id
    FROM season_participants sp
    JOIN users u ON u.id = sp.user_id
    WHERE u.username = v_username AND sp.season_id = v_season_id;

    -- 3. Obtener ID del equipo
    -- Usamos ILIKE para ser flexibles con el nombre
    SELECT id INTO v_team_id FROM teams WHERE name ILIKE '%' || v_team_name || '%' LIMIT 1;

    RAISE NOTICE 'Debug Info:';
    RAISE NOTICE 'User: % (Participant ID: %)', v_username, v_participant_id;
    RAISE NOTICE 'Team: % (ID: %)', v_team_name, v_team_id;
    RAISE NOTICE 'Season ID: %', v_season_id;

    IF v_participant_id IS NULL THEN
        RAISE EXCEPTION 'Participante no encontrado';
    END IF;
    
    IF v_team_id IS NULL THEN
        RAISE EXCEPTION 'Equipo no encontrado';
    END IF;

    -- 4. Mostrar desglose de partidos y puntos
    RAISE NOTICE '---------------------------------------------------';
    RAISE NOTICE 'Partidos del Espanyol y Puntos de Angelito:';
    RAISE NOTICE '---------------------------------------------------';
END $$;

-- Query principal para ver los datos
WITH user_data AS (
    SELECT sp.id as participant_id, sp.season_id
    FROM season_participants sp
    JOIN users u ON u.id = sp.user_id
    WHERE u.username = 'angelito' 
    LIMIT 1 -- Asumimos temporada actual o única activa
),
team_data AS (
    SELECT id as team_id, name 
    FROM teams 
    WHERE name ILIKE '%Espanyol%' 
    LIMIT 1
)
SELECT 
    m.matchday as "Jornada",
    m.utc_datetime as "Fecha",
    ht.name || ' ' || COALESCE(m.home_score::text, '-') || ' - ' || COALESCE(m.away_score::text, '-') || ' ' || at.name as "Marcador",
    m.status as "Estado",
    -- Rol que tenía el usuario EN ESE MOMENTO (aprox, miramos la selección actual si no hay histórico de cambios para ese matchday)
    ps.role as "Rol Configurado",
    -- Puntos calculados
    pmp.points as "Puntos Asignados",
    pmp.breakdown_json as "Detalle JSON"
FROM matches m
JOIN team_data td ON (m.home_team_id = td.team_id OR m.away_team_id = td.team_id)
JOIN teams ht ON m.home_team_id = ht.id
JOIN teams at ON m.away_team_id = at.id
CROSS JOIN user_data ud
LEFT JOIN participant_selections ps ON ps.participant_id = ud.participant_id AND ps.team_id = td.team_id AND ps.season_id = ud.season_id
LEFT JOIN participant_match_points pmp ON pmp.match_id = m.id AND pmp.participant_id = ud.participant_id
WHERE m.season_id = ud.season_id
ORDER BY m.utc_datetime DESC;
