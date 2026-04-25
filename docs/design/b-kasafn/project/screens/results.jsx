// Bókasafn — Results screen
// Header: scope picker + search showing the active query.
// Two grouped sections: "Tiltækt núna" (green) then "Allt í útláni" (muted).
// Each row: cover thumb, title (serif), author·year, then either branch list (avail) or earliest return (loan).

const RESULTS_AVAIL = [
  {
    palette: 'laxness',
    title: 'Sjálfstætt fólk',
    author: 'Halldór Laxness',
    year: 1934,
    branches: ['Grófin', 'Sólheimar', 'Kringlan'],
  },
  {
    palette: 'audur',
    title: 'Merking',
    author: 'Auður Ava Ólafsdóttir',
    year: 2021,
    branches: ['Grófin', 'Árbær'],
  },
  {
    palette: 'sjon',
    title: 'Mánasteinn',
    author: 'Sjón',
    year: 2013,
    branches: ['Spöngin'],
  },
];

const RESULTS_LOAN = [
  {
    palette: 'arnaldur',
    title: 'Mýrin',
    author: 'Arnaldur Indriðason',
    year: 2000,
    due: 'Skilað í fyrsta lagi: 8. maí',
  },
  {
    palette: 'yrsa',
    title: 'Þriðja táknið',
    author: 'Yrsa Sigurðardóttir',
    year: 2005,
    due: 'Skilað í fyrsta lagi: 14. maí',
  },
  {
    palette: 'kristin',
    title: 'Karítas — án titils',
    author: 'Kristín Marja Baldursdóttir',
    year: 2004,
    due: 'Skilað í fyrsta lagi: 22. maí',
  },
];

function ResultsRow({ book, kind }) {
  return (
    <div className="row">
      <Cover palette={book.palette} title={book.title} author={book.author.toUpperCase()} />
      <div className="row-body">
        <div className="row-title">{book.title}</div>
        <div className="row-meta">
          {book.author}<span className="dot">·</span>{book.year}
        </div>
        <div className={`row-status ${kind}`}>
          {kind === 'avail'
            ? book.branches.map((b, i) => <span key={i} className="branch">{b}</span>)
            : book.due}
        </div>
      </div>
    </div>
  );
}

function ResultsScreen() {
  return (
    <div className="phone results">
      <StatusBar />
      <div className="head">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <ScopePicker name="Borgarbókasafn" />
          <span style={{ fontSize: 12, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>
            6 niðurstöður
          </span>
        </div>
        <SearchField value="laxness" />
      </div>
      <div className="content">
        <div className="section-head section-avail">
          <span className="label">Tiltækt núna</span>
          <span className="pill">3 á hillunni</span>
        </div>
        {RESULTS_AVAIL.map((b, i) => <ResultsRow key={i} book={b} kind="avail" />)}

        <div className="section-head section-loan">
          <span className="label">Allt í útláni</span>
          <span className="pill">3 í biðstöðu</span>
        </div>
        {RESULTS_LOAN.map((b, i) => <ResultsRow key={i} book={b} kind="loan" />)}

        <div style={{ height: 24 }} />
      </div>
      <HomeIndicator />
    </div>
  );
}

window.ResultsScreen = ResultsScreen;
