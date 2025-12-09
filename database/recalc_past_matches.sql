-- ============================================
-- RECALCULAR PUNTOS MASIVO (Jornadas Pasadas)
-- ============================================

-- Este script busca todos los partidos FINALIZADOS de:
-- 1. Primera División - Jornada 15
-- 2. Segunda División - Jornada 17
-- Y fuerza el cálculo de puntos para cada uno.

DO $$
DECLARE
    v_match RECORD;
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Iniciando recálculo masivo de puntos...';

    -- Iterar sobre partidos específicos que ya están finalizados
    FOR v_match IN 
        SELECT id, home_team_id, away_team_id, league, matchday 
        FROM matches 
        WHERE status = 'FINISHED' 
        AND (
            (league = 'PRIMERA' AND matchday = 15) OR
            (league = 'SEGUNDA' AND matchday = 17)
        )
    LOOP
        -- Calcular puntos
        PERFORM calculate_match_points(v_match.id);
        v_count := v_count + 1;
        
        -- Opcional: Log para dar feedback
        RAISE NOTICE 'Recalculado: % J%', v_match.league, v_match.matchday;
    END LOOP;

    RAISE NOTICE '------------------------------------------------';
    RAISE NOTICE 'Proceso completado. Partidos actualizados: %', v_count;
    RAISE NOTICE '------------------------------------------------';
END $$;
