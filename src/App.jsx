import React, { useState, useEffect } from 'react';

export default function App() {
  const [data, setData] = useState(null);
  const [modelStats, setModelStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState('ALL');
  const [activeMarketTabs, setActiveMarketTabs] = useState({});
  const [showDkCompare, setShowDkCompare] = useState({});
  const [customDkLines, setCustomDkLines] = useState({});
  const [parlayPicks, setParlayPicks] = useState([]);

  const fetchAppData = () => {
    setLoading(true);
    Promise.all([
      fetch('/data/upcoming_odds.json?t=' + Date.now()).then((res) => {
        if (!res.ok) throw new Error('HTTP error! status: ' + res.status);
        return res.json();
      }),
      fetch('/data/model_stats.json?t=' + Date.now())
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null)
    ])
      .then(([oddsData, statsData]) => {
        setData(oddsData);
        if (statsData) setModelStats(statsData);
        setLoading(false);
        setRefreshing(false);
      })
      .catch((err) => {
        console.error('Failed to load match data:', err);
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchAppData();
  }, []);

  const handleManualScrapeTrigger = () => {
    const userConfirmed = window.confirm(
      "WARNING: Manual Scrape Requested\n\n" +
      "Manual updates re-query live ESPN API endpoints and replace current match lines. " +
      "Please only trigger a manual update if necessary.\n\n" +
      "Do you want to execute a fresh data update now?"
    );
    if (!userConfirmed) return;
    setRefreshing(true);
    setTimeout(() => {
      fetchAppData();
    }, 1200);
  };

  const setCardTab = (fixtureId, tabKey) => {
    setActiveMarketTabs((prev) => ({ ...prev, [fixtureId]: tabKey }));
  };

  const toggleDkCompare = (fixtureId) => {
    setShowDkCompare((prev) => ({ ...prev, [fixtureId]: !prev[fixtureId] }));
  };

  const updateDkLine = (key, val) => {
    setCustomDkLines((prev) => ({ ...prev, [key]: val }));
  };

  function parseOddsToDecimal(oddsStr) {
    if (typeof oddsStr === 'number') return oddsStr;
    const str = String(oddsStr || '').trim();
    if (str.startsWith('+')) {
      return 1.0 + (parseFloat(str.replace('+', '')) / 100.0);
    } else if (str.startsWith('-')) {
      const val = parseFloat(str.replace('-', ''));
      return val > 0 ? 1.0 + (100.0 / val) : 1.0;
    }
    const parsed = parseFloat(str);
    return isNaN(parsed) || parsed <= 1.0 ? 1.0 : parsed;
  }

  function calculateEV(modelProbPct, bookOddsStr) {
    if (!bookOddsStr || bookOddsStr.trim() === '') return null;
    const p = modelProbPct / 100.0;
    const decOdds = parseOddsToDecimal(bookOddsStr);
    const ev = (p * decOdds) - 1.0;
    return (ev * 100.0).toFixed(1);
  }

  const toggleParlayPick = (fixture, marketName, selectionLabel, oddsStr, probVal) => {
    const pickId = fixture.fixture_id + '_' + marketName + '_' + selectionLabel;
    const existingIndex = parlayPicks.findIndex((p) => p.pickId === pickId);
    if (existingIndex >= 0) {
      setParlayPicks(parlayPicks.filter((_, idx) => idx !== existingIndex));
    } else {
      const filtered = parlayPicks.filter((p) => !(p.fixture_id === fixture.fixture_id && p.marketName === marketName));
      setParlayPicks([
        ...filtered,
        {
          pickId,
          fixture_id: fixture.fixture_id,
          matchup: fixture.home_team + ' vs ' + fixture.away_team,
          marketName,
          selectionLabel,
          oddsStr,
          probVal
        }
      ]);
    }
  };

  const calculateParlayMetrics = () => {
    if (parlayPicks.length === 0) return { americanOdds: 'N/A', combinedProb: 0 };
    let combinedDecimal = 1.0;
    let combinedProbFrac = 1.0;
    parlayPicks.forEach((pick) => {
      combinedProbFrac *= (pick.probVal / 100.0);
      combinedDecimal *= parseOddsToDecimal(pick.oddsStr);
    });
    let american = '';
    if (combinedDecimal >= 2.0) {
      american = '+' + Math.round((combinedDecimal - 1.0) * 100);
    } else {
      american = '-' + Math.round(100 / (combinedDecimal - 1.0));
    }
    return {
      americanOdds: american,
      combinedProb: (combinedProbFrac * 100).toFixed(1)
    };
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#2C2825] flex items-center justify-center font-sans">
      <div className="text-center space-y-2">
        <div className="text-xl font-bold tracking-tight text-[#3B4238]">U.S. SOCCER SIMULATOR</div>
        <div className="text-xs text-[#6B635B] font-mono">Loading Matchday Odds &amp; Model Performance...</div>
      </div>
    </div>
  );

  const fixtures = data?.fixtures || [];
  const metadata = data?.metadata || {};
  const allLeagues = ['ALL', 'MLS', 'USL Championship', 'USL League One', 'NWSL', 'MLS NEXT Pro', 'USL Super League'];
  
  const sortedFixtures = [...fixtures]
    .filter(f => (selectedLeague === 'ALL' || f.league === selectedLeague) && !f.is_completed)
    .sort((a, b) => new Date(a.kickoff_iso) - new Date(b.kickoff_iso));

  const parlayMetrics = calculateParlayMetrics();
  const formattedLastUpdate = metadata.generated_at
    ? new Date(metadata.generated_at).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      })
    : 'Unknown';

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#2C2825] font-sans p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Banner */}
        <header className="bg-[#EBE5DC] border border-[#D9D0C1] rounded-xl p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#A85C3B] text-white font-black text-xs flex items-center justify-center rounded shadow-sm">
                USA
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#2C2825] tracking-tight">
                U.S. Soccer Match Model Engine
              </h1>
            </div>
            <p className="text-xs md:text-sm text-[#6B635B]">
              Monte Carlo Poisson &amp; Dixon-Coles Goal Probability Engine
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            <div className="bg-[#F5F2EB] border border-[#D9D0C1] rounded-lg p-3 text-xs space-y-1 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-[#4A433D] font-semibold font-mono">
                <span>&#x1F552; Scheduled Update:</span>
                <span className="text-[#2C2825]">Daily at 7:00 AM EST</span>
              </div>
              <div className="flex items-center gap-2 text-[#6B635B] font-mono">
                <span>&#x1F4C5; Last Updated:</span>
                <span className="text-[#3B6344] font-bold">{formattedLastUpdate}</span>
              </div>
            </div>
            <button
              onClick={handleManualScrapeTrigger}
              disabled={refreshing}
              className={
                "w-full sm:w-auto px-4 py-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 border shadow-sm " +
                (refreshing
                  ? "bg-[#D9D0C1] text-[#8C8379] border-[#C9BFAF] cursor-not-allowed"
                  : "bg-[#3B4238] hover:bg-[#2C332A] text-white border-[#3B4238]")
              }
            >
              <span>&#x26A1; Run Manual Scrape</span>
            </button>
          </div>
        </header>

        {/* Model Performance Tracker Banner */}
        {modelStats && (
          <div className="bg-[#EBE5DC] border border-[#D9D0C1] rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B6344] animate-pulse"></span>
                <h3 className="text-sm font-bold tracking-wider text-[#3B4238] uppercase">Model Accuracy Tracker</h3>
              </div>
              <p className="text-xs text-[#6B635B]">Automated SQLite logging &amp; grading pipeline results over time</p>
            </div>
            <div className="grid grid-cols-3 gap-6 text-center w-full md:w-auto">
              <div className="bg-[#F5F2EB] border border-[#D9D0C1] rounded-lg p-3">
                <div className="text-xl md:text-2xl font-black text-[#3B6344] font-mono">{modelStats.win_rate_pct}%</div>
                <div className="text-[10px] text-[#6B635B] uppercase font-bold mt-0.5">Win Rate</div>
              </div>
              <div className="bg-[#F5F2EB] border border-[#D9D0C1] rounded-lg p-3">
                <div className="text-xl md:text-2xl font-black text-[#2C2825] font-mono">{modelStats.correct_predictions} / {modelStats.finished_matches}</div>
                <div className="text-[10px] text-[#6B635B] uppercase font-bold mt-0.5">Correct / Graded</div>
              </div>
              <div className="bg-[#F5F2EB] border border-[#D9D0C1] rounded-lg p-3">
                <div className="text-xl md:text-2xl font-black text-[#4A433D] font-mono">{modelStats.total_tracked}</div>
                <div className="text-[10px] text-[#6B635B] uppercase font-bold mt-0.5">Total Tracked</div>
              </div>
            </div>
          </div>
        )}

        {/* League Navigation Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#D9D0C1]">
          {allLeagues.map((lg) => (
            <button
              key={lg}
              onClick={() => setSelectedLeague(lg)}
              className={
                "px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shadow-sm " +
                (selectedLeague === lg
                  ? "bg-[#3B4238] text-white"
                  : "bg-[#EBE5DC] text-[#6B635B] hover:text-[#2C2825] border border-[#D9D0C1]")
              }
            >
              {lg}
            </button>
          ))}
        </div>

        {/* Matchday Odds Slate */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-[#2C2825] tracking-tight">Active Fixtures (Earliest Kickoff First)</h2>
            <span className="text-xs text-[#6B635B] font-mono font-semibold">
              Total Matches: {sortedFixtures.length}
            </span>
          </div>

          {sortedFixtures.length === 0 ? (
            <div className="bg-[#EBE5DC] border border-[#D9D0C1] rounded-xl p-8 text-center text-[#6B635B] text-sm shadow-sm">
              No active fixtures currently listed for {selectedLeague}.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedFixtures.map((fix) => {
                const activeTab = activeMarketTabs[fix.fixture_id] || 'ML';
                const isComparingDk = showDkCompare[fix.fixture_id] || false;
                const m = fix.model_markets || {};
                const ml = m.moneyline || { home: { prob: 50, fair_american: '-110' }, draw: { prob: 25, fair_american: '+250' }, away: { prob: 25, fair_american: '+260' } };
                const tnb = m.tie_no_bet || { home: { prob: 66, fair_american: '-180' }, away: { prob: 34, fair_american: '+140' } };
                const totals = m.totals || { over_2_5: { prob: 55, fair_american: '-120' }, under_2_5: { prob: 45, fair_american: '+100' } };
                const spread = m.spread || { home_minus_1_5: { prob: 32, fair_american: '+175' }, away_plus_1_5: { prob: 68, fair_american: '-210' } };

                const homeProb = ml.home.prob;
                const awayProb = ml.away.prob;
                const drawProb = ml.draw.prob;
                const topProb = Math.max(homeProb, awayProb, drawProb);
                let modelPickLabel = 'Draw';
                if (topProb === homeProb) modelPickLabel = fix.home_team;
                else if (topProb === awayProb) modelPickLabel = fix.away_team;

                return (
                  <div key={fix.fixture_id} className="bg-[#EBE5DC] border border-[#D9D0C1] rounded-xl p-5 shadow-sm space-y-4 overflow-hidden relative">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      
                      {/* Left Block: Team Emojis & Kickoff Details */}
                      <div className="lg:w-1/3 space-y-3 border-b lg:border-b-0 lg:border-r border-[#D9D0C1] pb-4 lg:pb-0 lg:pr-6">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-[#A85C3B] uppercase tracking-wide">{fix.league}</span>
                          <span className="text-[#4A433D] font-mono font-bold">
                            {new Date(fix.kickoff_iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} EST
                          </span>
                        </div>
                        
                        <div className="space-y-2.5">
                          {/* Home Team */}
                          <div
                            className="flex items-center justify-between pl-3 py-1.5 rounded-r bg-[#F5F2EB] border border-[#D9D0C1]"
                            style={{ borderLeft: `6px solid ${fix.home_color || '#3B4238'}` }}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg">{fix.home_emoji || '&#x26BD;'}</span>
                              <span className="font-bold text-base text-[#2C2825]">{fix.home_team}</span>
                            </div>
                            <span className="text-xs text-[#3B6344] font-mono font-bold bg-[#E6ECE8] px-2 py-0.5 rounded border border-[#C5D3CB] mr-2">
                              xG {m.home_xg}
                            </span>
                          </div>
                          
                          <div className="text-[10px] text-[#8C8379] font-bold tracking-widest uppercase pl-4">VS</div>
                          
                          {/* Away Team */}
                          <div
                            className="flex items-center justify-between pl-3 py-1.5 rounded-r bg-[#F5F2EB] border border-[#D9D0C1]"
                            style={{ borderLeft: `6px solid ${fix.away_color || '#3B4238'}` }}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg">{fix.away_emoji || '&#x26BD;'}</span>
                              <span className="font-bold text-base text-[#2C2825]">{fix.away_team}</span>
                            </div>
                            <span className="text-xs text-[#4A6B82] font-mono font-bold bg-[#E5EEF4] px-2 py-0.5 rounded border border-[#C5D5E2] mr-2">
                              xG {m.away_xg}
                            </span>
                          </div>
                        </div>

                        {/* Model Pick Badge */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#D9D0C1] text-xs">
                          <span className="text-[#6B635B] font-mono">&#x1F916; Model Pick:</span>
                          <span className="px-2.5 py-1 rounded bg-[#E6ECE8] text-[#3B6344] font-bold font-mono border border-[#C5D3CB]">
                            {modelPickLabel} ({topProb}%)
                          </span>
                        </div>

                        <button
                          onClick={() => toggleDkCompare(fix.fixture_id)}
                          className={
                            "w-full text-[10px] font-mono font-bold px-2.5 py-1.5 rounded transition-all flex items-center justify-center gap-1 border shadow-sm " +
                            (isComparingDk
                              ? "bg-[#D9D0C1] text-[#2C2825] border-[#C9BFAF]"
                              : "bg-[#F5F2EB] text-[#6B635B] hover:text-[#2C2825] border-[#D9D0C1]")
                          }
                        >
                          <span>{isComparingDk ? '&#x25BC; Hide DK Line Input' : '&#x25B6; Compare Sportsbook Line (+EV)'}</span>
                        </button>
                      </div>

                      {/* Right Block: Markets & Odds */}
                      <div className="lg:w-2/3 space-y-3">
                        <div className="flex items-center gap-2 border-b border-[#D9D0C1] pb-2 overflow-x-auto">
                          {[
                            { key: 'ML', label: 'Moneyline' },
                            { key: 'TNB', label: 'Tie No Bet' },
                            { key: 'TOTALS', label: 'Total Goals' },
                            { key: 'SPREAD', label: 'Spread' },
                            { key: 'PROPS', label: 'Player Props' }
                          ].map((tab) => (
                            <button
                              key={tab.key}
                              onClick={() => setCardTab(fix.fixture_id, tab.key)}
                              className={
                                "px-3 py-1.5 rounded text-xs font-bold uppercase transition-all whitespace-nowrap shadow-sm " +
                                (activeTab === tab.key
                                  ? "bg-[#3B4238] text-white"
                                  : "bg-[#F5F2EB] text-[#6B635B] hover:text-[#2C2825] border border-[#D9D0C1]")
                              }
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* MONEYLINE TAB */}
                        {activeTab === 'ML' && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                            {[
                              { key: fix.fixture_id + '_ml_home', label: fix.home_team, item: ml.home },
                              { key: fix.fixture_id + '_ml_draw', label: 'Draw', item: ml.draw },
                              { key: fix.fixture_id + '_ml_away', label: fix.away_team, item: ml.away }
                            ].map((sel) => {
                              const dkLine = customDkLines[sel.key] || '';
                              const ev = calculateEV(sel.item.prob, dkLine);
                              return (
                                <div key={sel.key} className="bg-[#F5F2EB] p-3 rounded-lg border border-[#D9D0C1] flex flex-col justify-between space-y-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-[#4A433D] truncate">{sel.label}</span>
                                    <span className="text-[#3B6344] font-mono font-bold">{sel.item.prob}%</span>
                                  </div>
                                  <button
                                    onClick={() => toggleParlayPick(fix, 'Moneyline', sel.label, dkLine || sel.item.fair_american, sel.item.prob)}
                                    className={"p-2 rounded border text-center transition-all shadow-sm " + (
                                      parlayPicks.some(p => p.pickId === fix.fixture_id + '_Moneyline_' + sel.label)
                                        ? "bg-[#A85C3B] text-white border-[#A85C3B]"
                                        : "bg-[#EBE5DC] border-[#D9D0C1] hover:border-[#C9BFAF] text-[#2C2825]"
                                    )}
                                  >
                                    <div className="text-[9px] text-[#6B635B] uppercase font-sans font-semibold">Model Fair Odds</div>
                                    <div className="text-base font-black">{sel.item.fair_american}</div>
                                  </button>
                                  {isComparingDk && (
                                    <div className="pt-2 border-t border-[#D9D0C1] space-y-1">
                                      <label className="text-[8px] text-[#6B635B] uppercase font-bold block">Sportsbook Line</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. +140"
                                        value={dkLine}
                                        onChange={(e) => updateDkLine(sel.key, e.target.value)}
                                        className="w-full bg-[#EBE5DC] border border-[#D9D0C1] rounded px-2 py-1 text-xs font-mono font-bold text-[#2C2825] focus:outline-none"
                                      />
                                      {ev !== null && (
                                        <div className="text-[9px] font-bold font-mono text-right pt-0.5">
                                          {parseFloat(ev) > 0 ? (
                                            <span className="text-[#3B6344]">+{ev}% EV</span>
                                          ) : (
                                            <span className="text-[#8C8379]">{ev}% EV</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* TIE NO BET TAB */}
                        {activeTab === 'TNB' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                            {[
                              { key: fix.fixture_id + '_tnb_home', label: fix.home_team + ' (TNB)', item: tnb.home },
                              { key: fix.fixture_id + '_tnb_away', label: fix.away_team + ' (TNB)', item: tnb.away }
                            ].map((sel) => {
                              const dkLine = customDkLines[sel.key] || '';
                              const ev = calculateEV(sel.item.prob, dkLine);
                              return (
                                <div key={sel.key} className="bg-[#F5F2EB] p-3 rounded-lg border border-[#D9D0C1] flex flex-col justify-between space-y-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-[#4A433D] truncate">{sel.label}</span>
                                    <span className="text-[#3B6344] font-mono font-bold">{sel.item.prob}%</span>
                                  </div>
                                  <button
                                    onClick={() => toggleParlayPick(fix, 'Tie No Bet', sel.label, dkLine || sel.item.fair_american, sel.item.prob)}
                                    className="p-2 bg-[#EBE5DC] border border-[#D9D0C1] hover:border-[#C9BFAF] text-[#2C2825] rounded text-center shadow-sm"
                                  >
                                    <div className="text-[9px] text-[#6B635B] font-sans font-semibold">Model Fair Odds</div>
                                    <div className="text-base font-black">{sel.item.fair_american}</div>
                                  </button>
                                  {isComparingDk && (
                                    <div className="pt-2 border-t border-[#D9D0C1] space-y-1">
                                      <label className="text-[8px] text-[#6B635B] uppercase font-bold block">Sportsbook Line</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. -150"
                                        value={dkLine}
                                        onChange={(e) => updateDkLine(sel.key, e.target.value)}
                                        className="w-full bg-[#EBE5DC] border border-[#D9D0C1] rounded px-2 py-1 text-xs font-mono font-bold text-[#2C2825] focus:outline-none"
                                      />
                                      {ev !== null && (
                                        <div className="text-[9px] font-bold font-mono text-right pt-0.5">
                                          {parseFloat(ev) > 0 ? (
                                            <span className="text-[#3B6344]">+{ev}% EV</span>
                                          ) : (
                                            <span className="text-[#8C8379]">{ev}% EV</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* TOTAL GOALS TAB */}
                        {activeTab === 'TOTALS' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                            {[
                              { key: fix.fixture_id + '_tot_over', label: 'Over 2.5 Goals', item: totals.over_2_5 },
                              { key: fix.fixture_id + '_tot_under', label: 'Under 2.5 Goals', item: totals.under_2_5 }
                            ].map((sel) => {
                              const dkLine = customDkLines[sel.key] || '';
                              const ev = calculateEV(sel.item.prob, dkLine);
                              return (
                                <div key={sel.key} className="bg-[#F5F2EB] p-3 rounded-lg border border-[#D9D0C1] flex flex-col justify-between space-y-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-[#4A433D]">{sel.label}</span>
                                    <span className="text-[#3B6344] font-mono font-bold">{sel.item.prob}%</span>
                                  </div>
                                  <button
                                    onClick={() => toggleParlayPick(fix, 'Total Goals', sel.label, dkLine || sel.item.fair_american, sel.item.prob)}
                                    className="p-2 bg-[#EBE5DC] border border-[#D9D0C1] hover:border-[#C9BFAF] text-[#2C2825] rounded text-center shadow-sm"
                                  >
                                    <div className="text-[9px] text-[#6B635B] font-sans font-semibold">Model Fair Odds</div>
                                    <div className="text-base font-black">{sel.item.fair_american}</div>
                                  </button>
                                  {isComparingDk && (
                                    <div className="pt-2 border-t border-[#D9D0C1] space-y-1">
                                      <label className="text-[8px] text-[#6B635B] uppercase font-bold block">Sportsbook Line</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. -115"
                                        value={dkLine}
                                        onChange={(e) => updateDkLine(sel.key, e.target.value)}
                                        className="w-full bg-[#EBE5DC] border border-[#D9D0C1] rounded px-2 py-1 text-xs font-mono font-bold text-[#2C2825] focus:outline-none"
                                      />
                                      {ev !== null && (
                                        <div className="text-[9px] font-bold font-mono text-right pt-0.5">
                                          {parseFloat(ev) > 0 ? (
                                            <span className="text-[#3B6344]">+{ev}% EV</span>
                                          ) : (
                                            <span className="text-[#8C8379]">{ev}% EV</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* SPREAD TAB */}
                        {activeTab === 'SPREAD' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                            {[
                              { key: fix.fixture_id + '_spr_home', label: fix.home_team + ' -1.5', item: spread.home_minus_1_5 },
                              { key: fix.fixture_id + '_spr_away', label: fix.away_team + ' +1.5', item: spread.away_plus_1_5 }
                            ].map((sel) => {
                              const dkLine = customDkLines[sel.key] || '';
                              const ev = calculateEV(sel.item.prob, dkLine);
                              return (
                                <div key={sel.key} className="bg-[#F5F2EB] p-3 rounded-lg border border-[#D9D0C1] flex flex-col justify-between space-y-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-[#4A433D] truncate">{sel.label}</span>
                                    <span className="text-[#3B6344] font-mono font-bold">{sel.item.prob}%</span>
                                  </div>
                                  <button
                                    onClick={() => toggleParlayPick(fix, 'Spread', sel.label, dkLine || sel.item.fair_american, sel.item.prob)}
                                    className="p-2 bg-[#EBE5DC] border border-[#D9D0C1] hover:border-[#C9BFAF] text-[#2C2825] rounded text-center shadow-sm"
                                  >
                                    <div className="text-[9px] text-[#6B635B] font-sans font-semibold">Model Fair Odds</div>
                                    <div className="text-base font-black">{sel.item.fair_american}</div>
                                  </button>
                                  {isComparingDk && (
                                    <div className="pt-2 border-t border-[#D9D0C1] space-y-1">
                                      <label className="text-[8px] text-[#6B635B] uppercase font-bold block">Sportsbook Line</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. +160"
                                        value={dkLine}
                                        onChange={(e) => updateDkLine(sel.key, e.target.value)}
                                        className="w-full bg-[#EBE5DC] border border-[#D9D0C1] rounded px-2 py-1 text-xs font-mono font-bold text-[#2C2825] focus:outline-none"
                                      />
                                      {ev !== null && (
                                        <div className="text-[9px] font-bold font-mono text-right pt-0.5">
                                          {parseFloat(ev) > 0 ? (
                                            <span className="text-[#3B6344]">+{ev}% EV</span>
                                          ) : (
                                            <span className="text-[#8C8379]">{ev}% EV</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* PLAYER PROPS TAB */}
                        {activeTab === 'PROPS' && (
                          <div className="space-y-2 text-xs font-mono">
                            {(m.player_props || []).map((pl, idx) => {
                              const pKey = fix.fixture_id + '_prop_' + idx;
                              const dkGoalLine = customDkLines[pKey + '_goal'] || '';
                              const goalEV = calculateEV(pl.anytime_goalscorer.prob, dkGoalLine);
                              return (
                                <div key={idx} className="bg-[#F5F2EB] p-3 rounded-lg border border-[#D9D0C1] flex flex-col md:flex-row md:items-center justify-between gap-3">
                                  <div>
                                    <div className="font-sans font-bold text-[#2C2825] text-xs">{pl.player_name}</div>
                                    <div className="text-[10px] text-[#6B635B] font-sans font-medium">{pl.team}</div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-center">
                                      <div className="text-[8px] text-[#6B635B] font-sans font-bold">GOAL PROB</div>
                                      <div className="font-bold text-[#3B6344] text-xs">{pl.anytime_goalscorer.prob}%</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-[8px] text-[#6B635B] font-sans font-bold">FAIR ODDS</div>
                                      <div className="font-bold text-[#2C2825] text-xs">{pl.anytime_goalscorer.fair_american}</div>
                                    </div>
                                    {isComparingDk && (
                                      <div className="w-20">
                                        <input
                                          type="text"
                                          placeholder="Line"
                                          value={dkGoalLine}
                                          onChange={(e) => updateDkLine(pKey + '_goal', e.target.value)}
                                          className="w-full bg-[#EBE5DC] border border-[#D9D0C1] rounded px-1.5 py-0.5 text-xs font-mono text-[#2C2825]"
                                        />
                                        {goalEV !== null && (
                                          <div className="text-[8px] font-bold text-right pt-0.5">
                                            {parseFloat(goalEV) > 0 ? <span className="text-[#3B6344]">+{goalEV}% EV</span> : <span className="text-[#8C8379]">{goalEV}% EV</span>}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    <button
                                      onClick={() => toggleParlayPick(fix, 'Anytime Goal', pl.player_name, dkGoalLine || pl.anytime_goalscorer.fair_american, pl.anytime_goalscorer.prob)}
                                      className="px-2.5 py-1 bg-[#3B4238] hover:bg-[#2C332A] text-white rounded text-xs font-bold font-mono shadow-sm"
                                    >
                                      + Add
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Parlay Builder Slip */}
      {parlayPicks.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#3B4238] border-t border-[#2C332A] p-4 shadow-2xl z-50 text-white">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#A85C3B] text-white text-xs font-black px-2 py-0.5 rounded">SLIP</span>
                <span className="text-sm font-bold">{parlayPicks.length} {parlayPicks.length === 1 ? 'Leg' : 'Legs'} Selected</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {parlayPicks.map((p) => (
                  <span key={p.pickId} className="bg-white/10 text-[#F5F2EB] text-xs px-2.5 py-1 rounded border border-white/20 flex items-center gap-1 font-mono">
                    <span className="text-[#D9D0C1] text-[10px] uppercase font-sans">{p.marketName}:</span>
                    <span className="text-[#E89274] font-bold">{p.selectionLabel}</span> ({p.oddsStr})
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] text-[#D9D0C1] font-semibold uppercase tracking-wider">Combined Fair Odds</div>
                <div className="text-lg font-black text-[#D4AF37] font-mono">{parlayMetrics.americanOdds}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-[#D9D0C1] font-semibold uppercase tracking-wider">Model Combined Prob</div>
                <div className="text-lg font-black text-white font-mono">{parlayMetrics.combinedProb}%</div>
              </div>
              <button
                onClick={() => setParlayPicks([])}
                className="bg-white/10 hover:bg-white/20 text-[#F5F2EB] text-xs font-semibold px-3 py-2 rounded border border-white/20 transition-all"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}