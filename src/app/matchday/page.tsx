"use client";

import { useState, useEffect } from "react";

const RAPIDAPI_KEY  = "0a7c4bfb1amsh3995b563e8f18bep1b6191jsn0d1106c51310";
const RAPIDAPI_HOST = "sportapi7.p.rapidapi.com";
const WC_ID         = 16;

type Match = {
  id: number;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  status: string;
  statusCode: number;
  group: string;
  time: string;
};

type Standing = {
  team: string;
  group: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getDateRange(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

function statusLabel(code: number, type: string) {
  if (type === "inprogress") return { label: "LIVE", cls: "status-live" };
  if (type === "finished")   return { label: "FT",   cls: "status-ft"   };
  return { label: "UPCOMING", cls: "status-upcoming" };
}

async function fetchMatches(date: string): Promise<Match[]> {
  const url = `https://${RAPIDAPI_HOST}/api/v1/sport/football/scheduled-events/${date}`;
  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key":  RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  const events = (data.events || []).filter(
    (e: any) => e?.tournament?.uniqueTournament?.id === WC_ID
  );
  return events.map((e: any) => ({
    id:         e.id,
    home:       e.homeTeam?.name || "",
    away:       e.awayTeam?.name || "",
    homeScore:  e.homeScore?.current ?? 0,
    awayScore:  e.awayScore?.current ?? 0,
    status:     e.status?.type || "notstarted",
    statusCode: e.status?.code || 0,
    group:      e.tournament?.groupName || "",
    time:       new Date(e.startTimestamp * 1000).toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit",
    }),
  }));
}

function MatchCard({ match }: { match: Match }) {
  const { label, cls } = statusLabel(match.statusCode, match.status);
  const finished = match.status === "finished";
  const live     = match.status === "inprogress";

  return (
    <div className="match-card" style={{ marginBottom: "1px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
        <span className="match-team" style={{ flex: 1, textAlign: "right" }}>
          {match.home}
        </span>

        <div style={{ textAlign: "center", minWidth: "80px" }}>
          {finished || live ? (
            <div className="match-score">
              {match.homeScore} – {match.awayScore}
            </div>
          ) : (
            <div style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
            }}>
              {match.time}
            </div>
          )}
          <div className={`match-status ${cls}`}>{label}</div>
        </div>

        <span className="match-team" style={{ flex: 1 }}>
          {match.away}
        </span>
      </div>

      {match.group && (
        <div style={{
          fontSize: "0.65rem",
          color: "var(--text-faint)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginLeft: "1rem",
          whiteSpace: "nowrap",
        }}>
          {match.group}
        </div>
      )}
    </div>
  );
}

