-- ============================================
-- FORZAR RECALCULO DE PUNTOS
-- ============================================

-- El problema parece ser que el trigger no saltó para este partido en concreto (Jornada 15)
-- porque quizás se insertó ya con status='FINISHED', y el trigger original
-- solo salta on UPDATE when status changes.

-- Vamos a forzar el recálculo manual para este partido específico del Espanyol.

DO $$
DECLARE
    v_match_id UUID := '0059ee43-23ab-4c0d-8e3b-28111612decc'; -- ID del partido Espanyol J15
BEGIN
    RAISE NOTICE 'Recalculando puntos para el partido %...', v_match_id;
    
    PERFORM calculate_match_points(v_match_id);
    
    RAISE NOTICE 'Recálculo finalizado.';
END $$;
