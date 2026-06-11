"use client";

import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="hero">
      {/* Hero image */}
      <Image
        src="/hero.jpg"
        alt="Frank Rijkaard and Rudi Voeller, Italia 1990"
        fill
        priority
        className="hero-img"
        sizes="100vw"
      />

      {/* Dark overlay */}
      <div className="hero-overlay" />

      {/* Content */}
      <div className="hero-content">
        <p className="section-eyebrow" style={{ marginBottom: "1rem" }}>
          FIFA World Cup 2026
        </p>
        <h1 className="hero-title">THE 48</h1>
        <p className="hero-subtitle">
          The game that belongs to everyone.
        </p>

        <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", flexWrap: "wrap" }}>
          <Link href="/indices" className="btn btn-accent">
            Explore the Indices
          </Link>
          <Link href="/matchday" className="btn">
            Match Day
          </Link>
        </div>
      </div>

      {/* Photo credit */}
      <p className="hero-credit">
        <a
          href="https://www.gettyimages.in/detail/news-photo/frank-rijkaard-of-the-netherlands-looks-towards-west-news-photo/1360169443"
          target="_blank"
          rel="noopener noreferrer"
        >
          Photo: David Cannon / Getty Images
        </a>
      </p>
    </section>
  );
}

