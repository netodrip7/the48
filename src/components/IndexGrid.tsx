"use client";

import Link from "next/link";

const indices = [
  {
    id:      "gfis",
    label:   "GFIS",
    title:   "Geopolitical Stability",
    desc:    "Off-pitch stability as a drag coefficient on expected performance.",
    color:   "#00e5cc",
    href:    "/indices#gfis",
  },
  {
    id:      "mes",
    label:   "MES",
    title:   "Momentum Elasticity",
    desc:    "A nation's ability to recover from setbacks and resist collapse.",
    color:   "#ff4d4d",
    href:    "/indices#mes",
  },
  {
    id:      "sci",
    label:   "SCI",
    title:   "Structural Capability",
    desc:    "Resource efficiency — how much a nation extracts from what it has.",
    color:   "#f5a623",
    href:    "/indices#sci",
  },
  {
    id:      "tps",
    label:   "TPS",
    title:   "Tactical Portability",
    desc:    "How well a squad's club style translates to international football.",
    color:   "#a8e63d",
    href:    "/indices#tps",
  },
];

export default function IndexGrid() {
  return (
    <section style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
      <div className="grid-4">
        {indices.map((idx) => (
          <div
            key={idx.id}
            className="index-card"
            style={{ "--accent-color": idx.color } as React.CSSProperties}
          >
            <div className="index-card-label">{idx.label}</div>
            <div className="index-card-title">{idx.title}</div>
            <div className="index-card-desc">{idx.desc}</div>
            <Link href={idx.href} className="btn" style={{ fontSize: "0.7rem" }}>
              Full Rankings
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}