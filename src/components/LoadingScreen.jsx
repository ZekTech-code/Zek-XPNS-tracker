export default function LoadingScreen({ loading }) {
  return (
    <div id="loadingScreen" className={`loading-screen${loading ? '' : ' hidden'}`} style={{ display: loading ? 'flex' : 'none' }}>
      <div className="loading-inner">
        <div className="loading-logo">XPNS<span className="accent">.</span></div>
        {loading && <div className="loading-spinner" />}
        <p className="loading-text" id="loadingText">{loading ? 'Syncing your data...' : 'Redirecting...'}</p>
      </div>
    </div>
  );
}
