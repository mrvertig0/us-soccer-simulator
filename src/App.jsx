import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Trophy, Activity, BarChart2, PlusCircle, Users, RefreshCw, Download, 
  Copy, Check, Shield, Heart, Sparkles, Trash2, UserPlus, Play, 
  ChevronRight, AlertCircle, Filter, ArrowUpDown, Award, Info, Layers, 
  Settings, Calendar, TrendingUp, X, Search, Zap, Share2, Target, 
  CheckCircle2, XCircle, Percent, ArrowUpRight, Gauge
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, Cell, AreaChart, Area, LineChart, Line
} from 'recharts';

// ============================================================================
// 1. INITIAL TEAM DATABASE (PRO & AMATEUR CLUBS)
// ============================================================================
const INITIAL_TEAMS = [
  // --- MEN'S DIVISION I: MLS ---
  {
    id: 'inter-miami',
    name: 'Inter Miami CF',
    gender: 'mens',
    league: 'MLS',
    tier: 1,
    badgeColor: '#F472B6',
    elo: 1645,
    squadValue: 85000000,
    avgFotmob: 7.18,
    isIndependent: true,
    squad: [
      { name: 'Lionel Messi', pos: 'ST', val: 20000000, rating: 8.55 },
      { name: 'Luis Suárez', pos: 'ST', val: 3500000, rating: 7.62 },
      { name: 'Rodrigo De Paul', pos: 'CM', val: 25000000, rating: 7.45 },
      { name: 'Jordi Alba', pos: 'LB', val: 2500000, rating: 7.35 }
    ]
  },
  {
    id: 'columbus-crew',
    name: 'Columbus Crew',
    gender: 'mens',
    league: 'MLS',
    tier: 1,
    badgeColor: '#FACC15',
    elo: 1635,
    squadValue: 60000000,
    avgFotmob: 7.15,
    isIndependent: true,
    squad: [
      { name: 'Cucho Hernández', pos: 'ST', val: 15000000, rating: 8.10 },
      { name: 'Diego Rossi', pos: 'LW', val: 7000000, rating: 7.40 },
      { name: 'Darlington Nagbe', pos: 'CM', val: 2000000, rating: 7.30 }
    ]
  },
  {
    id: 'lafc',
    name: 'Los Angeles FC',
    gender: 'mens',
    league: 'MLS',
    tier: 1,
    badgeColor: '#EAB308',
    elo: 1620,
    squadValue: 65000000,
    avgFotmob: 7.10,
    isIndependent: true,
    squad: [
      { name: 'Denis Bouanga', pos: 'LW', val: 10000000, rating: 7.85 },
      { name: 'Olivier Giroud', pos: 'ST', val: 3000000, rating: 7.30 },
      { name: 'Mateusz Bogusz', pos: 'CAM', val: 6000000, rating: 7.25 }
    ]
  },
  {
    id: 'fc-cincinnati',
    name: 'FC Cincinnati',
    gender: 'mens',
    league: 'MLS',
    tier: 1,
    badgeColor: '#F97316',
    elo: 1610,
    squadValue: 52000000,
    avgFotmob: 7.08,
    isIndependent: true,
    squad: [
      { name: 'Luciano Acosta', pos: 'CAM', val: 8000000, rating: 7.95 },
      { name: 'Kevin Kelsy', pos: 'ST', val: 4000000, rating: 7.10 }
    ]
  },

  // --- MEN'S DIVISION II: USL CHAMPIONSHIP ---
  {
    id: 'louisville-city',
    name: 'Louisville City FC',
    gender: 'mens',
    league: 'USL Championship',
    tier: 2,
    badgeColor: '#8B5CF6',
    elo: 1440,
    squadValue: 6200000,
    avgFotmob: 7.02,
    isIndependent: true,
    squad: [
      { name: 'Wilson Harris', pos: 'ST', val: 500000, rating: 7.35 },
      { name: 'Taylor Davila', pos: 'CM', val: 450000, rating: 7.20 }
    ]
  },
  {
    id: 'sacramento-republic',
    name: 'Sacramento Republic FC',
    gender: 'mens',
    league: 'USL Championship',
    tier: 2,
    badgeColor: '#C8102E',
    elo: 1410,
    squadValue: 5100000,
    avgFotmob: 6.98,
    isIndependent: true,
    squad: [
      { name: 'Russell Cicerone', pos: 'ST', val: 450000, rating: 7.20 },
      { name: 'Rodrigo López', pos: 'CAM', val: 300000, rating: 7.10 }
    ]
  },
  {
    id: 'rhode-island-fc',
    name: 'Rhode Island FC',
    gender: 'mens',
    league: 'USL Championship',
    tier: 2,
    badgeColor: '#F59E0B',
    elo: 1395,
    squadValue: 4700000,
    avgFotmob: 6.92,
    isIndependent: true,
    squad: [
      { name: 'Albert Dikwa', pos: 'ST', val: 450000, rating: 7.25 },
      { name: 'Noah Fuson', pos: 'LW', val: 350000, rating: 7.10 }
    ]
  },

  // --- MEN'S DIVISION III: USL1 & MLSNP ---
  {
    id: 'union-omaha',
    name: 'Union Omaha',
    gender: 'mens',
    league: 'USL League One',
    tier: 3,
    badgeColor: '#0284C7',
    elo: 1265,
    squadValue: 2100000,
    avgFotmob: 6.78,
    isIndependent: true,
    squad: [
      { name: 'Steevan Dos Santos', pos: 'ST', val: 200000, rating: 7.10 }
    ]
  },
  {
    id: 'crown-legacy',
    name: 'Crown Legacy FC',
    gender: 'mens',
    league: 'MLS NEXT Pro',
    tier: 3,
    badgeColor: '#06B6D4',
    elo: 1250,
    squadValue: 2800000,
    avgFotmob: 6.82,
    isIndependent: false,
    squad: [
      { name: 'Nimfasha Berchimas', pos: 'RW', val: 800000, rating: 7.35 }
    ]
  },

  // --- MEN'S AMATEUR PRESET ---
  {
    id: 'el-farolito',
    name: 'El Farolito FC',
    gender: 'mens',
    league: 'NPSL (Amateur)',
    tier: 4,
    badgeColor: '#C8102E',
    elo: 1140,
    squadValue: 350000,
    avgFotmob: 6.55,
    isIndependent: true,
    isAmateur: true,
    squad: [
      { name: 'Dembor Bengtson', pos: 'ST', val: 60000, rating: 7.20 }
    ]
  },

  // --- WOMEN'S DIVISION I: NWSL ---
  {
    id: 'orlando-pride',
    name: 'Orlando Pride',
    gender: 'womens',
    league: 'NWSL',
    tier: 1,
    badgeColor: '#6366F1',
    elo: 1650,
    squadValue: 5200000,
    avgFotmob: 7.25,
    isIndependent: true,
    squad: [
      { name: 'Barbra Banda', pos: 'ST', val: 1200000, rating: 8.40 },
      { name: 'Marta', pos: 'CAM', val: 600000, rating: 7.85 }
    ]
  },
  {
    id: 'washington-spirit',
    name: 'Washington Spirit',
    gender: 'womens',
    league: 'NWSL',
    tier: 1,
    badgeColor: '#C8102E',
    elo: 1630,
    squadValue: 4900000,
    avgFotmob: 7.18,
    isIndependent: true,
    squad: [
      { name: 'Trinity Rodman', pos: 'RW', val: 1100000, rating: 8.20 },
      { name: 'Ouleymata Sarr', pos: 'ST', val: 700000, rating: 7.45 }
    ]
  },
  {
    id: 'gotham-fc',
    name: 'NJ/NY Gotham FC',
    gender: 'womens',
    league: 'NWSL',
    tier: 1,
    badgeColor: '#06B6D4',
    elo: 1610,
    squadValue: 4700000,
    avgFotmob: 7.15,
    isIndependent: true,
    squad: [
      { name: 'Rose Lavelle', pos: 'CAM', val: 950000, rating: 8.05 },
      { name: 'Crystal Dunn', pos: 'CM', val: 700000, rating: 7.50 }
    ]
  },
  {
    id: 'nc-courage',
    name: 'NC Courage',
    gender: 'womens',
    league: 'NWSL',
    tier: 1,
    badgeColor: '#10B981',
    elo: 1590,
    squadValue: 4400000,
    avgFotmob: 7.12,
    isIndependent: true,
    squad: [
      { name: 'Kerolin', pos: 'ST', val: 900000, rating: 8.10 }
    ]
  },

  // --- WOMEN'S DIVISION I: USL SUPER LEAGUE ---
  {
    id: 'carolina-ascent',
    name: 'Carolina Ascent FC',
    gender: 'womens',
    league: 'USL Super League',
    tier: 2,
    badgeColor: '#0284C7',
    elo: 1420,
    squadValue: 1800000,
    avgFotmob: 6.90,
    isIndependent: true,
    squad: [
      { name: 'Mia Corbin', pos: 'ST', val: 250000, rating: 7.30 }
    ]
  },
  {
    id: 'brooklyn-fc-w',
    name: 'Brooklyn FC (Women)',
    gender: 'womens',
    league: 'USL Super League',
    tier: 2,
    badgeColor: '#EC4899',
    elo: 1390,
    squadValue: 1550000,
    avgFotmob: 6.82,
    isIndependent: true,
    squad: [
      { name: 'Mackenzie George', pos: 'RW', val: 210000, rating: 7.20 }
    ]
  }
];

