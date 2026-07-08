import DOMPurify from 'dompurify';

export default function ToastContainer({ toasts, onDismiss }) {
  return (
    <div id="toastContainer">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            background: 'var(--surface)',
            border: `1px solid ${toast.border}`,
            borderLeft: `3px solid ${toast.border}`,
            borderRadius: 12,
            padding: '13px 16px',
            fontFamily: 'Space Grotesk, sans-serif',
            color: 'var(--text)',
            minWidth: 250,
            maxWidth: 320,
            pointerEvents: 'auto',
            boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: toast.bg,
              color: toast.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            <i className={toast.icon} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: toast.color, marginBottom: 2 }}>{toast.title}</div>
            {toast.onConfirm ? (
              <>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 10 }}>{toast.message}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => onDismiss(toast.id)}
                    style={{
                      background: 'transparent', border: '1px solid var(--border-hi)',
                      color: 'var(--text-muted)', fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: '0.72rem', fontWeight: 600, padding: '5px 14px',
                      borderRadius: 8, cursor: 'pointer', flex: 1,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { toast.onConfirm(); onDismiss(toast.id); }}
                    style={{
                      background: 'var(--surface-2)', border: '1px solid var(--border-hi)',
                      color: 'var(--text)', fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: '0.72rem', fontWeight: 600, padding: '5px 14px',
                      borderRadius: 8, cursor: 'pointer', flex: 1,
                    }}
                  >
                    Confirm
                  </button>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(toast.message) }} />
            )}
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14, lineHeight: 1, flexShrink: 0 }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      ))}
    </div>
  );
}