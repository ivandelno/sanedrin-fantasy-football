# 🚨 QUICK FIX - Database Setup Order

## The Error You're Getting
```
ERROR: 42P01: relation "participant_match_points" does not exist
```

## Why This Happens
The `setup.sql` script contains **functions** that reference base tables like:
- `participant_match_points`
- `matches`
- `participant_selections`
- `season_participants`
- `users`

These tables are created in `base-schema.sql`.

## ✅ SOLUTION: Run Scripts in Order

### Step 1: Run base-schema.sql FIRST
```sql
-- Copy and paste the entire contents of database/base-schema.sql
-- into Supabase SQL Editor and run it
```

This creates all the core tables you listed:
- users
- seasons
- teams
- season_participants
- participant_selections
- participant_changes
- matches
- participant_match_points

### Step 2: Run setup.sql SECOND
```sql
-- Copy and paste the entire contents of database/setup.sql
-- into Supabase SQL Editor and run it
```

This creates additional features:
- news, news_comments, news_likes
- season_config
- team_name_mappings
- Helper functions
- Test users

## 🔍 What If You Already Have Some Tables?

If you already created some of the base tables, that's fine! The `base-schema.sql` uses `CREATE TABLE IF NOT EXISTS`, so it will:
- ✅ Skip tables that already exist
- ✅ Create tables that don't exist yet
- ✅ Won't overwrite your data

## 📋 Quick Checklist

- [ ] Open Supabase SQL Editor
- [ ] Copy entire `database/base-schema.sql` file
- [ ] Paste and run it
- [ ] Wait for success message
- [ ] Copy entire `database/setup.sql` file
- [ ] Paste and run it
- [ ] Done! ✅

## ⚠️ Important
You MUST run `base-schema.sql` before `setup.sql` because the functions in `setup.sql` reference tables created in `base-schema.sql`.
