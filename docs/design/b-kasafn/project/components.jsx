// Bókasafn — shared screen components
// Status bar, headers, generated covers, and three screens (Home, Results, Detail).
// Each screen is rendered inside a .phone container and themed via .theme-light/.theme-dark.

const { useState } = React;

// ─── Status bar (iOS) ─────────────────────────────────────────
function StatusBar() {
  return (
    <div className="statusbar">
      <span>9:41</span>
      <div className="statusbar-icons">
        {/* signal */}
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="0.5"/><rect x="4.5" y="5" width="3" height="6" rx="0.5"/><rect x="9" y="2.5" width="3" height="8.5" rx="0.5"/><rect x="13.5" y="0" width="3" height="11" rx="0.5"/></svg>
        {/* wifi */}
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><path d="M8 10.5c.6 0 1-.4 1-1s-.4-1-1-1-1 .4-1 1 .4 1 1 1zM5 7.5l1.5 1.5c.4-.4 1-.6 1.5-.6s1.1.2 1.5.6L11 7.5C9.3 5.8 6.7 5.8 5 7.5zM2.5 5l1.5 1.5c2.2-2.2 5.8-2.2 8 0L13.5 5C10.4 1.9 5.6 1.9 2.5 5z"/></svg>
        {/* battery */}
        <svg width="25" height="11" viewBox="0 0 25 11" fill="none"><rect x="0.5" y="0.5" width="21" height="10" rx="2.5" stroke="currentColor" opacity="0.4"/><rect x="2" y="2" width="18" height="7" rx="1.5" fill="currentColor"/><rect x="22.5" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" opacity="0.4"/></svg>
      </div>
    </div>
  );
}

// ─── Generated covers ─────────────────────────────────────────
// Realistic-looking covers built with gradients + serif typography.
// Each book gets a stable palette so light/dark modes match.
const COVER_PALETTES = {
  laxness:   { bg: 'linear-gradient(155deg,#1a3a3f 0%,#0a1f24 100%)', accent: '#d4a574' },
  audur:     { bg: 'linear-gradient(165deg,#c5413d 0%,#7a1f1c 100%)', accent: '#f4e6c8' },
  yrsa:      { bg: 'linear-gradient(180deg,#2a2630 0%,#0d0c12 100%)', accent: '#a8c5d8' },
  arnaldur:  { bg: 'linear-gradient(170deg,#3a4a3d 0%,#1a2520 100%)', accent: '#d8c896' },
  steinunn:  { bg: 'linear-gradient(160deg,#e8d4b0 0%,#b89968 100%)', accent: '#3a2818' },
  sjon:      { bg: 'linear-gradient(170deg,#4a3a5e 0%,#251c2f 100%)', accent: '#e8c878' },
  bergsveinn:{ bg: 'linear-gradient(150deg,#7a8a6e 0%,#3e4a38 100%)', accent: '#f0e8d0' },
  jon:       { bg: 'linear-gradient(165deg,#b85c2a 0%,#6a2e10 100%)', accent: '#f4ddc0' },
  kristin:   { bg: 'linear-gradient(180deg,#1a2438 0%,#0a0f1c 100%)', accent: '#c8b890' },
  einar:     { bg: 'linear-gradient(160deg,#8a3838 0%,#4a1818 100%)', accent: '#e8d8b8' },
};

function Cover({ palette, title, author, large }) {
  const p = COVER_PALETTES[palette] || COVER_PALETTES.laxness;
  return (
    <div className={large ? 'cover cover-lg' : 'cover'}>
      <div className="cover-art" style={{ background: p.bg }}>
        <div className="cover-art-author" style={{ color: p.accent }}>{author}</div>
        <div className="cover-art-title" style={{ color: p.accent }}>{title}</div>
      </div>
    </div>
  );
}

// ─── Library scope picker ─────────────────────────────────────
function ScopePicker({ name = 'Borgarbókasafn' }) {
  return (
    <div className="scope">
      <span className="scope-dot" />
      <span>{name}</span>
      <svg className="scope-caret" viewBox="0 0 12 12" fill="none">
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

// ─── Search field ─────────────────────────────────────────────
function SearchField({ value, placeholder = 'Leita að bók, höfundi…' }) {
  return (
    <div className="search">
      <svg className="search-icon" viewBox="0 0 20 20" fill="none">
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M14 14L17.5 17.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
      {value
        ? <span className="search-text" style={{ color: 'var(--ink)' }}>{value}</span>
        : <span className="search-text">{placeholder}</span>
      }
    </div>
  );
}

// ─── Home indicator ───────────────────────────────────────────
function HomeIndicator() { return <div className="home-indicator" />; }

Object.assign(window, { StatusBar, Cover, ScopePicker, SearchField, HomeIndicator, COVER_PALETTES });
