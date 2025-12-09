-- ============================================
-- RESETEAR CONTADOR DE CAMBIOS
-- ============================================

-- La información de "cambios usados" se guarda en la tabla 'season_participants',
-- en la columna 'changes_used' (la que creamos hace poco).

-- Para resetear el contador de un usuario específico (por ejemplo 'ivan') a 0:

UPDATE season_participants
SET changes_used = 0
FROM users
WHERE season_participants.user_id = users.id
  AND users.username = 'ivan'; -- <--- Pon aquí el nombre de usuario exacto si es diferente

-- Si prefieres hacerlo manualmente en el editor de tabla de Supabase:
-- 1. Ve a la tabla 'season_participants'.
-- 2. Busca la fila correspondiente al usuario.
-- 3. Edita la columna 'changes_used' y ponla a 0.
