import { useEffect, useRef } from "react";

/**
 * Centred popup dialog with a dimmed background.
 * Closes on Escape, the Close button, or a click outside the panel.
 */
export default function Modal({ open, onClose, title, subtitle, onSubmit, footer, children }) {
  const panel = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const onKey = (e) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    document.body.classList.add("has-modal");
    panel.current?.querySelector(".modal__body input, .modal__body select, .modal__body textarea")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("has-modal");
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal">
      <div className="modal__scrim" onClick={onClose} />
      <form
        ref={panel}
        className="modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onSubmit={onSubmit}
        noValidate
      >
        <div className="modal__head">
          <div>
            <h2 className="modal__title" id="modal-title">{title}</h2>
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
          <button type="button" className="link-btn" onClick={onClose}>Close</button>
        </div>
        <div className="modal__body form">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </form>
    </div>
  );
}
