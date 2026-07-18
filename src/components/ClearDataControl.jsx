import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { clearOwnedData, clearedMarkerFor, clearedRedirectUrl } from '../lib/clearData'

// Accessible "Clear FinE Companion data on this device" control.
// - opens a confirmation dialog (not a blocking app-wide modal)
// - traps Tab, treats Escape as Cancel, restores focus to the opener on close
// - removes ONLY FinE Companion keys, then returns the app to a clean first-use
//   state by navigating to the app base path
export default function ClearDataControl({ className = '' }) {
  const { t, lang } = useLanguage()
  const c = t.pub.clearData
  const [open, setOpen] = useState(false)
  const openerRef = useRef(null)
  const confirmRef = useRef(null)
  const boxRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement
    // focus the confirming action for keyboard users
    requestAnimationFrame(() => confirmRef.current && confirmRef.current.focus())
    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      } else if (e.key === 'Tab') {
        const box = boxRef.current
        if (!box) return
        const focusables = box.querySelectorAll('button')
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      // restore focus to the opener when closing
      if (prev && typeof prev.focus === 'function') prev.focus()
      else if (openerRef.current) openerRef.current.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function close() {
    setOpen(false)
  }

  function onConfirm() {
    let removed = []
    try {
      removed = clearOwnedData(window.localStorage)
    } catch {
      /* storage unavailable — nothing to remove */
    }
    // Return to a clean first-use state at the app base path, carrying a
    // one-time marker (in the URL, NOT localStorage) so the reloaded app can
    // announce whether data was removed or there was none to remove.
    const base =
      (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/'
    const marker = clearedMarkerFor(removed.length)
    try {
      window.location.assign(clearedRedirectUrl(base, marker, lang))
    } catch {
      setOpen(false)
    }
    return removed
  }

  return (
    <div className={`cleardata ${className}`.trim()}>
      <button
        type="button"
        ref={openerRef}
        className="btn btn--ghost cleardata__btn"
        onClick={() => setOpen(true)}
      >
        {c.button}
      </button>

      {open && (
        <div className="cleardata__overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <div
            ref={boxRef}
            className="cleardata__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cleardata-title"
            aria-describedby="cleardata-desc"
          >
            <h2 id="cleardata-title" className="cleardata__title">{c.confirmTitle}</h2>
            <p id="cleardata-desc" className="cleardata__body">{c.confirmBody}</p>
            <div className="cleardata__actions">
              <button type="button" className="btn btn--ghost" onClick={close}>
                {c.cancel}
              </button>
              <button type="button" ref={confirmRef} className="btn btn--primary" onClick={onConfirm}>
                {c.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
