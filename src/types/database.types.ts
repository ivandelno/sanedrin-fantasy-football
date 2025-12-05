// src/types/database.types.ts
// Updated to match Supabase schema (UUID strings)

import type { PointsBreakdown } from './points.types';

export enum League {
  PRIMERA = 'PRIMERA',
  SEGUNDA = 'SEGUNDA',
  CHAMPIONS = 'CHAMPIONS',
}

export enum Role {
  SUMAR = 'SUMAR',
  RESTAR = 'RESTAR',
  SUPLENTE = 'SUPLENTE',
}

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  FINISHED = 'FINISHED',
  POSTPONED = 'POSTPONED',
}

export enum ChangeType {
  SUPLENTE = 'SUPLENTE',
  EXTRAORDINARY = 'EXTRAORDINARY',
}

/* ---------- Core entities ---------- */
export interface User {
  id: string;               // UUID
  username: string;
  password_hash?: string;
  is_admin: boolean;
  created_at?: string;
}

export interface Season {
  id: string;               // UUID
  name: string;
  is_active: boolean;
  start_matchday?: number;
  created_at?: string;
  status?: 'SETUP' | 'SELECTION_OPEN' | 'IN_PROGRESS' | 'FINISHED';
}

export interface SeasonConfig {
  season_id: string;        // UUID
  max_changes: number;
  extraordinary_window_start_matchday?: number;
  eligible_team_ids?: string[]; // UUID[]
  primera_sumar_count: number;
  primera_restar_count: number;
  segunda_sumar_count: number;
  segunda_restar_count: number;
  champions_sumar_count: number;
  suplente_primera_count: number;
  suplente_segunda_count: number;
}

export interface SeasonParticipant {
  id: string;               // UUID
  season_id: string;        // UUID
  user_id: string;          // UUID
  changes_used: number;
  selection_submitted: boolean;
  created_at?: string;
}

export interface Team {
  id: string;               // UUID
  name: string;
  league: League;
  external_id?: string;
  logo_url?: string;
  created_at?: string;
}

/* ---------- Selections & Changes ---------- */
export interface ParticipantSelection {
  id?: string;              // UUID
  season_id: string;        // UUID
  participant_id: string;   // UUID
  team_id: string;          // UUID
  league: League;
  role: Role;
  is_active: boolean;
  created_at?: string;
}

export interface ParticipantChange {
  id?: string;              // UUID
  season_id: string;        // UUID
  participant_id: string;   // UUID
  change_type: ChangeType;
  from_team_id: string;     // UUID
  to_team_id: string;       // UUID
  from_role: Role;
  to_role: Role;
  league: League;
  matchday: number;
  created_at?: string;
}

/* ---------- Matches & Points ---------- */
export interface Match {
  id: string;               // UUID
  season_id: string;        // UUID
  league: League;
  matchday: number;
  utc_datetime: string;
  home_team_id: string;     // UUID
  away_team_id: string;     // UUID
  home_score?: number;
  away_score?: number;
  status: MatchStatus;
  external_ref?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ParticipantMatchPoints {
  id: string;               // UUID
  season_id: string;        // UUID
  participant_id: string;   // UUID
  match_id: string;         // UUID
  points: number;
  breakdown_json?: PointsBreakdown;
  created_at?: string;
}

/* ---------- News ---------- */
export interface News {
  id: string;               // UUID
  season_id: string;        // UUID
  title: string;
  content: string;
  author_user_id: string;   // UUID
  published: boolean;
  created_at: string;
  updated_at?: string;
}

export interface NewsComment {
  id: string;               // UUID
  news_id: string;          // UUID
  user_id: string;          // UUID
  comment: string;
  created_at: string;
}

export interface NewsLike {
  news_id: string;          // UUID
  user_id: string;          // UUID
  created_at: string;
}

/* ---------- Team name mapping ---------- */
export interface TeamNameMapping {
  id?: string;              // UUID
  api_name: string;
  db_team_id: string;       // UUID
  league: League;
  source: string;
}

/* ---------- Extended types with joins ---------- */
export interface MatchWithTeams extends Match {
  home_team: Team;
  away_team: Team;
}

export interface ParticipantWithUser extends SeasonParticipant {
  user: User;
}

export interface SelectionWithTeam extends ParticipantSelection {
  team: Team;
}

export interface NewsWithAuthor extends News {
  author: User;
  likes_count: number;
  comments_count: number;
  user_has_liked?: boolean;
}

/* ---------- Standings & statistics ---------- */
export interface ParticipantStanding {
  participant_id: string;   // UUID
  user_id: string;          // UUID
  username: string;
  total_points: number;
  position: number;
  position_change?: number;
  matches_played: number;
}

export interface MatchdayPoints {
  matchday: number;
  participant_id: string;   // UUID
  points: number;
  matches_count: number;
}