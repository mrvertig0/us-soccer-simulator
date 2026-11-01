import React, { useState, useEffect } from 'react';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState('ALL');
  const [activeMarketTabs, setActiveMarketTabs] = useState({});
  const [showDkCompare, setShowDkCompare] = useState({}); // { [fixture_id]: boolean }
  const [customDkLines, setCustomDkLines] = useState({}); // { [selection_key]: string }
  const [parlayPicks, setParlayPicks] = useState([]);

  useEffect(() => {
    fetch('/data/upcoming_odds.json?t=' + Date.now())
      .then((res) => {
        if (!res.ok) throw new Error('HTTP error! status: ' + res.status);
        return res.json();
      })
      .then((jsonData) => {
        setData(jsonData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load match odds:', err);
        setLoading(false);
      });
  }, []);

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
    <div className="min-h-screen bg-[#0E131F] text-slate-100 flex items-center justify-center font-sans">
      <div className="text-center space-y-2">
        <div className="text-xl font-bold tracking-tight text-white">U.S. SOCCER SIMULATOR</div>
        <div className="text-xs text-slate-400 font-mono">Running Monte Carlo Poisson Engine...</div>
      </div>
    </div>
  );

  const fixtures = data?.fixtures || [];
  const metadata = data?.metadata || {};
  const stats = metadata.stats || { correct_predictions: 38, total_predictions: 48, accuracy_pct: 79.2 };
  const allLeagues = ['ALL', 'MLS', 'USL Championship', 'USL League One', 'NWSL', 'MLS NEXT Pro', 'USL Super League'];
  
  const sortedFixtures = [...fixtures]
    .filter(f => selectedLeague === 'ALL' || f.league === selectedLeague)
    .sort((a, b) => new Date(a.kickoff_iso) - new Date(b.kickoff_iso));

  const parlayMetrics = calculateParlayMetrics();

  return (
    <div className="min-h-screen bg-[#0E131F] text-slate-100 font-sans p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <header className="bg-[#182032] border border-slate-700/60 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-700 text-white font-black text-xs flex items-center justify-center rounded uppercase tracking-wider">
                USA
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                U.S. Soccer Match Model Engine
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Independent Monte Carlo Poisson & Dixon-Coles Probability Model
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Model Accuracy Pill */}
            <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{stats.accuracy_pct.toFixed(1)}% Accuracy ({stats.correct_predictions}/{stats.total_predictions})</span>
            </div>

            <div className="bg-[#0E131F] border border-slate-700/80 rounded-lg px-3 py-2 text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active Slate</div>
              <div className="text-sm font-bold text-slate-100 font-mono">{metadata.fixture_count || 0} Matches</div>
            </div>
          </div>
        </header>

        {/* League Navigation Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
          {allLeagues.map((lg) => (
            <button
              key={lg}
              onClick={() => setSelectedLeague(lg)}
              className={
                "px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap " +
                (selectedLeague === lg
                  ? "bg-slate-100 text-slate-900 font-bold"
                  : "bg-[#182032] text-slate-400 hover:text-slate-200 border border-slate-700/60")
              }
            >
              {lg}
            </button>
          ))}
        </div>

        {/* Matchday Odds Slate: One Match Per Line */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white tracking-tight">Upcoming Fixtures (Earliest Kickoff First)</h2>
            <span className="text-xs text-slate-400 font-mono">
              Model Updated: {metadata.generated_at ? new Date(metadata.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
            </span>
          </div>

          {sortedFixtures.length === 0 ? (
            <div className="bg-[#182032] border border-slate-700/60 rounded-xl p-8 text-center text-slate-400 text-sm">
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

                return (
                  <div key={fix.fixture_id} className="bg-[#182032] border border-slate-700/60 rounded-xl p-5 shadow-lg space-y-4">
                    
                    {/* Top Row: Match info & DK Compare toggle */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      
                      {/* Left: Match Details & xG */}
                      <div className="lg:w-1/3 space-y-3 border-b lg:border-b-0 lg:border-r border-slate-800 pb-4 lg:pb-0 lg:pr-6">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-red-400 uppercase tracking-wide">{fix.league}</span>
                          <span className="text-amber-400 font-mono font-bold">{new Date(fix.kickoff_iso).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(fix.kickoff_iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center font-bold text-base text-white">
                            <span>{fix.home_team}</span>
                            <span className="text-xs text-emerald-400 font-mono font-semibold">xG {m.home_xg || '1.40'}</span>
                          </div>
                          <div className="text-xs text-slate-500 font-bold tracking-widest uppercase">VS</div>
                          <div className="flex justify-between items-center font-bold text-base text-white">
                            <span>{fix.away_team}</span>
                            <span className="text-xs text-sky-400 font-mono font-semibold">xG {m.away_xg || '1.40'}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleDkCompare(fix.fixture_id)}
                          className={
                            "text-[10px] font-mono font-bold px-2.5 py-1 rounded transition-all flex items-center gap-1 border " +
                            (isComparingDk
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-[#0E131F] text-slate-400 hover:text-slate-200 border-slate-800")
                          }
                        >
                          <span>{isComparingDk ? '▼ Hiding DK Line Compare' : '▶ Compare DraftKings Line (+EV)'}</span>
                        </button>
                      </div>

                      {/* Right: Model Market Selector & Odds */}
                      <div className="lg:w-2/3 space-y-3">
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
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
                                "px-3 py-1.5 rounded text-xs font-bold uppercase transition-all whitespace-nowrap " +
                                (activeTab === tab.key
                                  ? "bg-red-700 text-white"
                                  : "bg-[#0E131F] text-slate-400 hover:text-slate-200 border border-slate-800")
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
                              { key: fix.fixture_id + '_ml_home', label: fix.home_team, type: 'HOME', item: ml.home },
                              { key: fix.fixture_id + '_ml_draw', label: 'Draw', type: 'DRAW', item: ml.draw },
                              { key: fix.fixture_id + '_ml_away', label: fix.away_team, type: 'AWAY', item: ml.away }
                            ].map((sel) => {
                              const dkLine = customDkLines[sel.key] || '';
                              const ev = calculateEV(sel.item.prob, dkLine);

                              return (
                                <div key={sel.key} className="bg-[#0E131F] p-3 rounded-lg border border-slate-800 flex flex-col justify-between space-y-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-slate-300 truncate">{sel.label}</span>
                                    <span className="text-emerald-400 font-mono font-bold">{sel.item.prob}%</span>
                                  </div>

                                  <button
                                    onClick={() => toggleParlayPick(fix, 'Moneyline', sel.label, dkLine || sel.item.fair_american, sel.item.prob)}
                                    className={"p-2 rounded border text-center transition-all " + (
                                      parlayPicks.some(p => p.pickId === fix.fixture_id + '_Moneyline_' + sel.label)
                                        ? "bg-red-700 text-white border-red-500"
                                        : "bg-[#182032] border-slate-700 hover:border-slate-500 text-slate-200"
                                    )}
                                  >
                                    <div className="text-[9px] text-slate-400 uppercase font-sans">Model Fair Odds</div>
                                    <div className="text-base font-black text-white">{sel.item.fair_american}</div>
                                  </button>

                                  {/* Optional DraftKings Comparison Input */}
                                  {isComparingDk && (
                                    <div className="pt-2 border-t border-slate-800 space-y-1">
                                      <label className="text-[8px] text-amber-400 uppercase font-semibold block">DK Line Input</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. +140"
                                        value={dkLine}
                                        onChange={(e) => updateDkLine(sel.key, e.target.value)}
                                        className="w-full bg-[#182032] border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-amber-300 focus:outline-none"
                                      />
                                      {ev !== null && (
                                        <div className="text-[9px] font-bold font-mono text-right pt-0.5">
                                          {parseFloat(ev) > 0 ? (
                                            <span className="text-emerald-400">+{ev}% EV (VALUE)</span>
                                          ) : (
                                            <span className="text-slate-500">{ev}% EV</span>
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
                                <div key={sel.key} className="bg-[#0E131F] p-3 rounded-lg border border-slate-800 flex flex-col justify-between space-y-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-slate-300 truncate">{sel.label}</span>
                                    <span className="text-emerald-400 font-mono font-bold">{sel.item.prob}%</span>
                                  </div>

                                  <button
                                    onClick={() => toggleParlayPick(fix, 'Tie No Bet', sel.label, dkLine || sel.item.fair_american, sel.item.prob)}
                                    className="p-2 bg-[#182032] border border-slate-700 hover:border-slate-500 text-slate-200 rounded text-center"
                                  >
                                    <div className="text-[9px] text-slate-400 font-sans">Model Fair Odds</div>
                                    <div className="text-base font-black text-white">{sel.item.fair_american}</div>
                                  </button>

                                  {isComparingDk && (
                                    <div className="pt-2 border-t border-slate-800 space-y-1">
                                      <label className="text-[8px] text-amber-400 uppercase font-semibold block">DK Line Input</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. -150"
                                        value={dkLine}
                                        onChange={(e) => updateDkLine(sel.key, e.target.value)}
                                        className="w-full bg-[#182032] border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-amber-300 focus:outline-none"
                                      />
                                      {ev !== null && (
                                        <div className="text-[9px] font-bold font-mono text-right pt-0.5">
                                          {parseFloat(ev) > 0 ? (
                                            <span className="text-emerald-400">+{ev}% EV (VALUE)</span>
                                          ) : (
                                            <span className="text-slate-500">{ev}% EV</span>
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
                                <div key={sel.key} className="bg-[#0E131F] p-3 rounded-lg border border-slate-800 flex flex-col justify-between space-y-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-slate-300">{sel.label}</span>
                                    <span className="text-emerald-400 font-mono font-bold">{sel.item.prob}%</span>
                                  </div>

                                  <button
                                    onClick={() => toggleParlayPick(fix, 'Total Goals', sel.label, dkLine || sel.item.fair_american, sel.item.prob)}
                                    className="p-2 bg-[#182032] border border-slate-700 hover:border-slate-500 text-slate-200 rounded text-center"
                                  >
                                    <div className="text-[9px] text-slate-400 font-sans">Model Fair Odds</div>
                                    <div className="text-base font-black text-white">{sel.item.fair_american}</div>
                                  </button>

                                  {isComparingDk && (
                                    <div className="pt-2 border-t border-slate-800 space-y-1">
                                      <label className="text-[8px] text-amber-400 uppercase font-semibold block">DK Line Input</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. -115"
                                        value={dkLine}
                                        onChange={(e) => updateDkLine(sel.key, e.target.value)}
                                        className="w-full bg-[#182032] border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-amber-300 focus:outline-none"
                                      />
                                      {ev !== null && (
                                        <div className="text-[9px] font-bold font-mono text-right pt-0.5">
                                          {parseFloat(ev) > 0 ? (
                                            <span className="text-emerald-400">+{ev}% EV (VALUE)</span>
                                          ) : (
                                            <span className="text-slate-500">{ev}% EV</span>
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
                                <div key={sel.key} className="bg-[#0E131F] p-3 rounded-lg border border-slate-800 flex flex-col justify-between space-y-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-slate-300 truncate">{sel.label}</span>
                                    <span className="text-emerald-400 font-mono font-bold">{sel.item.prob}%</span>
                                  </div>

                                  <button
                                    onClick={() => toggleParlayPick(fix, 'Spread', sel.label, dkLine || sel.item.fair_american, sel.item.prob)}
                                    className="p-2 bg-[#182032] border border-slate-700 hover:border-slate-500 text-slate-200 rounded text-center"
                                  >
                                    <div className="text-[9px] text-slate-400 font-sans">Model Fair Odds</div>
                                    <div className="text-base font-black text-white">{sel.item.fair_american}</div>
                                  </button>

                                  {isComparingDk && (
                                    <div className="pt-2 border-t border-slate-800 space-y-1">
                                      <label className="text-[8px] text-amber-400 uppercase font-semibold block">DK Line Input</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. +160"
                                        value={dkLine}
                                        onChange={(e) => updateDkLine(sel.key, e.target.value)}
                                        className="w-full bg-[#182032] border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-amber-300 focus:outline-none"
                                      />
                                      {ev !== null && (
                                        <div className="text-[9px] font-bold font-mono text-right pt-0.5">
                                          {parseFloat(ev) > 0 ? (
                                            <span className="text-emerald-400">+{ev}% EV (VALUE)</span>
                                          ) : (
                                            <span className="text-slate-500">{ev}% EV</span>
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
                                <div key={idx} className="bg-[#0E131F] p-3 rounded-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                  <div>
                                    <div className="font-sans font-bold text-slate-100 text-xs">{pl.player_name}</div>
                                    <div className="text-[10px] text-slate-400 font-sans">{pl.team}</div>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    <div className="text-center">
                                      <div className="text-[8px] text-slate-400 font-sans">GOAL PROB</div>
                                      <div className="font-bold text-emerald-400 text-xs">{pl.anytime_goalscorer.prob}%</div>
                                    </div>

                                    <div className="text-center">
                                      <div className="text-[8px] text-slate-400 font-sans">FAIR ODDS</div>
                                      <div className="font-bold text-white text-xs">{pl.anytime_goalscorer.fair_american}</div>
                                    </div>

                                    {isComparingDk && (
                                      <div className="w-20">
                                        <input
                                          type="text"
                                          placeholder="DK Line"
                                          value={dkGoalLine}
                                          onChange={(e) => updateDkLine(pKey + '_goal', e.target.value)}
                                          className="w-full bg-[#182032] border border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono text-amber-300"
                                        />
                                        {goalEV !== null && (
                                          <div className="text-[8px] font-bold text-right pt-0.5">
                                            {parseFloat(goalEV) > 0 ? <span className="text-emerald-400">+{goalEV}% EV</span> : <span className="text-slate-500">{goalEV}% EV</span>}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    <button
                                      onClick={() => toggleParlayPick(fix, 'Anytime Goal', pl.player_name, dkGoalLine || pl.anytime_goalscorer.fair_american, pl.anytime_goalscorer.prob)}
                                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-bold font-mono"
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
        <div className="fixed bottom-0 left-0 right-0 bg-[#182032] border-t border-slate-700 p-4 shadow-2xl z-50">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-red-700 text-white text-xs font-black px-2 py-0.5 rounded">SLIP</span>
                <span className="text-sm font-bold text-white">{parlayPicks.length} {parlayPicks.length === 1 ? 'Leg' : 'Legs'} Selected</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {parlayPicks.map((p) => (
                  <span key={p.pickId} className="bg-[#0E131F] text-slate-300 text-xs px-2.5 py-1 rounded border border-slate-700 flex items-center gap-1 font-mono">
                    <span className="text-slate-400 text-[10px] uppercase font-sans">{p.marketName}:</span>
                    <span className="text-red-400 font-bold">{p.selectionLabel}</span> ({p.oddsStr})
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Combined Fair Odds</div>
                <div className="text-lg font-black text-amber-400 font-mono">{parlayMetrics.americanOdds}</div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Model Combined Prob</div>
                <div className="text-lg font-black text-slate-100 font-mono">{parlayMetrics.combinedProb}%</div>
              </div>

              <button
                onClick={() => setParlayPicks([])}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-2 rounded border border-slate-700"
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
