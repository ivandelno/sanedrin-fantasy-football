# Database Schema Fix - Summary

## Problem
The original SQL scripts used **BIGINT** for primary keys and foreign keys, but your existing Supabase database uses **UUID** for all IDs. This caused foreign key constraint errors.

## Solution
Both `base-schema.sql` and `setup.sql` have been completely rewritten to use **UUID** consistently throughout.

## Key Changes

### All Primary Keys Changed from BIGINT to UUID:
- `users.id`: BIGINT → **UUID**
- `season_participants.id`: BIGINT → **UUID**
- `matches.id`: BIGINT → **UUID**
- `participant_match_points.id`: BIGINT → **UUID**
- `participant_changes.id`: BIGINT → **UUID**
- `news.id`: BIGINT → **UUID**
- `news_comments.id`: BIGINT → **UUID**
- `team_name_mappings.id`: BIGINT → **UUID**

### All Foreign Keys Updated:
- All `REFERENCES` clauses now correctly reference UUID columns
- Function parameters changed from BIGINT to UUID
- Function return types updated to use UUID

### Additional Fixes:
- `season_config.eligible_team_ids`: Changed from `BIGINT[]` to `UUID[]`
- Added support for `SUPLENTE_SUMAR` role in participant_selections
- Renamed `team_changes` to `participant_changes` to match your schema
- Changed `match_date` to `utc_datetime` to match your schema
- Added `external_ref` field to matches table

## How to Use

### Option 1: If your tables DON'T exist yet
1. Run `database/base-schema.sql` first
2. Run `database/setup.sql` second

### Option 2: If your tables ALREADY exist
Since you mentioned you already created the base tables, you only need to run:
- `database/setup.sql` (which creates the additional tables: news, season_config, team_name_mappings)

The `base-schema.sql` file is provided for reference and uses `CREATE TABLE IF NOT EXISTS`, so it won't overwrite your existing tables.

## Tables in base-schema.sql (Core)
✅ users
✅ seasons
✅ teams
✅ season_participants
✅ participant_selections
✅ participant_changes
✅ matches
✅ participant_match_points

## Tables in setup.sql (Additional)
✅ news
✅ news_comments
✅ news_likes
✅ season_config
✅ team_name_mappings

## Functions Created
✅ `calculate_match_points(p_match_id UUID)` - Calculates points for a finished match
✅ `get_participant_standings(p_season_id UUID)` - Returns current standings

## Test Users Created
- **admin** / admin123 (administrator)
- **usuario1** / user123 (regular user)
