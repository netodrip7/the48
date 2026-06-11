"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";
import Link from "next/link";

const INDEX_CONFIG = [
  {
    id: "gfis",
    label: "GFIS",
    title: "Geopolitical Stability Index",
    desc: "Measures off-pitch stability as a drag coefficient on expected tournament performance. Higher score = more stable environment = less institutional drag.",
    color: "#00e5cc",
    file: "/data/gfis_scores.csv",
    cols: [
      { key: "country",    label: "Nation"    },
      { key: "gfis_score", label: "GFIS Score", isScore: true },
    ],
    scoreKey: "gfis_score",
  },
  {
    id: "mes",
    label: "MES",
    title: "Momentum Elasticity Score",
    desc: "A nation's historical ability to recover from setbacks, resist collapse under pressure, and perform in penalty shootouts. Higher = more elastic.",
    color: "#ff4d4d",
    file: "/data/mes_scores.csv",
    cols: [
      { key: "team",             label: "Nation"       },
      { key: "mes_score",        label: "MES Score",    isScore: true },
      { key: "mes_live",         label: "Live"          },
      { key: "elasticity_score", label: "Elasticity"    },
      { key: "collapse_score",   label: "Resilience"    },
      { key: "penalty_score",    label: "Penalties"     },
    ],
    scoreKey: "mes_score",
  },
  {
    id: "sci",
    label: "SCI",
    title: "Structural Capability Index",
    desc: "Measures structural resource efficiency — how much a nation extracts from its FIFA ranking, historical record, and squad investment relative to its means.",
    color: "#f5a623",
    file: "/data/sci_scores.csv",
    cols: [
      { key: "country",          label: "Nation"      },
      { key: "sci_score",        label: "SCI Score",   isScore: true },
      { key: "ranking_score",    label: "Ranking"      },
      { key: "historical_score", label: "History"      },
      { key: "efficiency_score", label: "Efficiency"   },
    ],
    scoreKey: "sci_score",
  },
  {
    id: "tps",
    label: "TPS",
    title: "Tactical Portability Score",
    desc: "Player-level index measuring how well a player's club tactical profile translates to their national team system. Includes top 2 club recommendations.",
    color: "#a8e63d",
    file: "/data/tps_scores.csv",
    cols: [
      { key: "name",          label: "Player"       },
      { key: "national_team", label: "Nation"       },
      { key: "tps_static",    label: "TPS Score",    isScore: true },
      { key: "tps_live",      label: "Live"          },
      { key: "club",          label: "Club"          },
      { key: "top3_clubs",    label: "Best Club Fits" },
    ],
    scoreKey: "tps_static",
  },
];

type Row = Record<string, string>;

