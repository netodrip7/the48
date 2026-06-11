"use client";

import { useState, useEffect, useRef } from "react";

// ── Puzzle type ───────────────────────────────────────────────────────────────
type Cell = {
  letter: string;
  black: boolean;
  number?: number;
};

type Clue = {
  number: number;
  direction: "across" | "down";
  clue: string;
  answer: string;
  row: number;
  col: number;
  length: number;
};

type Puzzle = {
  date: string;
  theme: string;
  grid: Cell[][];
  clues: Clue[];
};

// ── Empty puzzle shown before one is loaded ───────────────────────────────────
const EMPTY_PUZZLE: Puzzle = {
  date:  "",
  theme: "",
  grid:  Array(5).fill(null).map(() =>
    Array(5).fill(null).map(() => ({ letter: "", black: false }))
  ),
  clues: [],
};

// ── Share result ──────────────────────────────────────────────────────────────
function buildShareText(
  date: string,
  timeStr: string,
  clues: Clue[],
  userAnswers: Record<string, string>,
  hintsUsed: Record<string, boolean>
): string {
  const across = clues.filter((c) => c.direction === "across");
  const down   = clues.filter((c) => c.direction === "down");
  const ordered = [...across, ...down];

  const emoji = ordered.map((clue) => {
    const key = `${clue.direction}-${clue.number}`;
    if (hintsUsed[key]) return "⬛";
    const userWord = Array.from({ length: clue.length }, (_, i) => {
      const r = clue.direction === "across" ? clue.row : clue.row + i;
      const c = clue.direction === "across" ? clue.col + i : clue.col;
      return (userAnswers[`${r}-${c}`] || "").toUpperCase();
    }).join("");
    return userWord === clue.answer.toUpperCase() ? "🟩" : "🟨";
  }).join("");

  return `The 48 WC Mini Crossword · ${date} · ${timeStr} · ${emoji}\nthe48.vercel.app/crossword`;
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function useTimer(running: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);
  const format = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return { seconds, format };
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CrosswordPage() {
  const [puzzle,      setPuzzle]      = useState<Puzzle | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [selected,    setSelected]    = useState<{ row: number; col: number } | null>(null);
  const [direction,   setDirection]   = useState<"across" | "down">("across");
  const [hintsUsed,   setHintsUsed]   = useState<Record<string, boolean>>({});
  const [solved,      setSolved]      = useState(false);
  const [shared,      setShared]      = useState(false);
  const [loading,     setLoading]     = useState(true);
  const inputRefs     = useRef<Record<string, HTMLInputElement>>({});
  const { seconds, format } = useTimer(!solved && puzzle !== null);

  // Load today's puzzle
  useEffect(() => {
    fetch("/data/crossword.json")
      .then((r) => r.json())
      .then((data) => { setPuzzle(data); setLoading(false); })
      .catch(() => { setPuzzle(EMPTY_PUZZLE); setLoading(false); });
  }, []);

  // Check if solved
  useEffect(() => {
    if (!puzzle || puzzle.clues.length === 0) return;
    const allCorrect = puzzle.clues.every((clue) => {
      return Array.from({ length: clue.length }, (_, i) => {
        const r = clue.direction === "across" ? clue.row : clue.row + i;
        const c = clue.direction === "across" ? clue.col + i : clue.col;
        return (userAnswers[`${r}-${c}`] || "").toUpperCase() === clue.answer[i].toUpperCase();
      }).every(Boolean);
    });
    if (allCorrect && Object.keys(userAnswers).length > 0) setSolved(true);
  }, [userAnswers, puzzle]);

  if (loading) return (
    <div className="section" style={{ paddingTop: "4rem", color: "var(--text-muted)", letterSpacing: "0.1em", fontSize: "0.85rem" }}>
      LOADING PUZZLE...
    </div>
  );

  if (!puzzle || puzzle.clues.length === 0) return (
    <div className="section" style={{ paddingTop: "4rem" }}>
      <p className="section-eyebrow">The 48</p>
      <h1 className="section-title">Mini Crossword</h1>
      <p style={{ color: "var(--text-muted)", marginTop: "1rem", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
        Today's puzzle hasn't been published yet. Check back soon.
      </p>
    </div>
  );

  const getActiveClue = (): Clue | null => {
    if (!selected) return null;
    return puzzle.clues.find((c) => {
      if (c.direction !== direction) return false;
      if (direction === "across") return c.row === selected.row && selected.col >= c.col && selected.col < c.col + c.length;
      return c.col === selected.col && selected.row >= c.row && selected.row < c.row + c.length;
    }) || null;
  };

  const handleCellClick = (row: number, col: number) => {
    if (puzzle.grid[row][col].black) return;
    if (selected?.row === row && selected?.col === col) {
      setDirection((d) => d === "across" ? "down" : "across");
    } else {
      setSelected({ row, col });
    }
  };

  const handleInput = (row: number, col: number, value: string) => {
    const letter = value.slice(-1).toUpperCase();
    setUserAnswers((prev) => ({ ...prev, [`${row}-${col}`]: letter }));
    // Auto-advance
    if (letter) {
      if (direction === "across" && col + 1 < 5 && !puzzle.grid[row][col + 1].black) {
        setSelected({ row, col: col + 1 });
        inputRefs.current[`${row}-${col + 1}`]?.focus();
      } else if (direction === "down" && row + 1 < 5 && !puzzle.grid[row + 1][col].black) {
        setSelected({ row: row + 1, col });
        inputRefs.current[`${row + 1}-${col}`]?.focus();
      }
    }
  };

  const handleKeyDown = (row: number, col: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !userAnswers[`${row}-${col}`]) {
      if (direction === "across" && col > 0 && !puzzle.grid[row][col - 1].black) {
        setSelected({ row, col: col - 1 });
        inputRefs.current[`${row}-${col - 1}`]?.focus();
      } else if (direction === "down" && row > 0 && !puzzle.grid[row - 1][col].black) {
        setSelected({ row: row - 1, col });
        inputRefs.current[`${row - 1}-${col}`]?.focus();
      }
    }
  };

  const handleReveal = () => {
    const activeClue = getActiveClue();
    if (!activeClue) return;
    const key = `${activeClue.direction}-${activeClue.number}`;
    const revealed: Record<string, string> = {};
    Array.from({ length: activeClue.length }, (_, i) => {
      const r = activeClue.direction === "across" ? activeClue.row : activeClue.row + i;
      const c = activeClue.direction === "across" ? activeClue.col + i : activeClue.col;
      revealed[`${r}-${c}`] = activeClue.answer[i].toUpperCase();
    });
    setUserAnswers((prev) => ({ ...prev, ...revealed }));
    setHintsUsed((prev) => ({ ...prev, [key]: true }));
  };

  const handleShare = () => {
    const text = buildShareText(
      puzzle.date,
      format(seconds),
      puzzle.clues,
      userAnswers,
      hintsUsed
    );
    navigator.clipboard.writeText(text).then(() => {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    });
  };

  const activeClue = getActiveClue();
  const across = puzzle.clues.filter((c) => c.direction === "across").sort((a, b) => a.number - b.number);
  const down   = puzzle.clues.filter((c) => c.direction === "down").sort((a, b) => a.number - b.number);

  return (
    <div className="section" style={{ paddingTop: "4rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <p className="section-eyebrow">The 48 WC Mini Crossword</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: "1.5rem", flexWrap: "wrap" }}>
          <h1 className="section-title" style={{ marginBottom: 0 }}>{puzzle.date || "Today"}</h1>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
            {format(seconds)}
          </span>
        </div>
        {puzzle.theme && (
          <p className="serif" style={{ color: "var(--text-muted)", fontStyle: "italic", marginTop: "0.25rem" }}>
            Theme: {puzzle.theme}
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap", alignItems: "flex-start" }}>

        {/* Grid + controls */}
        <div>
          {/* Active clue */}
          <div style={{
            minHeight: "2.5rem",
            marginBottom: "1rem",
            fontFamily: "var(--font-serif)",
            fontSize: "0.95rem",
            color: activeClue ? "var(--text-primary)" : "var(--text-muted)",
            fontStyle: "italic",
            maxWidth: "260px",
          }}>
            {activeClue ? `${activeClue.number} ${activeClue.direction}: ${activeClue.clue}` : "Select a cell"}
          </div>

          {/* Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 52px)",
            gridTemplateRows: "repeat(5, 52px)",
            gap: "2px",
            background: "var(--border)",
            border: "2px solid var(--border)",
          }}>
            {puzzle.grid.map((row, r) =>
              row.map((cell, c) => {
                if (cell.black) return (
                  <div key={`${r}-${c}`} style={{ background: "var(--text-faint)", width: 52, height: 52 }} />
                );

                const isSelected  = selected?.row === r && selected?.col === c;
                const isHighlighted = activeClue && (
                  activeClue.direction === "across"
                    ? activeClue.row === r && c >= activeClue.col && c < activeClue.col + activeClue.length
                    : activeClue.col === c && r >= activeClue.row && r < activeClue.row + activeClue.length
                );
                const isCorrect = puzzle.clues.some((cl) => {
                  const idx = cl.direction === "across" ? c - cl.col : r - cl.row;
                  if (idx < 0 || idx >= cl.length) return false;
                  if (cl.direction === "across" && cl.row !== r) return false;
                  if (cl.direction === "down" && cl.col !== c) return false;
                  return (userAnswers[`${r}-${c}`] || "").toUpperCase() === cl.answer[idx].toUpperCase();
                });

                return (
                  <div
                    key={`${r}-${c}`}
                    style={{
                      position: "relative",
                      width: 52,
                      height: 52,
                      background: isSelected ? "var(--teal)" : isHighlighted ? "rgba(0,229,204,0.12)" : "var(--surface)",
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                    onClick={() => handleCellClick(r, c)}
                  >
                    {cell.number && (
                      <span style={{
                        position: "absolute",
                        top: 2,
                        left: 3,
                        fontSize: "0.55rem",
                        color: isSelected ? "var(--bg)" : "var(--text-muted)",
                        fontFamily: "var(--font-ui)",
                        fontWeight: 600,
                        lineHeight: 1,
                        userSelect: "none",
                      }}>
                        {cell.number}
                      </span>
                    )}
                    <input
                      ref={(el) => { if (el) inputRefs.current[`${r}-${c}`] = el; }}
                      value={userAnswers[`${r}-${c}`] || ""}
                      onChange={(e) => handleInput(r, c, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(r, c, e)}
                      maxLength={2}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        textAlign: "center",
                        fontFamily: "var(--font-display)",
                        fontSize: "1.3rem",
                        letterSpacing: "0.02em",
                        color: isSelected ? "var(--bg)" : isCorrect ? "var(--lime)" : "var(--text-primary)",
                        cursor: "pointer",
                        caretColor: "transparent",
                        paddingTop: cell.number ? "10px" : "0",
                        textTransform: "uppercase",
                      }}
                    />
                  </div>
                );
              })
            )}
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <button onClick={handleReveal} className="btn" style={{ fontSize: "0.7rem" }}>
              Reveal Word
            </button>
            {solved && (
              <button onClick={handleShare} className="btn btn-accent" style={{ fontSize: "0.7rem" }}>
                {shared ? "Copied!" : "Share Result"}
              </button>
            )}
          </div>

          {solved && (
            <div style={{
              marginTop: "1.5rem",
              padding: "1rem 1.25rem",
              border: "1px solid var(--lime)",
              background: "rgba(168,230,61,0.06)",
            }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "var(--lime)", letterSpacing: "0.08em" }}>
                Solved in {format(seconds)}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Come back tomorrow for a new puzzle.
              </div>
            </div>
          )}
        </div>

        {/* Clues */}
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", flex: 1, minWidth: "220px" }}>
          {/* Across */}
          <div style={{ flex: 1, minWidth: "180px" }}>
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: "0.9rem",
              letterSpacing: "0.12em",
              color: "var(--text-muted)",
              marginBottom: "0.75rem",
              paddingBottom: "0.5rem",
              borderBottom: "1px solid var(--border)",
            }}>
              ACROSS
            </div>
            {across.map((clue) => {
              const isActive = activeClue?.number === clue.number && activeClue?.direction === "across";
              return (
                <div
                  key={clue.number}
                  onClick={() => {
                    setSelected({ row: clue.row, col: clue.col });
                    setDirection("across");
                    inputRefs.current[`${clue.row}-${clue.col}`]?.focus();
                  }}
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginBottom: "0.5rem",
                    cursor: "pointer",
                    color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                    fontSize: "0.82rem",
                    lineHeight: 1.4,
                    transition: "color 0.15s",
                  }}
                >
                  <span style={{ fontWeight: 600, minWidth: "1.2rem", color: isActive ? "var(--teal)" : "var(--text-faint)" }}>
                    {clue.number}
                  </span>
                  <span>{clue.clue}</span>
                </div>
              );
            })}
          </div>

          {/* Down */}
          <div style={{ flex: 1, minWidth: "180px" }}>
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: "0.9rem",
              letterSpacing: "0.12em",
              color: "var(--text-muted)",
              marginBottom: "0.75rem",
              paddingBottom: "0.5rem",
              borderBottom: "1px solid var(--border)",
            }}>
              DOWN
            </div>
            {down.map((clue) => {
              const isActive = activeClue?.number === clue.number && activeClue?.direction === "down";
              return (
                <div
                  key={clue.number}
                  onClick={() => {
                    setSelected({ row: clue.row, col: clue.col });
                    setDirection("down");
                    inputRefs.current[`${clue.row}-${clue.col}`]?.focus();
                  }}
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginBottom: "0.5rem",
                    cursor: "pointer",
                    color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                    fontSize: "0.82rem",
                    lineHeight: 1.4,
                    transition: "color 0.15s",
                  }}
                >
                  <span style={{ fontWeight: 600, minWidth: "1.2rem", color: isActive ? "var(--teal)" : "var(--text-faint)" }}>
                    {clue.number}
                  </span>
                  <span>{clue.clue}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}