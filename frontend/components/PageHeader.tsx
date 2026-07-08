export function PageHeader({
  title,
  formCode,
  subtitle,
  children,
}: {
  title: string;
  formCode?: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          {formCode && (
            <div className="font-mono text-[11px] uppercase tracking-widest text-ink">
              {formCode}
            </div>
          )}
          <h1 className="text-xl font-semibold text-body">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-mute">{subtitle}</p>}
        </div>
        {children}
      </div>
      <div className="mt-3 border-t-2 border-ink" />
      <div className="mt-[3px] border-t border-rule" />
    </header>
  );
}