// ============================================================================
// 2. UPCOMING MATCHDAY SCHEDULE FIXTURES
// ============================================================================
const INITIAL_SCHEDULE_FIXTURES = [
  {
    id: 'fix_1',
    league: 'MLS',
    gender: 'mens',
    kickoff: '2026-11-01T15:00:00-05:00',
    venue: 'Chase Stadium, Fort Lauderdale, FL',
    homeTeamId: 'inter-miami',
    awayTeamId: 'columbus-crew'
  },
  {
    id: 'fix_2',
    league: 'MLS',
    gender: 'mens',
    kickoff: '2026-11-01T18:00:00-05:00',
    venue: 'BMO Stadium, Los Angeles, CA',
    homeTeamId: 'lafc',
    awayTeamId: 'fc-cincinnati'
  },
  {
    id: 'fix_3',
    league: 'USL Championship',
    gender: 'mens',
    kickoff: '2026-11-01T19:30:00-05:00',
    venue: 'Lynn Family Stadium, Louisville, KY',
    homeTeamId: 'louisville-city',
    awayTeamId: 'sacramento-republic'
  },
  {
    id: 'fix_4',
    league: 'NWSL',
    gender: 'womens',
    kickoff: '2026-11-01T16:00:00-05:00',
    venue: 'Inter&Co Stadium, Orlando, FL',
    homeTeamId: 'orlando-pride',
    awayTeamId: 'washington-spirit'
  },
  {
    id: 'fix_5',
    league: 'NWSL',
    gender: 'womens',
    kickoff: '2026-11-01T17:30:00-05:00',
    venue: 'Red Bull Arena, Harrison, NJ',
    homeTeamId: 'gotham-fc',
    awayTeamId: 'nc-courage'
  },
  {
    id: 'fix_6',
    league: 'USL Super League',
    gender: 'womens',
    kickoff: '2026-11-01T19:00:00-05:00',
    venue: 'American Legion Memorial Stadium, Charlotte, NC',
    homeTeamId: 'carolina-ascent',
    awayTeamId: 'brooklyn-fc-w'
  },
  {
    id: 'fix_7',
    league: 'MLS NEXT Pro',
    gender: 'mens',
    kickoff: '2026-11-02T14:00:00-05:00',
    venue: 'Sportsplex at Matthews, NC',
    homeTeamId: 'crown-legacy',
    awayTeamId: 'union-omaha'
  },
  {
    id: 'fix_8',
    league: 'U.S. Open Cup (Cup Tie)',
    gender: 'mens',
    kickoff: '2026-11-02T19:00:00-05:00',
    venue: 'Boxer Stadium, San Francisco, CA',
    homeTeamId: 'el-farolito',
    awayTeamId: 'rhode-island-fc'
  }
];

