# -*- coding: utf-8 -*-
import json
import logging
import math
import os
import numpy as np
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

HISTORY_FILE = "public/data/prediction_history.json"
ODDS_FILE = "public/data/upcoming_odds.json"
RHO = -0.13

# Full League Teams Database with Unique Elo, Value, Form & Player Ratings
TEAM_RATINGS = {
    # MLS
    "Inter Miami CF": {"elo": 1650, "val": 45000000, "form": 8.4, "player_rating": 8.9, "key_players": [{"name": "Lionel Messi", "goal_share": 0.38, "xa_per90": 0.42, "shots_per90": 4.2}]},
    "Atlanta United": {"elo": 1470, "val": 14000000, "form": 5.9, "player_rating": 7.0, "key_players": [{"name": "Saba Lobjanidze", "goal_share": 0.28, "xa_per90": 0.22, "shots_per90": 2.6}]},
    "FC Cincinnati": {"elo": 1610, "val": 26000000, "form": 7.8, "player_rating": 8.2, "key_players": [{"name": "Lucho Acosta", "goal_share": 0.34, "xa_per90": 0.38, "shots_per90": 3.5}]},
    "Columbus Crew": {"elo": 1630, "val": 31000000, "form": 8.1, "player_rating": 8.5, "key_players": [{"name": "Cucho Hernandez", "goal_share": 0.40, "xa_per90": 0.30, "shots_per90": 4.1}]},
    "Seattle Sounders FC": {"elo": 1560, "val": 21000000, "form": 7.2, "player_rating": 7.7, "key_players": [{"name": "Jordan Morris", "goal_share": 0.35, "xa_per90": 0.20, "shots_per90": 3.1}]},
    "LA Galaxy": {"elo": 1590, "val": 29000000, "form": 7.6, "player_rating": 8.1, "key_players": [{"name": "Riqui Puig", "goal_share": 0.28, "xa_per90": 0.36, "shots_per90": 3.8}]},
    "Los Angeles FC": {"elo": 1620, "val": 32000000, "form": 7.9, "player_rating": 8.4, "key_players": [{"name": "Denis Bouanga", "goal_share": 0.41, "xa_per90": 0.28, "shots_per90": 4.5}]},
    "Vancouver Whitecaps": {"elo": 1510, "val": 12000000, "form": 6.8, "player_rating": 7.2, "key_players": [{"name": "Brian White", "goal_share": 0.35, "xa_per90": 0.18, "shots_per90": 3.1}]},

    # NWSL
    "Gotham FC": {"elo": 1580, "val": 5200000, "form": 7.7, "player_rating": 8.2, "key_players": [{"name": "Esther Gonzalez", "goal_share": 0.36, "xa_per90": 0.24, "shots_per90": 3.2}]},
    "Portland Thorns FC": {"elo": 1550, "val": 4600000, "form": 7.1, "player_rating": 7.8, "key_players": [{"name": "Sophia Smith", "goal_share": 0.42, "xa_per90": 0.26, "shots_per90": 4.1}]},
    "North Carolina Courage": {"elo": 1540, "val": 4300000, "form": 7.0, "player_rating": 7.6, "key_players": [{"name": "Ashley Sanchez", "goal_share": 0.29, "xa_per90": 0.31, "shots_per90": 2.8}]},
    "Washington Spirit": {"elo": 1570, "val": 4900000, "form": 7.5, "player_rating": 8.0, "key_players": [{"name": "Trinity Rodman", "goal_share": 0.34, "xa_per90": 0.29, "shots_per90": 3.6}]},
    "Orlando Pride": {"elo": 1600, "val": 5500000, "form": 8.2, "player_rating": 8.3, "key_players": [{"name": "Banda", "goal_share": 0.39, "xa_per90": 0.25, "shots_per90": 3.9}]},
    "San Diego Wave FC": {"elo": 1500, "val": 4100000, "form": 6.3, "player_rating": 7.3, "key_players": [{"name": "Jaedyn Shaw", "goal_share": 0.32, "xa_per90": 0.28, "shots_per90": 3.0}]},
    "Kansas City Current": {"elo": 1590, "val": 5300000, "form": 7.9, "player_rating": 8.2, "key_players": [{"name": "Temwa Chawinga", "goal_share": 0.44, "xa_per90": 0.22, "shots_per90": 4.3}]},
    "Angel City FC": {"elo": 1480, "val": 3900000, "form": 6.1, "player_rating": 7.1, "key_players": [{"name": "Alyssa Thompson", "goal_share": 0.31, "xa_per90": 0.27, "shots_per90": 2.9}]},

    # USL Championship
    "Lexington SC": {"elo": 1330, "val": 2100000, "form": 6.2, "player_rating": 6.1, "key_players": [{"name": "Cameron Lancaster", "goal_share": 0.33, "xa_per90": 0.18, "shots_per90": 2.9}]},
    "Colorado Springs Switchbacks": {"elo": 1420, "val": 3400000, "form": 7.3, "player_rating": 7.0, "key_players": [{"name": "Ronaldo Damus", "goal_share": 0.37, "xa_per90": 0.19, "shots_per90": 3.1}]},
    "Louisville City FC": {"elo": 1480, "val": 4500000, "form": 8.0, "player_rating": 7.5, "key_players": [{"name": "Wilson Harris", "goal_share": 0.38, "xa_per90": 0.20, "shots_per90": 3.4}]},
    "Indy Eleven": {"elo": 1390, "val": 3100000, "form": 6.8, "player_rating": 6.8, "key_players": [{"name": "Augi Williams", "goal_share": 0.34, "xa_per90": 0.17, "shots_per90": 2.8}]},
    "Charleston Battery": {"elo": 1460, "val": 4200000, "form": 7.7, "player_rating": 7.3, "key_players": [{"name": "Nick Markanich", "goal_share": 0.42, "xa_per90": 0.21, "shots_per90": 3.8}]},
    "Tampa Bay Rowdies": {"elo": 1410, "val": 3300000, "form": 6.9, "player_rating": 6.9, "key_players": [{"name": "Cal Jennings", "goal_share": 0.36, "xa_per90": 0.18, "shots_per90": 3.0}]},
    "Phoenix Rising FC": {"elo": 1380, "val": 3000000, "form": 6.5, "player_rating": 6.7, "key_players": [{"name": "Remi Cabral", "goal_share": 0.33, "xa_per90": 0.19, "shots_per90": 2.7}]},
    "Sacramento Republic FC": {"elo": 1440, "val": 3800000, "form": 7.4, "player_rating": 7.2, "key_players": [{"name": "Kizza", "goal_share": 0.35, "xa_per90": 0.18, "shots_per90": 3.1}]},

    # USL League One
    "Greenville Triumph SC": {"elo": 1330, "val": 1900000, "form": 6.8, "player_rating": 6.2, "key_players": [{"name": "Lycio Castro", "goal_share": 0.31, "xa_per90": 0.17, "shots_per90": 2.5}]},
    "Charlotte Independence": {"elo": 1310, "val": 1700000, "form": 6.3, "player_rating": 6.0, "key_players": [{"name": "Juan Carlos Obregon", "goal_share": 0.36, "xa_per90": 0.15, "shots_per90": 2.9}]},
    "Forward Madison FC": {"elo": 1340, "val": 2000000, "form": 7.1, "player_rating": 6.3, "key_players": [{"name": "Christian Chaney", "goal_share": 0.35, "xa_per90": 0.16, "shots_per90": 2.7}]},
    "Union Omaha": {"elo": 1370, "val": 2300000, "form": 7.5, "player_rating": 6.6, "key_players": [{"name": "Steevan Dos Santos", "goal_share": 0.34, "xa_per90": 0.20, "shots_per90": 2.8}]},
    "Spokane Velocity FC": {"elo": 1290, "val": 1600000, "form": 6.4, "player_rating": 5.9, "key_players": [{"name": "Josh Dolling", "goal_share": 0.32, "xa_per90": 0.18, "shots_per90": 2.6}]},
    "One Knoxville SC": {"elo": 1300, "val": 1650000, "form": 6.5, "player_rating": 6.0, "key_players": [{"name": "Kempes Tekiela", "goal_share": 0.30, "xa_per90": 0.17, "shots_per90": 2.4}]},

    # MLS NEXT Pro
    "Carolina Core FC": {"elo": 1280, "val": 1500000, "form": 6.2, "player_rating": 5.8, "key_players": [{"name": "Papa Ndoye", "goal_share": 0.38, "xa_per90": 0.14, "shots_per90": 2.8}]},
    "Crown Legacy FC": {"elo": 1320, "val": 1800000, "form": 6.8, "player_rating": 6.2, "key_players": [{"name": "Iuri Tavares", "goal_share": 0.33, "xa_per90": 0.21, "shots_per90": 2.6}]},
    "Chattanooga FC": {"elo": 1290, "val": 1550000, "form": 6.5, "player_rating": 6.0, "key_players": [{"name": "Mehdi Ouamri", "goal_share": 0.32, "xa_per90": 0.18, "shots_per90": 2.5}]},
    "Columbus Crew 2": {"elo": 1350, "val": 2000000, "form": 7.1, "player_rating": 6.7, "key_players": [{"name": "Gerson Minsi", "goal_share": 0.35, "xa_per90": 0.22, "shots_per90": 3.0}]},
    "Tacoma Defiance": {"elo": 1330, "val": 1900000, "form": 6.9, "player_rating": 6.4, "key_players": [{"name": "Minoungou", "goal_share": 0.31, "xa_per90": 0.20, "shots_per90": 2.7}]},
    "North Texas SC": {"elo": 1360, "val": 2100000, "form": 7.3, "player_rating": 6.8, "key_players": [{"name": "Pedrinho", "goal_share": 0.36, "xa_per90": 0.23, "shots_per90": 2.9}]},

    # USL Super League
    "Carolina Ascent FC": {"elo": 1430, "val": 2600000, "form": 7.4, "player_rating": 7.1, "key_players": [{"name": "Maddison Corbin", "goal_share": 0.35, "xa_per90": 0.22, "shots_per90": 3.0}]},
    "Tampa Bay Sun FC": {"elo": 1400, "val": 2300000, "form": 6.8, "player_rating": 6.7, "key_players": [{"name": "Erika Tymrak", "goal_share": 0.30, "xa_per90": 0.25, "shots_per90": 2.7}]},
    "Brooklyn FC": {"elo": 1390, "val": 2200000, "form": 6.6, "player_rating": 6.5, "key_players": [{"name": "Jessica Garziano", "goal_share": 0.32, "xa_per90": 0.21, "shots_per90": 2.6}]},
    "Dallas Trinity FC": {"elo": 1410, "val": 2400000, "form": 7.0, "player_rating": 6.8, "key_players": [{"name": "Amber Brooks", "goal_share": 0.28, "xa_per90": 0.24, "shots_per90": 2.5}]},
    "Spokane Zephyr FC": {"elo": 1370, "val": 2000000, "form": 6.4, "player_rating": 6.3, "key_players": [{"name": "Emina Ekic", "goal_share": 0.33, "xa_per90": 0.22, "shots_per90": 2.8}]},
    "Lexington SC Women": {"elo": 1350, "val": 1800000, "form": 6.2, "player_rating": 6.1, "key_players": [{"name": "Sydney Shepherd", "goal_share": 0.29, "xa_per90": 0.18, "shots_per90": 2.3}]},
    "Fort Lauderdale United FC": {"elo": 1380, "val": 2100000, "form": 6.7, "player_rating": 6.4, "key_players": [{"name": "Addie McCain", "goal_share": 0.34, "xa_per90": 0.20, "shots_per90": 2.7}]},
    "DC Power FC": {"elo": 1340, "val": 1750000, "form": 6.1, "player_rating": 6.0, "key_players": [{"name": "Janni Goss", "goal_share": 0.28, "xa_per90": 0.17, "shots_per90": 2.2}]}
}

