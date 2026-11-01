import React, { useState, useEffect } from 'react';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState('ALL');

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
        console.error('Failed to load live odds:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0E131F] text-slate-100 flex items-center justify-center font-sans">
      <div className="text-center space-y-2">
        <div className="text-xl font-bold tracking-tight text-white">U.S. SOCCER SIMULATOR</div>
        <div className="text-xs text-slate-400 font-mono">Loading matchday schedule...</div>
      </div>
    </div>
  );

  const fixtures = data?.fixtures || [];
  const metadata = data?.metadata || {};
  const stats = metadata.stats || { correct_predictions: 0, total_predictions: 0, accuracy_pct: 0.0 };
  const allLeagues = ['ALL', 'MLS', 'USL Championship', 'USL League One', 'NWSL', 'MLS NEXT Pro'];
  const filteredFixtures = selectedLeague === 'ALL' ? fixtures : fixtures.filter(f => f.league === selectedLeague);

  return (
    <div className="min-h-screen bg-[#0E131F] text-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Grounded Sports Analytics Header */}
        <header className="bg-[#182032] border border-slate-700/60 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-700 text-white font-black text-xs flex items-center justify-center rounded uppercase tracking-wider">
                USA
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                U.S. Soccer Match Odds Simulator
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Domestic league match projections & Monte Carlo probability engine
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-[#0E131F] border border-slate-700/80 rounded-lg px-4 py-2 text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Model Accuracy</div>
              <div className="text-base font-bold text-slate-100 font-mono">
                {stats.accuracy_pct.toFixed(1)}% <span className="text-xs text-slate-400 font-normal">({stats.correct_predictions}/{stats.total_predictions})</span>
              </div>
            </div>
            <div className="bg-[#0E131F] border border-slate-700/80 rounded-lg px-4 py-2 text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active Matches</div>
              <div className="text-base font-bold text-slate-100 font-mono">{metadata.fixture_count || 0} Slate</div>
            </div>
          </div>
        </header>

        {/* Clean League Navigation */}
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

        {/* Matchday Odds Slate */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white tracking-tight">Upcoming Fixtures</h2>
            <span className="text-xs text-slate-400 font-mono">
              Scraped: {metadata.generated_at ? new Date(metadata.generated_at).toLocaleTimeString() : 'N/A'}
            </span>
          </div>

          {filteredFixtures.length === 0 ? (
            <div className="bg-[#182032] border border-slate-700/60 rounded-xl p-8 text-center text-slate-400 text-sm">
              No active fixtures currently listed for {selectedLeague}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFixtures.map((fix) => (
                <div key={fix.fixture_id} className="bg-[#182032] border border-slate-700/60 rounded-xl p-5 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3 text-xs">
                      <span className="font-semibold text-red-400 uppercase tracking-wide">{fix.league}</span>
                      <span className="text-slate-400 font-mono">{new Date(fix.kickoff_iso).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="space-y-2 my-4">
                      <div className="flex justify-between items-center font-bold text-base text-white">
                        <span>{fix.home_team}</span>
                        <span className="text-xs text-slate-400 font-mono font-normal">xG {fix.simulated_odds.home_xg}</span>
                      </div>
                      <div className="text-center text-[10px] text-slate-500 font-semibold tracking-widest">VS</div>
                      <div className="flex justify-between items-center font-bold text-base text-white">
                        <span>{fix.away_team}</span>
                        <span className="text-xs text-slate-400 font-mono font-normal">xG {fix.simulated_odds.away_xg}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0E131F] p-3 rounded-lg border border-slate-800 mt-2">
                    <div className="grid grid-cols-3 text-center gap-1 font-mono text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 font-sans font-semibold">HOME</div>
                        <div className="text-slate-100 font-bold">{fix.simulated_odds.odds.home}</div>
                        <div className="text-[10px] text-slate-400">{fix.simulated_odds.probabilities.home}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-sans font-semibold">DRAW</div>
                        <div className="text-slate-100 font-bold">{fix.simulated_odds.odds.draw}</div>
                        <div className="text-[10px] text-slate-400">{fix.simulated_odds.probabilities.draw}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-sans font-semibold">AWAY</div>
                        <div className="text-slate-100 font-bold">{fix.simulated_odds.odds.away}</div>
                        <div className="text-[10px] text-slate-400">{fix.simulated_odds.probabilities.away}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
