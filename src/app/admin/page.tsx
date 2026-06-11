"use client";

import { useState, useRef, useEffect } from "react";

const ADMIN_PASSWORD = "the48admin"; // change this

type Cell = { letter: string; black: boolean; number?: number };
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

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = `You are a crossword puzzle constructor for "The 48", a World Cup 2026 analytics website.

Your job is to help build a 5x5 NYT Mini-style crossword puzzle.

Rules:
- 5x5 grid
- Words are 2-5 letters (occasionally 2, mostly 3-5)
- All across and down entries must be real words or valid proper nouns
- Black squares must be rotationally symmetric
- Every white square must be part of both an across and a down entry
- Themes: today's WC matches, goals scored, player names, stadium cities, football history, geography, social media moments from the day

When the user gives you a theme or match context, suggest:
1. A set of answers that interlock on a 5x5 grid
2. The grid layout (use # for black squares, letters for filled squares)
3. Clues for each entry

When you have a complete puzzle ready to publish, output a JSON block formatted EXACTLY like this (no markdown, just the raw JSON inside <PUZZLE> tags):

<PUZZLE>
{
  "date": "June 15, 2026",
  "theme": "Opening Day",
  "grid": [
    [{"letter":"G","black":false,"number":1},{"letter":"O","black":false},{"letter":"A","black":false},{"letter":"L","black":false},{"letter":"S","black":false,"number":2}],
    [{"letter":"#","black":true},{"letter":"#","black":true},{"letter":"#","black":true},{"letter":"#","black":true},{"letter":"#","black":true}],
    ...5 rows total
  ],
  "clues": [
    {"number":1,"direction":"across","clue":"What a striker wants","answer":"GOALS","row":0,"col":0,"length":5},
    {"number":2,"direction":"down","clue":"Spain's tournament abbreviation","answer":"SPN","row":0,"col":4,"length":3}
  ]
}
</PUZZLE>

Be conversational and collaborative. Suggest words, ask for feedback, iterate until the puzzle is ready.`;

function GridPreview({ puzzle }: { puzzle: Puzzle | null }) {
  if (!puzzle) return null;
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(5, 36px)",
      gridTemplateRows: "repeat(5, 36px)",
      gap: "2px",
      background: "var(--border)",
      border: "2px solid var(--border)",
      marginTop: "1rem",
    }}>
      {puzzle.grid.map((row, r) =>
        row.map((cell, c) => (
          <div
            key={`${r}-${c}`}
            style={{
              width: 36,
              height: 36,
              background: cell.black ? "var(--text-faint)" : "var(--surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display)",
              fontSize: "0.85rem",
              color: "var(--teal)",
              position: "relative",
            }}
          >
            {cell.number && (
              <span style={{
                position: "absolute", top: 1, left: 2,
                fontSize: "0.45rem", color: "var(--text-muted)",
                fontFamily: "var(--font-ui)", fontWeight: 600,
              }}>
                {cell.number}
              </span>
            )}
            {!cell.black && cell.letter}
          </div>
        ))
      )}
    </div>
  );
}

