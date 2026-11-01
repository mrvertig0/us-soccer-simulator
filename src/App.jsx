import React, { useState, useEffect } from 'react';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Add timestamp cache-busting to prevent browser & CDN caching
    fetch(`/data/upcoming_odds.json?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((jsonData) => {
        setData(jsonData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load live odds:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading live odds slate...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading odds: {error}</div>;

  const fixtures = data?.fixtures || [];
  const metadata = data?.metadata || {};

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">US Soccer Odds & Accuracy Tracker</h1>
          <p className="text-xs text-slate-400">
            Last Updated: {metadata.generated_at ? new Date(metadata.generated_at).toLocaleString() : 'N/A'}
          </p>
        </div>
        <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-mono text-emerald-400 border border-emerald-500/30">
          Status: {metadata.scraper_status || 'Offline'} ({metadata.fixture_count || 0} Fixtures)
        </div>
      </header>

      <main className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fixtures.length === 0 ? (
          <p className="text-slate-500 col-span-full">No active fixtures found for the selected period.</p>
        ) : (
          fixtures.map((fix) => (
            <div key={fix.fixture_id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
              <div className="flex justify-between items-center mb-3 text-xs text-slate-400">
                <span className="font-semibold text-emerald-400 uppercase tracking-wider">{fix.league}</span>
                <span>{new Date(fix.kickoff_iso).toLocaleDateString()}</span>
              </div>
              <div className="text-lg font-bold mb-4">
                <div>{fix.home_team}</div>
                <div className="text-xs text-slate-500 font-normal my-1">vs</div>
                <div>{fix.away_team}</div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-900/60 p-3 rounded-lg font-mono">
                <div>
                  <div className="text-slate-400 text-[10px]">HOME</div>
                  <div className="text-emerald-400 font-bold">{fix.simulated_odds.odds.home}</div>
                  <div className="text-[10px] text-slate-500">{fix.simulated_odds.probabilities.home}%</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">DRAW</div>
                  <div className="text-amber-400 font-bold">{fix.simulated_odds.odds.draw}</div>
                  <div className="text-[10px] text-slate-500">{fix.simulated_odds.probabilities.draw}%</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">AWAY</div>
                  <div className="text-sky-400 font-bold">{fix.simulated_odds.odds.away}</div>
                  <div className="text-[10px] text-slate-500">{fix.simulated_odds.probabilities.away}%</div>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}