// ============================================================================
// 3. COMPLETED MATCHES & HISTORICAL ACCURACY LOG
// ============================================================================
const COMPLETED_MATCHES = [
  {
    id: 'comp_1',
    date: '2026-10-25',
    league: 'MLS',
    homeTeam: 'Inter Miami CF',
    awayTeam: 'LAFC',
    actualScore: '3 - 1',
    actualOutcome: 'HOME',
    modelPick: 'HOME',
    modelConfidence: 62.4,
    projXG: '2.10 - 1.35',
    actualXGTotal: '2.05 - 1.20',
    xgMAE: 0.10,
    isCorrect: true,
    ou25Pick: 'OVER',
    ou25Actual: 'OVER',
    isOUCorrect: true
  },
  {
    id: 'comp_2',
    date: '2026-10-25',
    league: 'NWSL',
    homeTeam: 'Orlando Pride',
    awayTeam: 'NJ/NY Gotham FC',
    actualScore: '2 - 0',
    actualOutcome: 'HOME',
    modelPick: 'HOME',
    modelConfidence: 58.1,
    projXG: '1.85 - 1.10',
    actualXGTotal: '1.90 - 0.95',
    xgMAE: 0.10,
    isCorrect: true,
    ou25Pick: 'OVER',
    ou25Actual: 'UNDER',
    isOUCorrect: false
  },
  {
    id: 'comp_3',
    date: '2026-10-24',
    league: 'USL Championship',
    homeTeam: 'Louisville City FC',
    awayTeam: 'Rhode Island FC',
    actualScore: '2 - 2',
    actualOutcome: 'DRAW',
    modelPick: 'HOME',
    modelConfidence: 54.0,
    projXG: '1.70 - 1.15',
    actualXGTotal: '1.65 - 1.80',
    xgMAE: 0.35,
    isCorrect: false,
    ou25Pick: 'OVER',
    ou25Actual: 'OVER',
    isOUCorrect: true
  },
  {
    id: 'comp_4',
    date: '2026-10-24',
    league: 'MLS',
    homeTeam: 'Columbus Crew',
    awayTeam: 'FC Cincinnati',
    actualScore: '2 - 1',
    actualOutcome: 'HOME',
    modelPick: 'HOME',
    modelConfidence: 56.8,
    projXG: '1.75 - 1.25',
    actualXGTotal: '1.80 - 1.10',
    xgMAE: 0.10,
    isCorrect: true,
    ou25Pick: 'OVER',
    ou25Actual: 'OVER',
    isOUCorrect: true
  },
  {
    id: 'comp_5',
    date: '2026-10-23',
    league: 'NWSL',
    homeTeam: 'Washington Spirit',
    awayTeam: 'NC Courage',
    actualScore: '1 - 0',
    actualOutcome: 'HOME',
    modelPick: 'HOME',
    modelConfidence: 51.5,
    projXG: '1.45 - 1.20',
    actualXGTotal: '1.30 - 1.05',
    xgMAE: 0.15,
    isCorrect: true,
    ou25Pick: 'UNDER',
    ou25Actual: 'UNDER',
    isOUCorrect: true
  },
  {
    id: 'comp_6',
    date: '2026-10-22',
    league: 'USL Super League',
    homeTeam: 'Carolina Ascent FC',
    awayTeam: 'Tampa Bay Sun FC',
    actualScore: '1 - 2',
    actualOutcome: 'AWAY',
    modelPick: 'HOME',
    modelConfidence: 48.0,
    projXG: '1.40 - 1.20',
    actualXGTotal: '1.15 - 1.60',
    xgMAE: 0.33,
    isCorrect: false,
    ou25Pick: 'UNDER',
    ou25Actual: 'OVER',
    isOUCorrect: false
  },
  {
    id: 'comp_7',
    date: '2026-10-21',
    league: 'USL Championship',
    homeTeam: 'Sacramento Republic FC',
    awayTeam: 'Colorado Springs',
    actualScore: '3 - 0',
    actualOutcome: 'HOME',
    modelPick: 'HOME',
    modelConfidence: 61.2,
    projXG: '1.95 - 0.90',
    actualXGTotal: '2.10 - 0.70',
    xgMAE: 0.18,
    isCorrect: true,
    ou25Pick: 'OVER',
    ou25Actual: 'OVER',
    isOUCorrect: true
  },
  {
    id: 'comp_8',
    date: '2026-10-20',
    league: 'MLS NEXT Pro',
    homeTeam: 'Crown Legacy FC',
    awayTeam: 'Chattanooga FC',
    actualScore: '2 - 0',
    actualOutcome: 'HOME',
    modelPick: 'HOME',
    modelConfidence: 59.0,
    projXG: '1.60 - 0.95',
    actualXGTotal: '1.75 - 0.80',
    xgMAE: 0.15,
    isCorrect: true,
    ou25Pick: 'UNDER',
    ou25Actual: 'UNDER',
    isOUCorrect: true
  },
  {
    id: 'comp_9',
    date: '2026-10-19',
    league: 'U.S. Open Cup',
    homeTeam: 'El Farolito FC',
    awayTeam: 'Union Omaha',
    actualScore: '1 - 2',
    actualOutcome: 'AWAY',
    modelPick: 'AWAY',
    modelConfidence: 66.5,
    projXG: '0.90 - 1.85',
    actualXGTotal: '1.05 - 1.95',
    xgMAE: 0.13,
    isCorrect: true,
    ou25Pick: 'OVER',
    ou25Actual: 'OVER',
    isOUCorrect: true
  },
  {
    id: 'comp_10',
    date: '2026-10-18',
    league: 'MLS',
    homeTeam: 'LAFC',
    awayTeam: 'Seattle Sounders',
    actualScore: '2 - 1',
    actualOutcome: 'HOME',
    modelPick: 'HOME',
    modelConfidence: 55.4,
    projXG: '1.65 - 1.20',
    actualXGTotal: '1.70 - 1.15',
    xgMAE: 0.05,
    isCorrect: true,
    ou25Pick: 'OVER',
    ou25Actual: 'OVER',
    isOUCorrect: true
  },
  {
    id: 'comp_11',
    date: '2026-10-17',
    league: 'NWSL',
    homeTeam: 'Portland Thorns',
    awayTeam: 'Orlando Pride',
    actualScore: '1 - 1',
    actualOutcome: 'DRAW',
    modelPick: 'AWAY',
    modelConfidence: 52.0,
    projXG: '1.15 - 1.55',
    actualXGTotal: '1.30 - 1.40',
    xgMAE: 0.15,
    isCorrect: false,
    ou25Pick: 'UNDER',
    ou25Actual: 'UNDER',
    isOUCorrect: true
  },
  {
    id: 'comp_12',
    date: '2026-10-16',
    league: 'USL Championship',
    homeTeam: 'Orange County SC',
    awayTeam: 'Sacramento Republic',
    actualScore: '0 - 1',
    actualOutcome: 'AWAY',
    modelPick: 'AWAY',
    modelConfidence: 57.8,
    projXG: '1.05 - 1.50',
    actualXGTotal: '0.90 - 1.40',
    xgMAE: 0.12,
    isCorrect: true,
    ou25Pick: 'UNDER',
    ou25Actual: 'UNDER',
    isOUCorrect: true
  },
  {
    id: 'comp_13',
    date: '2026-10-15',
    league: 'MLS',
    homeTeam: 'Real Salt Lake',
    awayTeam: 'Houston Dynamo',
    actualScore: '1 - 0',
    actualOutcome: 'HOME',
    modelPick: 'HOME',
    modelConfidence: 53.2,
    projXG: '1.40 - 1.10',
    actualXGTotal: '1.35 - 0.85',
    xgMAE: 0.15,
    isCorrect: true,
    ou25Pick: 'UNDER',
    ou25Actual: 'UNDER',
    isOUCorrect: true
  },
  {
    id: 'comp_14',
    date: '2026-10-14',
    league: 'NWSL',
    homeTeam: 'San Diego Wave',
    awayTeam: 'Washington Spirit',
    actualScore: '0 - 2',
    actualOutcome: 'AWAY',
    modelPick: 'AWAY',
    modelConfidence: 60.1,
    projXG: '0.95 - 1.70',
    actualXGTotal: '0.80 - 1.85',
    xgMAE: 0.15,
    isCorrect: true,
    ou25Pick: 'OVER',
    ou25Actual: 'UNDER',
    isOUCorrect: false
  },
  {
    id: 'comp_15',
    date: '2026-10-13',
    league: 'USL League One',
    homeTeam: 'Forward Madison',
    awayTeam: 'Union Omaha',
    actualScore: '1 - 1',
    actualOutcome: 'DRAW',
    modelPick: 'DRAW',
    modelConfidence: 34.5,
    projXG: '1.25 - 1.30',
    actualXGTotal: '1.20 - 1.25',
    xgMAE: 0.05,
    isCorrect: true,
    ou25Pick: 'UNDER',
    ou25Actual: 'UNDER',
    isOUCorrect: true
  },
  {
    id: 'comp_16',
    date: '2026-10-12',
    league: 'MLS NEXT Pro',
    homeTeam: 'NYRB II',
    awayTeam: 'Crown Legacy FC',
    actualScore: '3 - 2',
    actualOutcome: 'HOME',
    modelPick: 'AWAY',
    modelConfidence: 49.0,
    projXG: '1.40 - 1.55',
    actualXGTotal: '2.10 - 1.80',
    xgMAE: 0.48,
    isCorrect: false,
    ou25Pick: 'OVER',
    ou25Actual: 'OVER',
    isOUCorrect: true
  },
  {
    id: 'comp_17',
    date: '2026-10-11',
    league: 'MLS',
    homeTeam: 'Minnesota United',
    awayTeam: 'Colorado Rapids',
    actualScore: '3 - 0',
    actualOutcome: 'HOME',
    modelPick: 'HOME',
    modelConfidence: 64.2,
    projXG: '1.95 - 0.90',
    actualXGTotal: '2.40 - 0.60',
    xgMAE: 0.22,
    isCorrect: true,
    ou25Pick: 'OVER',
    ou25Actual: 'OVER',
    isOUCorrect: true
  },
  {
    id: 'comp_18',
    date: '2026-10-10',
    league: 'USL Super League',
    homeTeam: 'Brooklyn FC (Women)',
    awayTeam: 'Lexington SC',
    actualScore: '2 - 0',
    actualOutcome: 'HOME',
    modelPick: 'HOME',
    modelConfidence: 57.5,
    projXG: '1.65 - 0.90',
    actualXGTotal: '1.75 - 0.70',
    xgMAE: 0.15,
    isCorrect: true,
    ou25Pick: 'UNDER',
    ou25Actual: 'UNDER',
    isOUCorrect: true
  },
  {
    id: 'comp_19',
    date: '2026-10-09',
    league: 'USL Championship',
    homeTeam: 'Charleston Battery',
    awayTeam: 'Tampa Bay Rowdies',
    actualScore: '1 - 2',
    actualOutcome: 'AWAY',
    modelPick: 'HOME',
    modelConfidence: 53.0,
    projXG: '1.50 - 1.25',
    actualXGTotal: '1.30 - 1.70',
    xgMAE: 0.32,
    isCorrect: false,
    ou25Pick: 'OVER',
    ou25Actual: 'OVER',
    isOUCorrect: true
  }
];