function StandingsTable({ standings }: { standings: Standing[] }) {
  const groups = Array.from(new Set(standings.map((s) => s.group))).sort();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "2rem" }}>
      {groups.map((group) => {
        const rows = standings
          .filter((s) => s.group === group)
          .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
        return (
          <div key={group}>
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: "1rem",
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
              marginBottom: "0.5rem",
              paddingBottom: "0.5rem",
              borderBottom: "1px solid var(--border)",
            }}>
              {group}
            </div>
            <table className="data-table" style={{ fontSize: "0.8rem" }}>
              <thead>
                <tr>
                  <th>Team</th>
                  <th>P</th>
                  <th>W</th>
                  <th>D</th>
                  <th>L</th>
                  <th>GD</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.team}>
                    <td>
                      <span style={{ color: "var(--text-faint)", marginRight: "0.5rem", fontFamily: "var(--font-display)" }}>
                        {i + 1}
                      </span>
                      {r.team}
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>{r.played}</td>
                    <td style={{ color: "var(--text-muted)" }}>{r.won}</td>
                    <td style={{ color: "var(--text-muted)" }}>{r.drawn}</td>
                    <td style={{ color: "var(--text-muted)" }}>{r.lost}</td>
                    <td style={{ color: r.gd >= 0 ? "var(--lime)" : "var(--coral)" }}>
                      {r.gd > 0 ? "+" : ""}{r.gd}
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

export default function MatchDayPage() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [matches,      setMatches]      = useState<Match[]>([]);
  const [standings,    setStandings]    = useState<Standing[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState<"matches" | "standings">("matches");

  const quickDates = [-1, 0, 1, 2].map((offset) => ({
    date:  getDateRange(offset),
    label: offset === -1 ? "Yesterday" : offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : getDateRange(offset),
  }));

  useEffect(() => {
    setLoading(true);
    fetchMatches(selectedDate).then((m) => {
      setMatches(m);
      setLoading(false);
    });
  }, [selectedDate]);

  // Load standings from local CSV
  useEffect(() => {
    fetch("/data/standings.csv")
      .then((r) => r.text())
      .then((text) => {
        const lines = text.trim().split("\n");
        const headers = lines[0].split(",");
        const rows: Standing[] = lines.slice(1).map((line) => {
          const vals = line.split(",");
          const obj: any = {};
          headers.forEach((h, i) => { obj[h.trim()] = vals[i]?.trim(); });
          return {
            team:   obj.team   || "",
            group:  obj.group  || "",
            played: parseInt(obj.played) || 0,
            won:    parseInt(obj.won)    || 0,
            drawn:  parseInt(obj.drawn)  || 0,
            lost:   parseInt(obj.lost)   || 0,
            gf:     parseInt(obj.gf)     || 0,
            ga:     parseInt(obj.ga)     || 0,
            gd:     parseInt(obj.gd)     || 0,
            points: parseInt(obj.points) || 0,
          };
        });
        setStandings(rows.filter((r) => r.team));
      })
      .catch(() => {});
  }, []);

  const live     = matches.filter((m) => m.status === "inprogress");
  const finished = matches.filter((m) => m.status === "finished");
  const upcoming = matches.filter((m) => m.status !== "inprogress" && m.status !== "finished");

  return (
    <div className="section" style={{ paddingTop: "4rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "3rem", borderBottom: "1px solid var(--border)", paddingBottom: "2rem" }}>
        <p className="section-eyebrow">FIFA World Cup 2026</p>
        <h1 className="section-title">Match Day</h1>
        <p className="serif" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
          Live scores, results, and group standings.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", marginBottom: "2rem", borderBottom: "1px solid var(--border)" }}>
        {(["matches", "standings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid var(--teal)" : "2px solid transparent",
              color: activeTab === tab ? "var(--text-primary)" : "var(--text-muted)",
              fontFamily: "var(--font-ui)",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "0.75rem 1.5rem",
              cursor: "pointer",
              marginBottom: "-1px",
              transition: "color 0.2s",
            }}
          >
            {tab === "matches" ? "Matches" : "Standings"}
          </button>
        ))}
      </div>

      {activeTab === "matches" && (
        <>
          {/* Date selector */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
            {quickDates.map((d) => (
              <button
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                className="btn"
                style={{
                  borderColor: selectedDate === d.date ? "var(--teal)" : undefined,
                  color:       selectedDate === d.date ? "var(--teal)" : undefined,
                  fontSize: "0.7rem",
                }}
              >
                {d.label}
              </button>
            ))}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                padding: "0.5rem 0.75rem",
                fontSize: "0.75rem",
                fontFamily: "var(--font-ui)",
                outline: "none",
              }}
            />
          </div>

          {loading ? (
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", letterSpacing: "0.1em" }}>
              LOADING MATCHES...
            </div>
          ) : matches.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No World Cup matches on this date.
            </div>
          ) : (
            <div>
              {live.length > 0 && (
                <div style={{ marginBottom: "2rem" }}>
                  <div className="section-eyebrow" style={{ color: "var(--coral)", marginBottom: "0.75rem" }}>
                    Live Now
                  </div>
                  {live.map((m) => <MatchCard key={m.id} match={m} />)}
                </div>
              )}
              {finished.length > 0 && (
                <div style={{ marginBottom: "2rem" }}>
                  <div className="section-eyebrow" style={{ marginBottom: "0.75rem" }}>Results</div>
                  {finished.map((m) => <MatchCard key={m.id} match={m} />)}
                </div>
              )}
              {upcoming.length > 0 && (
                <div style={{ marginBottom: "2rem" }}>
                  <div className="section-eyebrow" style={{ marginBottom: "0.75rem" }}>Upcoming</div>
                  {upcoming.map((m) => <MatchCard key={m.id} match={m} />)}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === "standings" && (
        <div>
          {standings.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Standings will appear once matches have been played and live_update.py has been run.
            </div>
          ) : (
            <StandingsTable standings={standings} />
          )}
        </div>
      )}
    </div>
  );
}