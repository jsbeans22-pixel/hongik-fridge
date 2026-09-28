import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

let openModalCount = 0
let originalOverflow = ''

export default function Modal({ title, children, onClose, busy = false, error = '', hideTitle = false, titleSpacing = 'mb-6' }) {
  const dialogRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    if (openModalCount === 0) originalOverflow = document.body.style.overflow
    openModalCount += 1
    document.body.style.overflow = 'hidden'

    return () => {
      dialog.close()
      openModalCount -= 1
      if (openModalCount === 0) document.body.style.overflow = originalOverflow
    }
  }, [])

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.stopPropagation()
        event.preventDefault()
        if (!busy) onClose()
      }}
      onClick={(event) => {
        event.stopPropagation()
        if (!busy && event.target === event.currentTarget) {
          onClose()
        }
      }}
      className="fixed left-1/2 top-1/2 m-0 max-h-[calc(100dvh-24px)] w-[calc(100%-24px)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border-0 bg-white p-0 text-[#191f28] backdrop:bg-black/40 min-[400px]:w-[calc(100%-40px)]"
    >
      <div className="max-h-[calc(100dvh-24px)] overflow-y-auto overscroll-contain px-5 py-7">
        <h2
          id={titleId}
          className={hideTitle ? 'sr-only' : `${titleSpacing} text-center text-lg font-bold`}
          style={{ color: 'var(--foreground)', letterSpacing: '-0.5px' }}
        >
          {title}
        </h2>

        {error && (
          <p role="alert" className="mb-4 text-sm text-[#f04452]">
            {error}
          </p>
        )}

        {busy && (
          <p role="status" className="mb-4 text-sm text-[#6b7684]">
            처리 중이에요…
          </p>
        )}

        <fieldset
          disabled={busy}
          aria-busy={busy}
          className="min-w-0 border-0 p-0 disabled:opacity-60"
        >
          {children}
        </fieldset>
      </div>
    </dialog>,
    document.body,
  )
}