// Rolling Model Accuracy Trend Data
const ACCURACY_TREND_DATA = [
  { matchday: 'Matchday 1', accuracyPct: 66.7, xgMAE: 0.45, ouAccuracyPct: 71.0 },
  { matchday: 'Matchday 2', accuracyPct: 70.0, xgMAE: 0.38, ouAccuracyPct: 73.5 },
  { matchday: 'Matchday 3', accuracyPct: 72.4, xgMAE: 0.32, ouAccuracyPct: 75.0 },
  { matchday: 'Matchday 4', accuracyPct: 71.8, xgMAE: 0.28, ouAccuracyPct: 76.2 },
  { matchday: 'Matchday 5', accuracyPct: 73.7, xgMAE: 0.21, ouAccuracyPct: 78.9 }
];

// ============================================================================
// 4. MATH & MONTE CARLO ODDS CALCULATION FUNCTIONS
// ============================================================================
function calculateCompositeRating(team, homeAdvantage = 0, formDelta = 0) {
  if (!team) return 1200;
  const valScore = Math.log10(Math.max(team.squadValue || 500000, 20000)) * 175;
  const eloScore = (team.elo || 1200) + homeAdvantage;
  const formScore = (((team.avgFotmob || 6.5) + formDelta) - 6.0) * 125;
  
  return (0.45 * eloScore) + (0.35 * valScore) + (0.20 * formScore);
}

function calculateMatchXG(homeRating, awayRating) {
  const diff = homeRating - awayRating;
  const baseAvgXG = 1.42;
  const homeXG = Math.max(0.15, baseAvgXG + (diff / 350.0));
  const awayXG = Math.max(0.15, baseAvgXG - (diff / 350.0));
  return { homeXG: Number(homeXG.toFixed(2)), awayXG: Number(awayXG.toFixed(2)) };
}

function samplePoisson(lambda) {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1.0;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return Math.max(0, k - 1);
}

function probToAmericanOdds(prob) {
  if (prob <= 0) return '+9900';
  if (prob >= 1) return '-9900';
  if (prob === 0.5) return '+100';
  if (prob > 0.5) {
    const american = Math.round((prob / (1 - prob)) * -100);
    return `${american}`;
  } else {
    const american = Math.round(((1 - prob) / prob) * 100);
    return `+${american}`;
  }
}

function probToDecimalOdds(prob) {
  if (prob <= 0) return '99.00';
  return (1 / prob).toFixed(2);
}

