/* Small presentational building blocks used on every page. */

export function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </header>
  );
}

export function StatCard({ label, value, sub }) {
  return (
    <div className="card stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
      {sub && <span className="stat__sub">{sub}</span>}
    </div>
  );
}

export function Tag({ children, strong = false }) {
  return <span className={`tag${strong ? " tag--strong" : ""}`}>{children}</span>;
}

export function Field({ label, htmlFor, aside, help, children }) {
  return (
    <div className="field">
      {label && (
        <div className="field__label">
          {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : <span>{label}</span>}
          {aside}
        </div>
      )}
      {children}
      {help && <p className="help">{help}</p>}
    </div>
  );
}

export function Tabs({ items, value, onChange, label, block = false }) {
  return (
    <div className={`tabs${block ? " tabs--block" : ""}`} role="tablist" aria-label={label}>
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          role="tab"
          className="tab"
          aria-selected={it.value === value}
          onClick={() => onChange(it.value)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function Loading() {
  return <p className="muted">Loading…</p>;
}

export function ErrorMessage({ error }) {
  if (!error) return null;
  return (
    <p className="error" role="alert">
      {error.message || String(error)}
    </p>
  );
}

export function Notice({ children, onClose }) {
  if (!children) return null;
  return (
    <div className="notice" role="status">
      <div>{children}</div>
      {onClose && (
        <button type="button" className="link-btn" onClick={onClose}>
          Close
        </button>
      )}
    </div>
  );
}

export function Empty({ children }) {
  return <p className="empty">{children}</p>;
}