export default function AdminPage() {
  const [authed,    setAuthed]    = useState(false);
  const [password,  setPassword]  = useState("");
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [puzzle,    setPuzzle]    = useState<Puzzle | null>(null);
  const [published, setPublished] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAuth = () => {
    if (password === ADMIN_PASSWORD) setAuthed(true);
  };

  const extractPuzzle = (text: string): Puzzle | null => {
    const match = text.match(/<PUZZLE>([\s\S]*?)<\/PUZZLE>/);
    if (!match) return null;
    try { return JSON.parse(match[1].trim()); }
    catch { return null; }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      const text = data.content?.map((b: any) => b.text || "").join("") || "No response.";
      const assistantMsg: Message = { role: "assistant", content: text };
      setMessages((prev) => [...prev, assistantMsg]);

      const extracted = extractPuzzle(text);
      if (extracted) setPuzzle(extracted);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error connecting to Claude API." }]);
    }
    setLoading(false);
  };

  const handlePublish = () => {
    if (!puzzle) return;
    const json = JSON.stringify(puzzle, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "crossword.json";
    a.click();
    setPublished(true);
    setTimeout(() => setPublished(false), 3000);
  };

  if (!authed) return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", letterSpacing: "0.08em", marginBottom: "1.5rem" }}>
          ADMIN
        </div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAuth()}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            padding: "0.75rem 1.25rem",
            fontFamily: "var(--font-ui)",
            fontSize: "0.9rem",
            outline: "none",
            display: "block",
            width: "260px",
            marginBottom: "1rem",
          }}
        />
        <button onClick={handleAuth} className="btn btn-accent" style={{ width: "100%" }}>
          Enter
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "calc(100vh - 56px)", background: "var(--bg)" }}>
      {/* Chat panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)" }}>
        {/* Header */}
        <div style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid var(--border)",
          fontFamily: "var(--font-display)",
          fontSize: "1rem",
          letterSpacing: "0.1em",
          color: "var(--text-muted)",
        }}>
          CROSSWORD BUILDER
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {messages.length === 0 && (
            <div style={{ color: "var(--text-faint)", fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "0.9rem" }}>
              Start by telling Claude what happened today — matches, goals, notable moments. Example: "Germany beat Curaçao 3-0, Gnabry scored twice."
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                background: msg.role === "user" ? "rgba(0,229,204,0.08)" : "var(--surface)",
                border: `1px solid ${msg.role === "user" ? "var(--teal)" : "var(--border)"}`,
                padding: "0.75rem 1rem",
                fontSize: "0.85rem",
                lineHeight: 1.6,
                color: "var(--text-primary)",
                fontFamily: msg.role === "user" ? "var(--font-ui)" : "var(--font-serif)",
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.content.replace(/<PUZZLE>[\s\S]*?<\/PUZZLE>/, "[Puzzle extracted →]")}
            </div>
          ))}
          {loading && (
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", letterSpacing: "0.1em" }}>
              THINKING...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", gap: "0.75rem" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Describe today's matches or give feedback on the puzzle..."
            style={{
              flex: 1,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              padding: "0.6rem 1rem",
              fontFamily: "var(--font-ui)",
              fontSize: "0.85rem",
              outline: "none",
            }}
          />
          <button onClick={sendMessage} className="btn btn-accent" disabled={loading} style={{ fontSize: "0.7rem" }}>
            Send
          </button>
        </div>
      </div>

      {/* Preview panel */}
      <div style={{ width: "320px", padding: "1.5rem", overflowY: "auto" }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: "0.9rem",
          letterSpacing: "0.1em",
          color: "var(--text-muted)",
          marginBottom: "1rem",
        }}>
          PUZZLE PREVIEW
        </div>

        {!puzzle ? (
          <div style={{ color: "var(--text-faint)", fontSize: "0.8rem", fontStyle: "italic", fontFamily: "var(--font-serif)" }}>
            Puzzle preview will appear here once Claude generates one.
          </div>
        ) : (
          <>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>{puzzle.date}</div>
            <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
              {puzzle.theme}
            </div>

            <GridPreview puzzle={puzzle} />

            <div style={{ marginTop: "1.5rem" }}>
              {["across", "down"].map((dir) => (
                <div key={dir} style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: "0.5rem" }}>
                    {dir}
                  </div>
                  {puzzle.clues.filter((c) => c.direction === dir).sort((a, b) => a.number - b.number).map((clue) => (
                    <div key={clue.number} style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", lineHeight: 1.4 }}>
                      <span style={{ color: "var(--teal)", fontWeight: 600, marginRight: "0.4rem" }}>{clue.number}</span>
                      {clue.clue} <span style={{ color: "var(--text-faint)" }}>({clue.answer})</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <button
              onClick={handlePublish}
              className="btn btn-accent"
              style={{ width: "100%", marginTop: "1rem", justifyContent: "center" }}
            >
              {published ? "Downloaded!" : "Download crossword.json"}
            </button>
            <div style={{ fontSize: "0.7rem", color: "var(--text-faint)", marginTop: "0.5rem", lineHeight: 1.5 }}>
              Move the downloaded file to <code style={{ color: "var(--text-muted)" }}>website/public/data/crossword.json</code>
            </div>
          </>
        )}
      </div>
    </div>
  );
}