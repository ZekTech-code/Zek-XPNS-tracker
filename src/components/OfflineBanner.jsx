export default function OfflineBanner({ isOnline }) {
  if (isOnline) return null;

  return (
    <div id="offlineBanner" className="offline-banner">
      <i className="fa-solid fa-wifi-slash" />
      <span>You're offline - changes will sync when you reconnect</span>
    </div>
  );
}