def get_team_rating(team_name):
    if team_name in TEAM_RATINGS:
        return TEAM_RATINGS[team_name]
    name_hash = sum(ord(c) for c in team_name)
    return {
        "elo": 1300 + (name_hash % 250),
        "val": 1600000 + (name_hash % 30) * 100000,
        "form": round(5.5 + ((name_hash % 30) / 10.0), 1),
        "player_rating": round(5.2 + ((name_hash % 35) / 10.0), 1),
        "key_players": [
            {"name": f"Key Attacker ({team_name[:3]})", "goal_share": 0.30, "xa_per90": 0.20, "shots_per90": 2.8}
        ]
    }

def dixon_coles_tau(h, a, home_xg, away_xg, rho=RHO):
    if h == 0 and a == 0: return max(0.0, 1.0 - (home_xg * away_xg * rho))
    elif h == 1 and a == 0: return max(0.0, 1.0 + (away_xg * rho))
    elif h == 0 and a == 1: return max(0.0, 1.0 + (home_xg * rho))
    elif h == 1 and a == 1: return max(0.0, 1.0 - rho)
    return 1.0

def to_american(prob):
    if prob <= 0: return "+9900"
    if prob >= 1: return "-9900"
    if prob >= 0.5:
        return f"-{int(round((prob / (1 - prob)) * 100))}"
    else:
        return f"+{int(round(((1 - prob) / prob) * 100))}"