function IndexTable({
  config,
  data,
}: {
  config: (typeof INDEX_CONFIG)[0];
  data: Row[];
}) {
  const [sortKey, setSortKey]   = useState(config.scoreKey);
  const [sortDir, setSortDir]   = useState<"asc" | "desc">("desc");
  const [search,  setSearch]    = useState("");
  const [country, setCountry]   = useState("All");

  const countries = config.id === "tps"
    ? ["All", ...Array.from(new Set(data.map((r) => r.national_team))).sort()]
    : [];

  const filtered = data
    .filter((r) => {
      const nameKey = config.id === "mes" ? "team" : config.id === "tps" ? "name" : "country";
      const name = (r[nameKey] || "").toLowerCase();
      const matchSearch = name.includes(search.toLowerCase());
      const matchCountry = country === "All" || r.national_team === country;
      return matchSearch && matchCountry;
    })
    .sort((a, b) => {
      const av = parseFloat(a[sortKey]) || 0;
      const bv = parseFloat(b[sortKey]) || 0;
      return sortDir === "desc" ? bv - av : av - bv;
    });

  const handleSort = (key: string) => {
    if (key === sortKey) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const maxScore = Math.max(...data.map((r) => parseFloat(r[config.scoreKey]) || 0));

  return (
    <div id={config.id} style={{ marginBottom: "5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="section-eyebrow">{config.label}</div>
        <h2 className="section-title">{config.title}</h2>
        <p className="serif" style={{ color: "var(--text-muted)", fontSize: "0.95rem", maxWidth: "680px", marginBottom: "1.5rem" }}>
          {config.desc}
        </p>

        {/* Controls */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder={config.id === "tps" ? "Search player..." : "Search nation..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              padding: "0.5rem 1rem",
              fontSize: "0.8rem",
              fontFamily: "var(--font-ui)",
              outline: "none",
              width: "200px",
            }}
          />
          {config.id === "tps" && (
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                padding: "0.5rem 1rem",
                fontSize: "0.8rem",
                fontFamily: "var(--font-ui)",
                outline: "none",
              }}
            >
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", border: "1px solid var(--border)" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "3rem" }}>#</th>
              {config.cols.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{ color: sortKey === col.key ? "var(--text-primary)" : undefined }}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span style={{ marginLeft: "0.25rem", opacity: 0.6 }}>
                      {sortDir === "desc" ? "↓" : "↑"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => {
              const score = parseFloat(row[config.scoreKey]) || 0;
              const pct   = maxScore > 0 ? (score / maxScore) * 100 : 0;
              return (
                <tr key={i}>
                  <td className="rank-num">{i + 1}</td>
                  {config.cols.map((col) => (
                    <td key={col.key}>
                      {col.isScore ? (
                        <div className="score-bar">
                          <span style={{ minWidth: "3.5rem", fontWeight: 500 }}>
                            {parseFloat(row[col.key] || "0").toFixed(1)}
                          </span>
                          <div
                            className="score-fill"
                            style={{
                              width: `${pct}px`,
                              maxWidth: "120px",
                              "--accent-color": config.color,
                            } as React.CSSProperties}
                          />
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                          {row[col.key] || "—"}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divider" style={{ marginTop: "3rem" }} />
    </div>
  );
}

export default function IndicesPage() {
  const [datasets, setDatasets] = useState<Record<string, Row[]>>({});
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function loadAll() {
      const results: Record<string, Row[]> = {};
      await Promise.all(
        INDEX_CONFIG.map(
          (cfg) =>
            new Promise<void>((resolve) => {
              Papa.parse(cfg.file, {
                download: true,
                header: true,
                complete: (res) => {
                  results[cfg.id] = res.data as Row[];
                  resolve();
                },
                error: () => resolve(),
              });
            })
        )
      );
      setDatasets(results);
      setLoading(false);
    }
    loadAll();
  }, []);

  return (
    <div className="section" style={{ paddingTop: "4rem" }}>
      {/* Page header */}
      <div style={{ marginBottom: "4rem", borderBottom: "1px solid var(--border)", paddingBottom: "3rem" }}>
        <p className="section-eyebrow">The 48 Analytics</p>
        <h1 className="section-title">The Indices</h1>
        <p className="serif" style={{ color: "var(--text-muted)", fontSize: "1.05rem", fontStyle: "italic" }}>
          Four original frameworks. One tournament. Forty-eight nations.
        </p>
        {/* Jump links */}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem", flexWrap: "wrap" }}>
          {INDEX_CONFIG.map((cfg) => (
            <a
              key={cfg.id}
              href={`#${cfg.id}`}
              className="btn"
              style={{ "--accent-color": cfg.color, borderColor: cfg.color, color: cfg.color } as React.CSSProperties}
            >
              {cfg.label}
            </a>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-ui)", fontSize: "0.85rem", letterSpacing: "0.1em" }}>
          LOADING DATA...
        </div>
      ) : (
        INDEX_CONFIG.map((cfg) => (
          <IndexTable
            key={cfg.id}
            config={cfg}
            data={datasets[cfg.id] || []}
          />
        ))
      )}
    </div>
  );
}