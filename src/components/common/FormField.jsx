export default function FormField({ label, children, className = 'mb-3' }) {
  return (
    <fieldset className={`min-w-0 ${className}`}>
      <legend className="mb-1.5 text-sm font-semibold" style={{ color: 'var(--muted-foreground)', letterSpacing: '-0.2px' }}>{label}</legend>
      {children}
    </fieldset>
  )
}
