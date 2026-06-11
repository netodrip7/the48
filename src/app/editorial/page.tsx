"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Article = {
  slug: string;
  title: string;
  subheadline: string;
  teaser: string;
  tag: string;
  date: string;
  substackUrl: string;
  coverImage?: string;
};

// ── Add new articles here ─────────────────────────────────────────────────────
// To add a new article, copy one object and fill in the fields.
// substackUrl: the full URL to your Substack post.
// coverImage: optional, place image in /public/editorial/ and reference as "/editorial/filename.jpg"
const ARTICLES: Article[] = [
  {
    slug:         "welcome-to-the-48",
    title:        "Welcome to The 48",
    subheadline:  "Why we built a data platform for the biggest World Cup in history.",
    teaser:       "48 nations. Four original indices. One tournament. Here's what we're trying to do — and why the numbers matter more than ever.",
    tag:          "Editorial",
    date:         "June 2026",
    substackUrl:  "https://your-substack-url.substack.com",
    coverImage:   "",
  },
];

function ArticleCard({ article }: { article: Article }) {
  return (
    <a
      href={article.substackUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="editorial-card"
    >
      {/* Cover image */}
      {article.coverImage && (
        <div style={{
          width: "100%",
          height: "200px",
          overflow: "hidden",
          background: "var(--surface-2)",
        }}>
          <img
            src={article.coverImage}
            alt={article.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      {/* No image placeholder */}
      {!article.coverImage && (
        <div style={{
          width: "100%",
          height: "6px",
          background: "var(--mango)",
        }} />
      )}

      <div className="editorial-card-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <div className="editorial-card-tag">{article.tag}</div>
          <div style={{ fontSize: "0.65rem", color: "var(--text-faint)", letterSpacing: "0.08em" }}>
            {article.date}
          </div>
        </div>
        <div className="editorial-card-headline">{article.title}</div>
        <div style={{
          fontFamily: "var(--font-serif)",
          fontSize: "0.85rem",
          color: "var(--text-muted)",
          fontStyle: "italic",
          marginBottom: "0.75rem",
          lineHeight: 1.4,
        }}>
          {article.subheadline}
        </div>
        <div className="editorial-card-teaser">{article.teaser}</div>
        <div style={{
          marginTop: "1rem",
          fontSize: "0.7rem",
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--mango)",
        }}>
          Read on Substack →
        </div>
      </div>
    </a>
  );
}

export default function EditorialPage() {
  return (
    <div className="section" style={{ paddingTop: "4rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "4rem", borderBottom: "1px solid var(--border)", paddingBottom: "3rem" }}>
        <p className="section-eyebrow">The 48</p>
        <h1 className="section-title">Editorial</h1>
        <p className="serif" style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "1.05rem" }}>
          Analysis, context, and the stories the numbers tell.
        </p>
      </div>

      {/* Article grid */}
      {ARTICLES.length === 0 ? (
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          No articles yet. Add them to the ARTICLES array in editorial/page.tsx.
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1px",
          background: "var(--border)",
        }}>
          {ARTICLES.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      )}

      {/* Substack CTA */}
      <div style={{
        marginTop: "4rem",
        padding: "2rem",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
      }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", letterSpacing: "0.04em" }}>
            Read More on Substack
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Full articles, deeper analysis, and tournament coverage.
          </div>
        </div>
        <a
          href="https://your-substack-url.substack.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-accent"
        >
          Subscribe
        </a>
      </div>
    </div>
  );
}