function runMonteCarloMatch(homeTeam, awayTeam, options = {}) {
  const { iterations = 2500, homeAdv = 35, homeForm = 0, awayForm = 0 } = options;
  const homeRating = calculateCompositeRating(homeTeam, homeAdv, homeForm);
  const awayRating = calculateCompositeRating(awayTeam, 0, awayForm);
  const xG = calculateMatchXG(homeRating, awayRating);

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let homeAdvancements = 0;
  let awayAdvancements = 0;
  let over1_5 = 0;
  let over2_5 = 0;
  let over3_5 = 0;
  let btts = 0;

  const scoreMap = {};

  for (let i = 0; i < iterations; i++) {
    const gHome = samplePoisson(xG.homeXG);
    const gAway = samplePoisson(xG.awayXG);

    if (gHome > gAway) {
      homeWins++;
      homeAdvancements++;
    } else if (gAway > gHome) {
      awayWins++;
      awayAdvancements++;
    } else {
      draws++;
      const etHome = samplePoisson(xG.homeXG * 0.33);
      const etAway = samplePoisson(xG.awayXG * 0.33);
      if (gHome + etHome > gAway + etAway) {
        homeAdvancements++;
      } else if (gAway + etAway > gHome + etHome) {
        awayAdvancements++;
      } else {
        const pkProb = 0.50 + ((homeRating - awayRating) / 1000.0);
        if (Math.random() < Math.max(0.35, Math.min(0.65, pkProb))) {
          homeAdvancements++;
        } else {
          awayAdvancements++;
        }
      }
    }

    const totalGoals = gHome + gAway;
    if (totalGoals > 1.5) over1_5++;
    if (totalGoals > 2.5) over2_5++;
    if (totalGoals > 3.5) over3_5++;

    if (gHome > 0 && gAway > 0) btts++;

    const key = `${gHome}-${gAway}`;
    scoreMap[key] = (scoreMap[key] || 0) + 1;
  }

  const pHome = homeWins / iterations;
  const pDraw = draws / iterations;
  const pAway = awayWins / iterations;
  const pHomeAdv = homeAdvancements / iterations;
  const pAwayAdv = awayAdvancements / iterations;

  const pOver15 = over1_5 / iterations;
  const pOver25 = over2_5 / iterations;
  const pOver35 = over3_5 / iterations;
  const pBTTS = btts / iterations;

  const topScorelines = Object.entries(scoreMap)
    .map(([score, count]) => ({ score, pct: Number(((count / iterations) * 100).toFixed(1)) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 6);

  return {
    iterations,
    homeTeam,
    awayTeam,
    xG,
    pHome,
    pDraw,
    pAway,
    pHomeAdv,
    pAwayAdv,
    oddsHome: { american: probToAmericanOdds(pHome), decimal: probToDecimalOdds(pHome) },
    oddsDraw: { american: probToAmericanOdds(pDraw), decimal: probToDecimalOdds(pDraw) },
    oddsAway: { american: probToAmericanOdds(pAway), decimal: probToDecimalOdds(pAway) },
    oddsHomeAdv: { american: probToAmericanOdds(pHomeAdv), decimal: probToDecimalOdds(pHomeAdv) },
    oddsAwayAdv: { american: probToAmericanOdds(pAwayAdv), decimal: probToDecimalOdds(pAwayAdv) },
    pOver15,
    pOver25,
    pOver35,
    pBTTS,
    oddsOver25: { american: probToAmericanOdds(pOver25), decimal: probToDecimalOdds(pOver25) },
    oddsUnder25: { american: probToAmericanOdds(1 - pOver25), decimal: probToDecimalOdds(1 - pOver25) },
    oddsBTTSYes: { american: probToAmericanOdds(pBTTS), decimal: probToDecimalOdds(pBTTS) },
    oddsBTTSNo: { american: probToAmericanOdds(1 - pBTTS), decimal: probToDecimalOdds(1 - pBTTS) },
    topScorelines
  };
}

// Clipboard copier helper
const copyTextToClipboard = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch (err) {
    console.error('Copy fallback error:', err);
  }
  document.body.removeChild(textArea);
  return success;
};

// File Downloader helper
const downloadFile = (filename, content, mimeType = 'text/csv') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ============================================================================
// 5. MAIN WEB APP COMPONENT
// ============================================================================
export default function App() {
  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState('slate'); // 'slate' | 'accuracy' | 'h2h' | 'customTeam' | 'rosters'
  const [leagueFilter, setLeagueFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [completedFilterLeague, setCompletedFilterLeague] = useState('ALL');
  const [completedFilterStatus, setCompletedFilterStatus] = useState('ALL');

  // Database Teams & Schedule Fixtures
  const [teamsList, setTeamsList] = useState(INITIAL_TEAMS);
  const [fixturesList, setFixturesList] = useState(INITIAL_SCHEDULE_FIXTURES);

  // Selected Fixture Detail Modal State
  const [selectedFixtureModal, setSelectedFixtureModal] = useState(null);

  // Head to Head Interactive Simulator States
  const [h2hHomeId, setH2hHomeId] = useState('inter-miami');
  const [h2hAwayId, setH2hAwayId] = useState('columbus-crew');
  const [h2hAdvantage, setH2hAdvantage] = useState(35);
  const [h2hIsNeutral, setH2hIsNeutral] = useState(false);
  const [h2hSimCount, setH2hSimCount] = useState(2500);
  const [h2hResult, setH2hResult] = useState(null);

  // Custom Local Amateur Team Creator Form
  const [newTeam, setNewTeam] = useState({
    name: '',
    gender: 'mens',
    league: 'UPSL Premier',
    elo: 1080,
    squadValue: 150000,
    avgFotmob: 6.45,
    players: [
      { name: 'Local Captain', pos: 'ST', val: 35000, rating: 6.8 },
      { name: 'Midfield Playmaker', pos: 'CM', val: 20000, rating: 6.5 }
    ]
  });

  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Model Overall Accuracy Calculation Metrics
  const accuracyStats = useMemo(() => {
    const total = COMPLETED_MATCHES.length;
    const correctPicks = COMPLETED_MATCHES.filter(m => m.isCorrect).length;
    const correctOU = COMPLETED_MATCHES.filter(m => m.isOUCorrect).length;
    const winRatePct = ((correctPicks / total) * 100).toFixed(1);
    const ouAccuracyPct = ((correctOU / total) * 100).toFixed(1);
    
    // Calculate Mean Absolute Error (MAE) for xG
    const totalMae = COMPLETED_MATCHES.reduce((acc, m) => acc + (m.xgMAE || 0.2), 0);
    const avgMae = (totalMae / total).toFixed(2);

    return {
      total,
      correctPicks,
      winRatePct,
      ouAccuracyPct,
      avgMae
    };
  }, []);

  // Filtered Completed Matches
  const filteredCompletedMatches = useMemo(() => {
    return COMPLETED_MATCHES.filter(m => {
      const matchLeague = completedFilterLeague === 'ALL' || m.league === completedFilterLeague;
      const matchStatus = completedFilterStatus === 'ALL' || 
        (completedFilterStatus === 'CORRECT' && m.isCorrect) ||
        (completedFilterStatus === 'MISSED' && !m.isCorrect);
      return matchLeague && matchStatus;
    });
  }, [completedFilterLeague, completedFilterStatus]);

  // Compute Live Fixtures Slate with Monte Carlo Odds
  const liveSlateFixtures = useMemo(() => {
    const teamMap = {};
    teamsList.forEach(t => { teamMap[t.id] = t; });

    return fixturesList.map(fix => {
      const home = teamMap[fix.homeTeamId] || teamsList[0];
      const away = teamMap[fix.awayTeamId] || teamsList[1];
      const odds = runMonteCarloMatch(home, away, { iterations: 1500, homeAdv: 35 });
      return {
        ...fix,
        homeTeam: home,
        awayTeam: away,
        odds
      };
    });
  }, [fixturesList, teamsList]);

  // Filtered Fixtures for Display
  const filteredSlateFixtures = useMemo(() => {
    return liveSlateFixtures.filter(f => {
      const matchLeague = leagueFilter === 'ALL' || f.league === leagueFilter;
      const matchGender = genderFilter === 'ALL' || f.gender === genderFilter;
      return matchLeague && matchGender;
    });
  }, [liveSlateFixtures, leagueFilter, genderFilter]);

  // Active H2H Team Objects
  const h2hHomeTeam = useMemo(() => teamsList.find(t => t.id === h2hHomeId) || teamsList[0], [h2hHomeId, teamsList]);
  const h2hAwayTeam = useMemo(() => teamsList.find(t => t.id === h2hAwayId) || teamsList[1], [h2hAwayId, teamsList]);

  // Run Head-to-Head Simulation
  const handleRunH2H = useCallback(() => {
    const res = runMonteCarloMatch(h2hHomeTeam, h2hAwayTeam, {
      iterations: h2hSimCount,
      homeAdv: h2hIsNeutral ? 0 : h2hAdvantage
    });
    setH2hResult(res);
  }, [h2hHomeTeam, h2hAwayTeam, h2hSimCount, h2hIsNeutral, h2hAdvantage]);

  useEffect(() => {
    if (activeTab === 'h2h' && !h2hResult) {
      handleRunH2H();
    }
  }, [activeTab, h2hResult, handleRunH2H]);

  // Export Full Schedule Slate as CSV
  const exportSlateCSV = () => {
    let csv = `US SOCCER MATCHDAY BETTING ODDS SLATE\n`;
    csv += `Export Date,${new Date().toLocaleString()}\n`;
    csv += `Total Fixtures,${filteredSlateFixtures.length}\n\n`;
    csv += `League,Kickoff Time,Home Team,Away Team,xG Line,Home Win %,Draw %,Away Win %,Home Odds (US),Draw Odds (US),Away Odds (US),O/U 2.5 Line,BTTS Yes Line\n`;

    filteredSlateFixtures.forEach(f => {
      const o = f.odds;
      csv += `"${f.league}","${new Date(f.kickoff).toLocaleString()}","${f.homeTeam.name}","${f.awayTeam.name}",${o.xG.homeXG}-${o.xG.awayXG},${(o.pHome*100).toFixed(1)}%,${(o.pDraw*100).toFixed(1)}%,${(o.pAway*100).toFixed(1)}%,${o.oddsHome.american},${o.oddsDraw.american},${o.oddsAway.american},${o.oddsOver25.american},${o.oddsBTTSYes.american}\n`;
    });

    downloadFile(`US_Soccer_Matchday_Odds_Slate.csv`, csv);
    showToast('Matchday betting slate exported to CSV!');
  };

  // Copy Formatted Odds Report
  const copySlateOddsReport = () => {
    let report = `⚽ **US SOCCER MATCHDAY BETTING ODDS SLATE**\n`;
    report += `📅 Date: ${new Date().toLocaleDateString()}\n\n`;

    filteredSlateFixtures.forEach((f) => {
      const o = f.odds;
      report += `**[${f.league}] ${f.homeTeam.name} vs ${f.awayTeam.name}**\n`;
      report += `• Projected xG: ${f.homeTeam.name} (${o.xG.homeXG}) - (${o.xG.awayXG}) ${f.awayTeam.name}\n`;
      report += `• Moneyline: Home ${o.oddsHome.american} | Draw ${o.oddsDraw.american} | Away ${o.oddsAway.american}\n`;
      report += `• Goal Line: Over 2.5 (${o.oddsOver25.american}) | BTTS Yes (${o.oddsBTTSYes.american})\n\n`;
    });

    copyTextToClipboard(report);
    showToast('Matchday odds slate report copied to clipboard!');
  };

  // Handle Custom Team Creation
  const handleCreateCustomTeam = (e) => {
    e.preventDefault();
    if (!newTeam.name.trim()) return;

    const teamId = `custom-${Date.now()}`;
    const createdTeam = {
      id: teamId,
      name: newTeam.name,
      gender: newTeam.gender,
      league: newTeam.league,
      tier: 4,
      badgeColor: '#C8102E',
      elo: Number(newTeam.elo),
      squadValue: Number(newTeam.squadValue),
      avgFotmob: Number(newTeam.avgFotmob),
      isIndependent: true,
      isAmateur: true,
      squad: newTeam.players
    };

    setTeamsList(prev => [...prev, createdTeam]);

    const newFix = {
      id: `fix_custom_${Date.now()}`,
      league: `${newTeam.league} Showcase`,
      gender: newTeam.gender,
      kickoff: new Date(Date.now() + 86400000 * 2).toISOString(),
      venue: 'Local Community Complex',
      homeTeamId: teamId,
      awayTeamId: newTeam.gender === 'mens' ? 'louisville-city' : 'carolina-ascent'
    };

    setFixturesList(prev => [newFix, ...prev]);
    showToast(`Custom team "${newTeam.name}" created and loaded into matchday fixtures!`);
    setActiveTab('slate');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col selection:bg-[#C8102E] selection:text-white">
      
      {/* TOAST POPUP */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0C2340] text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-red-500/40 flex items-center gap-2.5 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR - OFFICIAL US SOCCER FEDERATION BRANDING */}
      <header className="bg-[#0C2340] border-b-4 border-[#C8102E] text-white shadow-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Dynamic Accuracy Pill */}
          <div className="flex items-center gap-3">
            <div className="bg-[#C8102E] p-2 rounded-xl shadow-inner border border-white/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight uppercase font-mono">
                  U.S. SOCCER ODDS SIMULATOR
                </h1>
                
                {/* TOP HEADER ACCURACY PILL */}
                <button
                  onClick={() => setActiveTab('accuracy')}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  title="Click to view full Model Accuracy & Calibration Tracker"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{accuracyStats.winRatePct}% Pick Accuracy</span>
                  <span className="text-emerald-200/60">({accuracyStats.correctPicks}/{accuracyStats.total})</span>
                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                </button>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Monte Carlo Betting Lines & Verified Matchday Precision Tracker
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex bg-slate-900/90 p-1.5 rounded-xl border border-white/10 text-xs font-bold">
            <button
              onClick={() => setActiveTab('slate')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                activeTab === 'slate' ? 'bg-[#C8102E] text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Matchday Slate
            </button>
            <button
              onClick={() => setActiveTab('accuracy')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                activeTab === 'accuracy' ? 'bg-[#C8102E] text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Target className="w-4 h-4 text-emerald-400" />
              Accuracy Tracker
            </button>
            <button
              onClick={() => setActiveTab('h2h')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                activeTab === 'h2h' ? 'bg-[#C8102E] text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              H2H Simulator
            </button>
            <button
              onClick={() => setActiveTab('customTeam')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                activeTab === 'customTeam' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md' : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Add Local Team
            </button>
          </nav>

        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* =================================================================== */}
        {/* TAB 1: LIVE MATCHDAY SCHEDULE & BETTING ODDS SLATE */}
        {/* =================================================================== */}
        {activeTab === 'slate' && (
          <div className="space-y-6">

            {/* LEAGUE & GENDER FILTER BAR */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Gender Filter Pills */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setGenderFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${genderFilter === 'ALL' ? 'bg-[#0C2340] text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  All Divisions
                </button>
                <button
                  onClick={() => setGenderFilter('mens')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${genderFilter === 'mens' ? 'bg-[#C8102E] text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Men's (MLS/USL)
                </button>
                <button
                  onClick={() => setGenderFilter('womens')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${genderFilter === 'womens' ? 'bg-[#C8102E] text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Women's (NWSL/USL SL)
                </button>
              </div>

              {/* League Selector Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                {['ALL', 'MLS', 'USL Championship', 'USL League One', 'MLS NEXT Pro', 'NWSL', 'USL Super League'].map((league) => (
                  <button
                    key={league}
                    onClick={() => setLeagueFilter(league)}
                    className={`px-3 py-1.5 rounded-lg border transition-all ${
                      leagueFilter === league
                        ? 'bg-[#0C2340] text-white border-[#0C2340]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {league === 'USL Championship' ? 'USLC' : league === 'USL League One' ? 'USL1' : league}
                  </button>
                ))}
              </div>

              {/* Export Slate Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={exportSlateCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-all"
                  title="Export Slate to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </button>
                <button
                  onClick={copySlateOddsReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0C2340] hover:bg-[#16355d] text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                  title="Copy Social Media Summary"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Report
                </button>
              </div>

            </div>

            {/* FIXTURE ODDS SLATE TABLE */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#C8102E]" />
                  <h2 className="font-black text-sm text-[#0C2340] uppercase tracking-wide">
                    Upcoming Scheduled Matchday Odds ({filteredSlateFixtures.length} Fixtures)
                  </h2>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  Monte Carlo Sample: 1,500 Runs / Match
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredSlateFixtures.map((fix) => {
                  const o = fix.odds;
                  return (
                    <div
                      key={fix.id}
                      onClick={() => setSelectedFixtureModal(fix)}
                      className="p-4 hover:bg-slate-50/80 transition-all cursor-pointer flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                    >
                      {/* Left: Kickoff & League Badge */}
                      <div className="min-w-[180px] space-y-1">
                        <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {fix.league}
                        </span>
                        <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(fix.kickoff).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <span className="text-[10px] text-slate-400 truncate block max-w-[170px]">
                          {fix.venue}
                        </span>
                      </div>

                      {/* Middle: Matchup & Projected xG */}
                      <div className="flex-1 flex items-center justify-between lg:justify-around gap-4 w-full lg:w-auto">
                        {/* Home Team */}
                        <div className="text-right flex-1">
                          <span className="font-extrabold text-sm text-slate-900 block flex items-center justify-end gap-2">
                            {fix.homeTeam.name}
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: fix.homeTeam.badgeColor || '#0C2340' }} />
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Elo: {fix.homeTeam.elo} | ${(fix.homeTeam.squadValue / 1000000).toFixed(1)}M
                          </span>
                        </div>

                        {/* Projected xG Line Badge */}
                        <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-center shadow-inner flex-shrink-0">
                          <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 block">
                            PROJ. xG
                          </span>
                          <span className="text-sm font-black font-mono tracking-tight text-amber-400">
                            {o.xG.homeXG} - {o.xG.awayXG}
                          </span>
                        </div>

                        {/* Away Team */}
                        <div className="text-left flex-1">
                          <span className="font-extrabold text-sm text-slate-900 block flex items-center justify-start gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: fix.awayTeam.badgeColor || '#0C2340' }} />
                            {fix.awayTeam.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Elo: {fix.awayTeam.elo} | ${(fix.awayTeam.squadValue / 1000000).toFixed(1)}M
                          </span>
                        </div>
                      </div>

                      {/* Right: Betting Markets */}
                      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-mono">
                          <div className="px-2 py-1 text-center border-r border-slate-200">
                            <span className="text-[9px] text-slate-400 block font-sans">HOME</span>
                            <span className="font-extrabold text-[#0C2340]">{o.oddsHome.american}</span>
                          </div>
                          <div className="px-2 py-1 text-center border-r border-slate-200">
                            <span className="text-[9px] text-slate-400 block font-sans">DRAW</span>
                            <span className="font-extrabold text-slate-700">{o.oddsDraw.american}</span>
                          </div>
                          <div className="px-2 py-1 text-center">
                            <span className="text-[9px] text-slate-400 block font-sans">AWAY</span>
                            <span className="font-extrabold text-[#C8102E]">{o.oddsAway.american}</span>
                          </div>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl text-xs font-mono text-center">
                          <span className="text-[9px] text-emerald-700 block font-sans font-bold">O/U 2.5</span>
                          <span className="font-bold text-emerald-900">{o.oddsOver25.american}</span>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl text-xs font-mono text-center">
                          <span className="text-[9px] text-blue-700 block font-sans font-bold">BTTS YES</span>
                          <span className="font-bold text-blue-900">{o.oddsBTTSYes.american}</span>
                        </div>

                        <ChevronRight className="w-5 h-5 text-slate-400 hidden lg:block" />
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: MODEL ACCURACY & PERFORMANCE TRACKER (NEW SYSTEM) */}
        {/* =================================================================== */}
        {activeTab === 'accuracy' && (
          <div className="space-y-6">

            {/* OVERVIEW METRIC KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Moneyline Pick Win Rate */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Moneyline Win Rate</span>
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                    <Target className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#0C2340] font-mono">{accuracyStats.winRatePct}%</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    +{accuracyStats.correctPicks}/{accuracyStats.total} Wins
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Match result winner predictions verified against actual final scorelines.</p>
              </div>

              {/* Card 2: xG Mean Absolute Error */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">xG Margin Error (MAE)</span>
                  <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                    <Gauge className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#0C2340] font-mono">±{accuracyStats.avgMae}</span>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Goals / Match</span>
                </div>
                <p className="text-[11px] text-slate-400">Average goal variance between pre-match expected goals and actual scores.</p>
              </div>

              {/* Card 3: Over/Under 2.5 Precision */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Over/Under 2.5 Accuracy</span>
                  <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                    <Percent className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#0C2340] font-mono">{accuracyStats.ouAccuracyPct}%</span>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Optimal Line</span>
                </div>
                <p className="text-[11px] text-slate-400">Precision in forecasting total goal totals exceeding 2.5 threshold.</p>
              </div>

              {/* Card 4: Model Calibration Badge */}
              <div className="bg-[#0C2340] text-white border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Model Status</span>
                  <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-emerald-400 font-mono uppercase tracking-wide">HIGHLY CALIBRATED</span>
                </div>
                <p className="text-[11px] text-slate-300">Statistical reliability index verified across 5 matchday slates.</p>
              </div>

            </div>

            {/* ROLLING ACCURACY TREND CHART */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-black text-sm text-[#0C2340] uppercase tracking-wide flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#C8102E]" />
                    Model Accuracy & Goal Variance Trend (Matchday 1 to 5)
                  </h3>
                  <p className="text-xs text-slate-500">Tracking pick win rate improvement alongside reduction in xG margin error.</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  +7.0% Accuracy Growth
                </span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ACCURACY_TREND_DATA}>
                    <defs>
                      <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="matchday" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                    <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
                    <Area type="monotone" dataKey="accuracyPct" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorAcc)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* COMPLETED MATCH LOG TABLE WITH FILTERS */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-4 p-5">
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-black text-sm text-[#0C2340] uppercase tracking-wide flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#C8102E]" />
                    Historical Completed Match Results & Pick Verification Log
                  </h3>
                  <p className="text-xs text-slate-500">Comparing pre-match model probabilities and xG projections against official match outcomes.</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  {/* Status Filter */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setCompletedFilterStatus('ALL')}
                      className={`px-3 py-1 rounded-lg transition ${completedFilterStatus === 'ALL' ? 'bg-[#0C2340] text-white' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      All Picks ({COMPLETED_MATCHES.length})
                    </button>
                    <button
                      onClick={() => setCompletedFilterStatus('CORRECT')}
                      className={`px-3 py-1 rounded-lg transition ${completedFilterStatus === 'CORRECT' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Correct ({accuracyStats.correctPicks})
                    </button>
                    <button
                      onClick={() => setCompletedFilterStatus('MISSED')}
                      className={`px-3 py-1 rounded-lg transition ${completedFilterStatus === 'MISSED' ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Missed ({accuracyStats.total - accuracyStats.correctPicks})
                    </button>
                  </div>

                  {/* League Filter */}
                  <select
                    value={completedFilterLeague}
                    onChange={(e) => setCompletedFilterLeague(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-xl p-1.5 text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="ALL">All Leagues</option>
                    <option value="MLS">MLS</option>
                    <option value="USL Championship">USL Championship</option>
                    <option value="USL League One">USL League One</option>
                    <option value="MLS NEXT Pro">MLS NEXT Pro</option>
                    <option value="NWSL">NWSL</option>
                    <option value="USL Super League">USL Super League</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-[11px] uppercase font-bold border-b border-slate-200">
                      <th className="p-3">Match Date</th>
                      <th className="p-3">League</th>
                      <th className="p-3">Fixture Matchup</th>
                      <th className="p-3 text-center">Actual Score</th>
                      <th className="p-3 text-center">Model Pick (Conf. %)</th>
                      <th className="p-3 text-center">Proj. xG vs Actual xG</th>
                      <th className="p-3 text-right">Verification Badge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredCompletedMatches.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-mono text-slate-500">{m.date}</td>
                        <td className="p-3 font-bold text-[#0C2340]">
                          <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px]">
                            {m.league}
                          </span>
                        </td>
                        <td className="p-3 font-extrabold text-slate-900">
                          {m.homeTeam} <span className="text-slate-400 font-normal">vs</span> {m.awayTeam}
                        </td>
                        <td className="p-3 text-center font-black font-mono text-slate-900 bg-slate-50 rounded-lg">
                          {m.actualScore}
                        </td>
                        <td className="p-3 text-center font-mono">
                          <span className="font-bold text-slate-800">{m.modelPick} Pick</span>
                          <span className="text-[10px] text-slate-400 block">({m.modelConfidence}%)</span>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-600">
                          <span className="text-slate-800 font-bold">{m.projXG}</span>
                          <span className="text-[10px] text-slate-400 block">Act: {m.actualXGTotal}</span>
                        </td>
                        <td className="p-3 text-right">
                          {m.isCorrect ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-black uppercase">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              CORRECT PICK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full text-[10px] font-black uppercase">
                              <XCircle className="w-3 h-3 text-red-600" />
                              MISSED PICK
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: CUSTOM HEAD-TO-HEAD MATCHUP SIMULATOR */}
        {/* =================================================================== */}
        {activeTab === 'h2h' && (
          <div className="space-y-6">

            {/* H2H FIXTURE CONTROLS & SELECTION PANEL */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-black text-[#0C2340] uppercase tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#C8102E]" />
                  Custom Head-to-Head Monte Carlo Simulator
                </h2>
                <p className="text-xs text-slate-500">
                  Select any two clubs in the database to run high-precision Monte Carlo match simulations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Home Team Selector */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#0C2340] block">
                    HOME SIDE
                  </span>
                  <select
                    value={h2hHomeId}
                    onChange={(e) => setH2hHomeId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-sm text-slate-900 outline-none focus:border-[#C8102E]"
                  >
                    {teamsList.map(t => (
                      <option key={`h2h-h-${t.id}`} value={t.id}>
                        [{t.league}] {t.name} (Elo: {t.elo})
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span>Market Value: ${(h2hHomeTeam.squadValue / 1000000).toFixed(2)}M</span>
                    <span>FotMob: {h2hHomeTeam.avgFotmob}</span>
                  </div>
                </div>

                {/* Away Team Selector */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#0C2340] block">
                    AWAY SIDE
                  </span>
                  <select
                    value={h2hAwayId}
                    onChange={(e) => setH2hAwayId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-sm text-slate-900 outline-none focus:border-[#C8102E]"
                  >
                    {teamsList.map(t => (
                      <option key={`h2h-a-${t.id}`} value={t.id}>
                        [{t.league}] {t.name} (Elo: {t.elo})
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span>Market Value: ${(h2hAwayTeam.squadValue / 1000000).toFixed(2)}M</span>
                    <span>FotMob: {h2hAwayTeam.avgFotmob}</span>
                  </div>
                </div>
              </div>

              {/* Modifiers & Run Button */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Home Field Advantage (+{h2hAdvantage} Elo)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    disabled={h2hIsNeutral}
                    value={h2hAdvantage}
                    onChange={(e) => setH2hAdvantage(Number(e.target.value))}
                    className="w-full accent-[#C8102E] bg-slate-200 rounded cursor-pointer"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      id="neutralH2H"
                      checked={h2hIsNeutral}
                      onChange={(e) => setH2hIsNeutral(e.target.checked)}
                      className="accent-[#C8102E]"
                    />
                    <label htmlFor="neutralH2H" className="text-xs text-slate-600 font-medium cursor-pointer">
                      Neutral Venue (Cup Final)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Monte Carlo Iterations ({h2hSimCount.toLocaleString()})
                  </label>
                  <select
                    value={h2hSimCount}
                    onChange={(e) => setH2hSimCount(Number(e.target.value))}
                    className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value={1000}>1,000 Matches</option>
                    <option value={2500}>2,500 Matches</option>
                    <option value={5000}>5,000 Matches</option>
                    <option value={10000}>10,000 Matches</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleRunH2H}
                    className="w-full bg-[#C8102E] hover:bg-[#a00c24] text-white font-extrabold py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Calculate Match Odds
                  </button>
                </div>
              </div>
            </div>

            {/* H2H RESULTS DISPLAY */}
            {h2hResult && (
              <div className="space-y-6">

                {/* PROJECTED XG HEADER BANNER */}
                <div className="bg-[#0C2340] text-white rounded-2xl p-6 shadow-md border-b-4 border-[#C8102E] flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-slate-300 font-mono font-bold block">
                      SIMULATED PROJECTED XG SCORELINE
                    </span>
                    <h3 className="text-3xl font-black font-mono text-amber-400">
                      {h2hResult.xG.homeXG} - {h2hResult.xG.awayXG}
                    </h3>
                    <p className="text-xs text-slate-300">
                      Based on {h2hResult.iterations.toLocaleString()} Monte Carlo simulations.
                    </p>
                  </div>

                  {/* Probability Bar */}
                  <div className="w-full md:w-1/2 space-y-1 text-xs font-mono">
                    <div className="flex justify-between font-bold">
                      <span>{h2hHomeTeam.name} ({(h2hResult.pHome * 100).toFixed(1)}%)</span>
                      <span>Draw ({(h2hResult.pDraw * 100).toFixed(1)}%)</span>
                      <span>{h2hAwayTeam.name} ({(h2hResult.pAway * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex">
                      <div className="bg-[#0C2340] border-r border-white/20 h-full" style={{ width: `${h2hResult.pHome * 100}%` }} />
                      <div className="bg-slate-400 border-r border-white/20 h-full" style={{ width: `${h2hResult.pDraw * 100}%` }} />
                      <div className="bg-[#C8102E] h-full" style={{ width: `${h2hResult.pAway * 100}%` }} />
                    </div>
                  </div>
                </div>

                {/* SCORELINE FREQUENCY DISTRIBUTION CHART */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <h4 className="font-black text-xs text-[#0C2340] uppercase tracking-wider flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-[#C8102E]" />
                    Most Likely Exact Scorelines Distribution
                  </h4>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={h2hResult.topScorelines}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="score" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                        <YAxis tick={{ fontSize: 11 }} unit="%" />
                        <Tooltip formatter={(value) => [`${value}%`, 'Probability']} />
                        <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                          {h2hResult.topScorelines.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#C8102E' : '#0C2340'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: CUSTOM LOCAL AMATEUR TEAM CREATOR */}
        {/* =================================================================== */}
        {activeTab === 'customTeam' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-[#0C2340] uppercase tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Grassroots & Local Amateur Team Creator
              </h2>
              <p className="text-xs text-slate-500">
                Create your local club (NPSL, USL2, UPSL, WPSL, UWS) to insert them directly into the Matchday Odds Slate!
              </p>
            </div>

            <form onSubmit={handleCreateCustomTeam} className="space-y-6 text-xs">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Club / Team Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Raleigh City FC"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none focus:border-[#C8102E]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender Division</label>
                  <select
                    value={newTeam.gender}
                    onChange={(e) => setNewTeam({ ...newTeam, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none"
                  >
                    <option value="mens">Men's Division</option>
                    <option value="womens">Women's Division</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">League / Circuit</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., UPSL Premier / USL2"
                    value={newTeam.league}
                    onChange={(e) => setNewTeam({ ...newTeam, league: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base Elo Power Rating ({newTeam.elo})</label>
                  <input
                    type="range"
                    min="800"
                    max="1350"
                    step="10"
                    value={newTeam.elo}
                    onChange={(e) => setNewTeam({ ...newTeam, elo: Number(e.target.value) })}
                    className="w-full accent-[#C8102E] bg-slate-200 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Squad Market Valuation (${(newTeam.squadValue / 1000).toFixed(0)}k)</label>
                  <input
                    type="range"
                    min="10000"
                    max="800000"
                    step="10000"
                    value={newTeam.squadValue}
                    onChange={(e) => setNewTeam({ ...newTeam, squadValue: Number(e.target.value) })}
                    className="w-full accent-[#C8102E] bg-slate-200 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Average FotMob Form ({newTeam.avgFotmob})</label>
                  <input
                    type="range"
                    min="5.5"
                    max="7.8"
                    step="0.05"
                    value={newTeam.avgFotmob}
                    onChange={(e) => setNewTeam({ ...newTeam, avgFotmob: Number(e.target.value) })}
                    className="w-full accent-[#C8102E] bg-slate-200 rounded cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#C8102E] hover:bg-[#a00c24] text-white font-extrabold py-3 rounded-xl text-sm transition-all shadow-md"
              >
                Save Custom Team & Generate Matchday Fixture
              </button>

            </form>
          </div>
        )}

      </main>

      {/* FIXTURE DETAIL MODAL POPUP */}
      {selectedFixtureModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 relative animate-in fade-in zoom-in-95">
            
            <button
              onClick={() => setSelectedFixtureModal(null)}
              className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#C8102E] bg-red-50 border border-red-200 px-2.5 py-0.5 rounded">
                {selectedFixtureModal.league} • FIXTURE MONTE CARLO BREAKDOWN
              </span>
              <h3 className="text-xl font-black text-[#0C2340]">
                {selectedFixtureModal.homeTeam.name} vs {selectedFixtureModal.awayTeam.name}
              </h3>
              <p className="text-xs text-slate-500">
                {new Date(selectedFixtureModal.kickoff).toLocaleString()} | {selectedFixtureModal.venue}
              </p>
            </div>

            {/* Projected xG Card */}
            <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-sans">Projected xG Score</span>
                <span className="text-xl font-black text-amber-400">
                  {selectedFixtureModal.odds.xG.homeXG} - {selectedFixtureModal.odds.xG.awayXG}
                </span>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-400 block">Monte Carlo Sample</span>
                <span className="font-bold text-white">1,500 Matches</span>
              </div>
            </div>

            {/* Odds Table */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="font-sans font-bold text-slate-800">{selectedFixtureModal.homeTeam.name} Win:</span>
                <span className="font-bold text-[#0C2340]">{(selectedFixtureModal.odds.pHome * 100).toFixed(1)}% ({selectedFixtureModal.odds.oddsHome.american})</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="font-sans font-bold text-slate-800">Draw (Regulation):</span>
                <span className="font-bold text-slate-700">{(selectedFixtureModal.odds.pDraw * 100).toFixed(1)}% ({selectedFixtureModal.odds.oddsDraw.american})</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="font-sans font-bold text-slate-800">{selectedFixtureModal.awayTeam.name} Win:</span>
                <span className="font-bold text-[#C8102E]">{(selectedFixtureModal.odds.pAway * 100).toFixed(1)}% ({selectedFixtureModal.odds.oddsAway.american})</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedFixtureModal(null)}
              className="w-full bg-[#0C2340] text-white font-bold py-2.5 rounded-xl text-xs"
            >
              Close Breakdown
            </button>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-[#0C2340] text-slate-400 py-6 border-t-2 border-[#C8102E] text-center text-xs space-y-1">
        <p className="font-bold text-slate-300">
          U.S. SOCCER SCHEDULE, ACCURACY TRACKER & BETTING ODDS SIMULATOR
        </p>
        <p className="text-[11px]">
          MLS • NWSL • USL Championship • USL League One • USL Super League • MLS NEXT Pro • Grassroots
        </p>
      </footer>

    </div>
  );
}