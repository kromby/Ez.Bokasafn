// Bókasafn — Detail screen
// Hero: derived-from-cover background tint, large cover, title (serif), italic author, facts row.
// Tags. Summary in serif. Branch availability table with call numbers.
// Back/share buttons float over the hero.

function DetailScreen() {
  const palette = 'laxness';
  const heroBg = 'radial-gradient(ellipse at 50% 0%, oklch(0.32 0.04 200) 0%, transparent 70%)';
  const heroBgDark = 'radial-gradient(ellipse at 50% 0%, oklch(0.40 0.05 200) 0%, transparent 70%)';

  return (
    <div className="phone detail">
      <StatusBar />
      <div className="appbar">
        <button className="iconbtn" aria-label="Til baka">
          <svg viewBox="0 0 17 17" fill="none">
            <path d="M10.5 3.5L5 8.5L10.5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="iconbtn" aria-label="Deila">
          <svg viewBox="0 0 17 17" fill="none">
            <path d="M8.5 11V2.5M8.5 2.5L5.5 5.5M8.5 2.5L11.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.5 9.5V13.5C3.5 14.05 3.95 14.5 4.5 14.5H12.5C13.05 14.5 13.5 14.05 13.5 13.5V9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <div className="content">
        <div className="hero">
          <div className="hero-bg hero-bg-light" style={{ background: heroBg }} />
          <div className="hero-content">
            <div style={{ height: 32 }} />
            <Cover palette={palette} title="Sjálfstætt fólk" author="HALLDÓR LAXNESS" large />
            <div className="hero-meta">
              <h1 className="hero-title">Sjálfstætt fólk</h1>
              <div className="hero-author">Halldór Laxness</div>
              <div className="hero-facts">
                <span>1934</span>
                <span>624 bls.</span>
                <span>Skáldsaga</span>
              </div>
            </div>
          </div>
        </div>

        <div className="tags">
          <span className="tag">Skáldverk</span>
          <span className="tag">Íslensk</span>
          <span className="tag">Sveitalíf</span>
          <span className="tag">Klassík</span>
        </div>

        <p className="summary">
          Bjartur í Sumarhúsum hefur loks eignast eigið land eftir átján ára vinnumennsku. Saga hans, Rósu og Ástu Sóllilju er ein af hornsteinum íslenskrar bókmenntasögu — köld, tær, og óvægin.
        </p>

        <div style={{ height: 4 }} />

        <div className="branch-table">
          <div className="branch-table-head">
            <span>Önnur bókasöfn</span>
            <span className="count">6 söfn · 4 á hillunni</span>
          </div>
          <div className="branch-row">
            <div>
              <div className="branch-name">Grófin</div>
              <div className="branch-call">Skáldverk · 823.91 LAX</div>
            </div>
            <div className="branch-status avail">Á hillu</div>
          </div>
          <div className="branch-row">
            <div>
              <div className="branch-name">Sólheimar</div>
              <div className="branch-call">Skáldverk · 823.91 LAX</div>
            </div>
            <div className="branch-status avail">Á hillu</div>
          </div>
          <div className="branch-row">
            <div>
              <div className="branch-name">Kringlan</div>
              <div className="branch-call">Skáldverk · 823.91 LAX</div>
            </div>
            <div className="branch-status avail">Á hillu</div>
          </div>
          <div className="branch-row">
            <div>
              <div className="branch-name">Spöngin</div>
              <div className="branch-call">Skáldverk · 823.91 LAX</div>
            </div>
            <div className="branch-status avail">Á hillu</div>
          </div>
          <div className="branch-row">
            <div>
              <div className="branch-name">Árbær</div>
              <div className="branch-call">Skáldverk · 823.91 LAX</div>
            </div>
            <div className="branch-status loan">
              Í útláni
              <span className="due">Skilað 8. maí</span>
            </div>
          </div>
          <div className="branch-row">
            <div>
              <div className="branch-name">Gerðuberg</div>
              <div className="branch-call">Skáldverk · 823.91 LAX</div>
            </div>
            <div className="branch-status loan">
              Í útláni
              <span className="due">Skilað 17. maí</span>
            </div>
          </div>
        </div>

        <div style={{ height: 36 }} />
      </div>
      <HomeIndicator />
    </div>
  );
}

window.DetailScreen = DetailScreen;
