export function SiteBrand() {
  return (
    <span className="atlas-brand">
      <span className="atlas-brand-mark" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- static export serves public SVGs directly */}
        <img src="/logo-light.svg" alt="" width={28} height={28} className="dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-dark.svg" alt="" width={28} height={28} className="hidden dark:block" />
      </span>
      <span className="atlas-brand-name">
        TianGong LCA <span className="atlas-brand-divider" aria-hidden="true">/</span>{' '}
        <span className="atlas-brand-product">Documentation</span>
      </span>
    </span>
  );
}