def calculate_model_markets(home_team, away_team, home_r, away_r):
    # Dynamic Rating Score with Home Field Advantage
    home_comp = (0.45 * home_r["elo"]) + (0.25 * home_r["player_rating"] * 180) + (0.15 * math.log10(max(home_r["val"], 100000)) * 180) + (0.15 * (home_r["form"] - 5.0) * 100) + 40.0
    away_comp = (0.45 * away_r["elo"]) + (0.25 * away_r["player_rating"] * 180) + (0.15 * math.log10(max(away_r["val"], 100000)) * 180) + (0.15 * (away_r["form"] - 5.0) * 100)
    
    diff = home_comp - away_comp
    
    # Calculate distinct dynamic xG per matchup
    home_xg = max(0.40, round(1.48 + (diff / 220.0), 2))
    away_xg = max(0.30, round(1.18 - (diff / 220.0), 2))

    matrix = np.zeros((6, 6))
    for h in range(6):
        for a in range(6):
            p_h = (home_xg ** h * math.exp(-home_xg)) / math.factorial(h)
            p_a = (away_xg ** a * math.exp(-away_xg)) / math.factorial(a)
            matrix[h, a] = p_h * p_a * dixon_coles_tau(h, a, home_xg, away_xg)

    total_p = np.sum(matrix)
    if total_p > 0: matrix /= total_p

    p_home = float(np.sum(np.tril(matrix, -1)))
    p_draw = float(np.sum(np.diag(matrix)))
    p_away = float(np.sum(np.triu(matrix, 1)))

    tnb_denom = max(p_home + p_away, 0.001)
    p_tnb_home = p_home / tnb_denom
    p_tnb_away = p_away / tnb_denom

    totals = {}
    for line in [1.5, 2.5, 3.5]:
        p_over = float(sum(matrix[h, a] for h in range(6) for a in range(6) if (h + a) > line))
        totals[f"over_{str(line).replace('.', '_')}"] = {"prob": round(p_over * 100, 1), "fair_american": to_american(p_over)}
        totals[f"under_{str(line).replace('.', '_')}"] = {"prob": round((1 - p_over) * 100, 1), "fair_american": to_american(1 - p_over)}

    p_home_m15 = float(sum(matrix[h, a] for h in range(6) for a in range(6) if (h - a) > 1.5))
    p_away_p15 = 1.0 - p_home_m15

    player_props = []
    for team_name, rating, is_home in [(home_team, home_r, True), (away_team, away_r, False)]:
        t_xg = home_xg if is_home else away_xg
        for pl in rating.get("key_players", []):
            p_goal = 1.0 - math.exp(-1.0 * (t_xg * pl["goal_share"]))
            p_assist = 1.0 - math.exp(-1.0 * (t_xg * pl["xa_per90"]))
            
            lambda_shots = pl["shots_per90"] * (t_xg / 1.40)
            p_shots_o25 = 1.0 - sum((lambda_shots**k * math.exp(-lambda_shots)) / math.factorial(k) for k in range(3))

            player_props.append({
                "player_name": pl["name"],
                "team": team_name,
                "anytime_goalscorer": {"prob": round(p_goal * 100, 1), "fair_american": to_american(p_goal)},
                "anytime_assist": {"prob": round(p_assist * 100, 1), "fair_american": to_american(p_assist)},
                "shots_over_25": {"prob": round(p_shots_o25 * 100, 1), "fair_american": to_american(p_shots_o25)}
            })

    return {
        "home_xg": home_xg,
        "away_xg": away_xg,
        "moneyline": {
            "home": {"prob": round(p_home * 100, 1), "fair_american": to_american(p_home)},
            "draw": {"prob": round(p_draw * 100, 1), "fair_american": to_american(p_draw)},
            "away": {"prob": round(p_away * 100, 1), "fair_american": to_american(p_away)}
        },
        "tie_no_bet": {
            "home": {"prob": round(p_tnb_home * 100, 1), "fair_american": to_american(p_tnb_home)},
            "away": {"prob": round(p_tnb_away * 100, 1), "fair_american": to_american(p_tnb_away)}
        },
        "totals": totals,
        "spread": {
            "home_minus_1_5": {"prob": round(p_home_m15 * 100, 1), "fair_american": to_american(p_home_m15)},
            "away_plus_1_5": {"prob": round(p_away_p15 * 100, 1), "fair_american": to_american(p_away_p15)}
        },
        "player_props": player_props
    }

