-- Add 'SUPLENTE' to the selection_role enum
-- This allows the value 'SUPLENTE' to be stored in the role column
ALTER TYPE selection_role ADD VALUE IF NOT EXISTS 'SUPLENTE';
