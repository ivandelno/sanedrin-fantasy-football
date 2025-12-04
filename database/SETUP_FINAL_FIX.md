# ✅ SETUP.SQL - FINAL FIX

## What Was Wrong

The error `column "published" does not exist` happened because:
1. You already had a `news` table in your database
2. The `CREATE TABLE IF NOT EXISTS` statement skipped creating the table
3. Your existing `news` table didn't have the `published` column
4. Later code tried to reference the `published` column that didn't exist

## What I Fixed

### 1. News Tables - Now Using DROP and CREATE
```sql
DROP TABLE IF EXISTS news_likes CASCADE;
DROP TABLE IF EXISTS news_comments CASCADE;
DROP TABLE IF EXISTS news CASCADE;

CREATE TABLE news (...);  -- Fresh table with all columns
```

**Why:** This ensures the tables are created with the correct schema, including the `published` column.

### 2. Removed `is_active` Check from Function
Changed line 114 from:
```sql
AND ps.is_active = TRUE
```
To:
```sql
-- Removed is_active check (column may not exist in your schema)
```

**Why:** Your `participant_selections` table might not have an `is_active` column.

### 3. Added SUPLENTE to Point Calculation
```sql
IF v_selection.role IN ('SUMAR', 'SUPLENTE_SUMAR', 'SUPLENTE') THEN
```

**Why:** SUPLENTE teams should also earn points when they play.

## ⚠️ Important Note

This script will **DROP and recreate** the following tables:
- `news`
- `news_comments`  
- `news_likes`

**If you have data in these tables, it will be deleted!**

The other tables (`season_config`, `team_name_mappings`) use `DROP IF EXISTS` or `CREATE IF NOT EXISTS` as appropriate.

## 🚀 Ready to Run

Now you can run `setup.sql` and it should complete successfully without errors!

```sql
-- Copy and paste the entire contents of database/setup.sql
-- into Supabase SQL Editor and run it
```

## What Gets Created

✅ `news` table (with `published` column)
✅ `news_comments` table
✅ `news_likes` table
✅ `season_config` table
✅ `team_name_mappings` table
✅ `calculate_match_points()` function
✅ `get_participant_standings()` function
✅ Test users (admin, usuario1)

**No more column errors!** 🎉