def run_pipeline():
    logging.info("Generating Full 22-Match Today US Soccer Slate...")

    # Comprehensive 22-Match Matchday Slate for Today (11/01/2026)
    full_today_slate = [
        # USL Championship
        {"id": "fix_uslc_1", "slug": "usa.usl.1", "league": "USL Championship", "home": "Lexington SC", "away": "Colorado Springs Switchbacks", "time": "2026-11-01T14:00:00-05:00"},
        {"id": "fix_uslc_2", "slug": "usa.usl.1", "league": "USL Championship", "home": "Louisville City FC", "away": "Indy Eleven", "time": "2026-11-01T15:00:00-05:00"},
        {"id": "fix_uslc_3", "slug": "usa.usl.1", "league": "USL Championship", "home": "Charleston Battery", "away": "Tampa Bay Rowdies", "time": "2026-11-01T15:30:00-05:00"},
        {"id": "fix_uslc_4", "slug": "usa.usl.1", "league": "USL Championship", "home": "Phoenix Rising FC", "away": "Sacramento Republic FC", "time": "2026-11-01T16:00:00-05:00"},
        
        # USL League One
        {"id": "fix_usl1_1", "slug": "usa.usl.2", "league": "USL League One", "home": "Greenville Triumph SC", "away": "Charlotte Independence", "time": "2026-11-01T16:30:00-05:00"},
        {"id": "fix_usl1_2", "slug": "usa.usl.2", "league": "USL League One", "home": "Forward Madison FC", "away": "Union Omaha", "time": "2026-11-01T17:00:00-05:00"},
        {"id": "fix_usl1_3", "slug": "usa.usl.2", "league": "USL League One", "home": "Spokane Velocity FC", "away": "One Knoxville SC", "time": "2026-11-01T17:30:00-05:00"},

        # NWSL
        {"id": "fix_nwsl_1", "slug": "usa.nwsl", "league": "NWSL", "home": "Gotham FC", "away": "Portland Thorns FC", "time": "2026-11-01T17:00:00-05:00"},
        {"id": "fix_nwsl_2", "slug": "usa.nwsl", "league": "NWSL", "home": "North Carolina Courage", "away": "Washington Spirit", "time": "2026-11-01T18:00:00-05:00"},
        {"id": "fix_nwsl_3", "slug": "usa.nwsl", "league": "NWSL", "home": "Orlando Pride", "away": "San Diego Wave FC", "time": "2026-11-01T18:30:00-05:00"},
        {"id": "fix_nwsl_4", "slug": "usa.nwsl", "league": "NWSL", "home": "Kansas City Current", "away": "Angel City FC", "time": "2026-11-01T19:00:00-05:00"},

        # MLS
        {"id": "fix_mls_1", "slug": "usa.1", "league": "MLS", "home": "Inter Miami CF", "away": "Atlanta United", "time": "2026-11-01T19:00:00-05:00"},
        {"id": "fix_mls_2", "slug": "usa.1", "league": "MLS", "home": "FC Cincinnati", "away": "Columbus Crew", "time": "2026-11-01T19:30:00-05:00"},
        {"id": "fix_mls_3", "slug": "usa.1", "league": "MLS", "home": "Seattle Sounders FC", "away": "LA Galaxy", "time": "2026-11-01T20:00:00-05:00"},
        {"id": "fix_mls_4", "slug": "usa.1", "league": "MLS", "home": "Los Angeles FC", "away": "Vancouver Whitecaps", "time": "2026-11-01T21:30:00-05:00"},

        # MLS NEXT Pro
        {"id": "fix_mnp_1", "slug": "usa.mls_next", "league": "MLS NEXT Pro", "home": "Carolina Core FC", "away": "Crown Legacy FC", "time": "2026-11-01T18:00:00-05:00"},
        {"id": "fix_mnp_2", "slug": "usa.mls_next", "league": "MLS NEXT Pro", "home": "Chattanooga FC", "away": "Columbus Crew 2", "time": "2026-11-01T19:00:00-05:00"},
        {"id": "fix_mnp_3", "slug": "usa.mls_next", "league": "MLS NEXT Pro", "home": "Tacoma Defiance", "away": "North Texas SC", "time": "2026-11-01T20:00:00-05:00"},

        # USL Super League
        {"id": "fix_usls_1", "slug": "usa.usl.super", "league": "USL Super League", "home": "Carolina Ascent FC", "away": "Tampa Bay Sun FC", "time": "2026-11-01T19:00:00-05:00"},
        {"id": "fix_usls_2", "slug": "usa.usl.super", "league": "USL Super League", "home": "Brooklyn FC", "away": "Dallas Trinity FC", "time": "2026-11-01T20:30:00-05:00"},
        {"id": "fix_usls_3", "slug": "usa.usl.super", "league": "USL Super League", "home": "Spokane Zephyr FC", "away": "Lexington SC Women", "time": "2026-11-01T21:00:00-05:00"},
        {"id": "fix_usls_4", "slug": "usa.usl.super", "league": "USL Super League", "home": "Fort Lauderdale United FC", "away": "DC Power FC", "time": "2026-11-01T21:30:00-05:00"}
    ]

    # Enforce strict chronological ordering (earliest kickoffs first)
    full_today_slate.sort(key=lambda x: x["time"])

    output_fixtures = []
    for item in full_today_slate:
        home_r = get_team_rating(item["home"])
        away_r = get_team_rating(item["away"])
        model_markets = calculate_model_markets(item["home"], item["away"], home_r, away_r)

        output_fixtures.append({
            "fixture_id": item["id"],
            "league": item["league"],
            "kickoff_iso": item["time"],
            "home_team": item["home"],
            "away_team": item["away"],
            "model_markets": model_markets
        })

    payload = {
        "metadata": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "engine_status": "full_22_slate_ready",
            "fixture_count": len(output_fixtures)
        },
        "fixtures": output_fixtures
    }

    os.makedirs("public/data", exist_ok=True)
    with open(ODDS_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    logging.info(f"Full 22-match today dataset generated successfully. Total matches: {len(output_fixtures)}")

if __name__ == "__main__":
    run_pipeline()
