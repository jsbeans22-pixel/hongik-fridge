export default function InstallGuideStep({ number, title, image, alt }) {
  return (
    <li className="rounded-2xl bg-[var(--background)] p-4">
      <div className="mb-3 flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-white"
        >
          {number}
        </span>
        <p className="break-keep pt-0.5 text-base font-semibold leading-snug text-[var(--foreground)]">
          {title}
        </p>
      </div>
      <img
        src={image}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="h-auto w-full rounded-xl border border-[var(--border)] bg-white object-contain"
      />
    </li>
  )
}

