// Bókasafn — Home screen
// Editorial wordmark "Finna bók" as a large display headline.
// Library scope picker top-left, search field below the wordmark, recent searches under that.

function HomeScreen() {
  return (
    <div className="phone home">
      <StatusBar />
      <div className="home-body">
        <div className="home-top">
          <ScopePicker name="Borgarbókasafn" />
        </div>
        <div className="home-center">
          <div>
            <h1 className="wordmark">
              <span className="l1">Finna</span>
              <span className="l2"><span className="underline">bók</span>.</span>
            </h1>
            <p className="tagline">Hvar er hún til, og er hún í hillunni núna?</p>
          </div>

          <div className="home-search-block">
            <SearchField placeholder="Leita að bók, höfundi…" />
          </div>

          <div>
            <div className="home-search-hint">Nýlega leitað</div>
            <div className="recent">
              <div className="recent-row">
                <svg viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <span className="term">Sjálfstætt fólk</span>
                <span className="when">í gær</span>
              </div>
              <div className="recent-row">
                <svg viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <span className="term">Yrsa Sigurðardóttir</span>
                <span className="when">2 d</span>
              </div>
              <div className="recent-row">
                <svg viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <span className="term">Merking</span>
                <span className="when">vika</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

window.HomeScreen = HomeScreen;
