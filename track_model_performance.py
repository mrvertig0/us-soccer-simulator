# -*- coding: utf-8 -*-
import sqlite3
import json
import os

DB_PATH = "predictions.db"
STATS_JSON = "public/data/model_stats.json"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            fixture_id TEXT PRIMARY KEY,
            league TEXT,
            kickoff_iso TEXT,
            home_team TEXT,
            away_team TEXT,
            home_xg REAL,
            away_xg REAL,
            prob_home REAL,
            prob_draw REAL,
            prob_away REAL,
            predicted_outcome TEXT, -- 'home', 'draw', 'away'
            status TEXT DEFAULT 'upcoming', -- 'upcoming', 'finished'
            home_score INTEGER,
            away_score INTEGER,
            actual_result TEXT, -- 'home', 'draw', 'away'
            is_correct INTEGER -- 1 if correct, 0 if incorrect
        )
    """)
    conn.commit()
    conn.close()

def log_predictions(fixtures):
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    logged_count = 0
    for fx in fixtures:
        fid = fx["fixture_id"]
        league = fx["league"]
        kickoff = fx["kickoff_iso"]
        home = fx["home_team"]
        away = fx["away_team"]
        
        markets = fx["model_markets"]
        h_xg = markets["home_xg"]
        a_xg = markets["away_xg"]
        
        p_home = markets["moneyline"]["home"]["prob"]
        p_draw = markets["moneyline"]["draw"]["prob"]
        p_away = markets["moneyline"]["away"]["prob"]
        
        if p_home >= p_draw and p_home >= p_away:
            pred = "home"
        elif p_away >= p_home and p_away >= p_draw:
            pred = "away"
        else:
            pred = "draw"
            
        cursor.execute("""
            INSERT OR IGNORE INTO predictions 
            (fixture_id, league, kickoff_iso, home_team, away_team, home_xg, away_xg, prob_home, prob_draw, prob_away, predicted_outcome, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming')
        """, (fid, league, kickoff, home, away, h_xg, a_xg, p_home, p_draw, p_away, pred))
        
        if cursor.rowcount > 0:
            logged_count += 1
            
    conn.commit()
    conn.close()
    print(f"Logged {logged_count} new fixtures into model tracking database.")

def update_results_and_grade(scraped_fixtures):
    """
    Takes the freshly scraped fixtures (which may now contain final scores / status from ESPN)
    and updates any pending upcoming predictions in the SQLite database.
    """
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    graded_count = 0
    
    for fx in scraped_fixtures:
        fid = fx["fixture_id"]
        # Check if this fixture is logged as upcoming in DB
        cursor.execute("SELECT status, predicted_outcome FROM predictions WHERE fixture_id = ? AND status = 'upcoming'", (fid,))
        row = cursor.fetchone()
        
        if row:
            predicted_outcome = row[1]
            
            # Check if scraper output contains score data
            # Adjust keys based on how your scraper returns completed scores (e.g., fx.get('home_score'))
            h_score = fx.get("home_score")
            a_score = fx.get("away_score")
            is_completed = fx.get("is_completed", False) or (h_score is not None and a_score is not None and fx.get("status") in ["FT", "Full-Time", "Final", "STATUS_FULL_TIME"])
            
            if is_completed:
                if h_score > a_score:
                    actual = "home"
                elif a_score > h_score:
                    actual = "away"
                else:
                    actual = "draw"
                    
                is_correct = 1 if (predicted_outcome == actual) else 0
                
                cursor.execute("""
                    UPDATE predictions 
                    SET status = 'finished', home_score = ?, away_score = ?, actual_result = ?, is_correct = ?
                    WHERE fixture_id = ?
                """, (h_score, a_score, actual, is_correct, fid))
                
                graded_count += 1

    conn.commit()
    
    # Recalculate stats for frontend
    cursor.execute("SELECT COUNT(*), SUM(is_correct), SUM(CASE WHEN status='finished' THEN 1 ELSE 0 END) FROM predictions")
    total, correct, finished = cursor.fetchone()
    
    accuracy = round(((correct or 0) / finished * 100), 1) if finished and finished > 0 else 0.0
    
    stats_payload = {
        "total_tracked": total or 0,
        "finished_matches": finished or 0,
        "correct_predictions": correct or 0,
        "win_rate_pct": accuracy
    }
    
    os.makedirs("public/data", exist_ok=True)
    with open(STATS_JSON, "w", encoding="utf-8") as f:
        json.dump(stats_payload, f, indent=2)
        
    conn.close()
    if graded_count > 0:
        print(f"Graded {graded_count} newly finished matches! Updated Win Rate: {accuracy}%")
