import { useEffect } from "react";

/** Right-hand slide-over panel with a scrim. Closes on Escape or scrim click. */
export default function Drawer({ open, onClose, title, subtitle, onSubmit, footer, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.classList.add("has-drawer");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("has-drawer");
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer">
      <div className="drawer__scrim" onClick={onClose} />
      <form className="drawer__panel" role="dialog" aria-modal="true" aria-label={title} onSubmit={onSubmit} noValidate>
        <div className="form">
          <div>
            <h2 className="drawer__title">{title}</h2>
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
          {children}
        </div>
        {footer && <div className="drawer__footer">{footer}</div>}
      </form>
    </div>
  );
}
