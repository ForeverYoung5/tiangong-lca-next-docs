export interface ConceptMapCopy {
  ariaLabel: string;
  title: string;
  referenceLabel: string;
  referenceItems: [string, string, string];
  relationsLabel: string;
  relationItems: [string, string, string];
  productSystemLabel: string;
  resultsLabel: string;
  impactLabels: [string, string];
}

const conceptItem = 'text-[0.6875rem] leading-[1.45] text-fd-muted-foreground';

export function LcaConceptMap({ copy }: { copy: ConceptMapCopy }) {
  return (
    <figure
      className="m-0 w-full max-w-[43rem] justify-self-end rounded-[4px] border border-fd-border bg-fd-card p-6 max-[68rem]:max-w-none max-[68rem]:justify-self-stretch max-[40rem]:p-4"
      role="img"
      aria-label={copy.ariaLabel}
    >
      <figcaption className="m-0 text-[0.6875rem] font-semibold tracking-[0.08em] text-fd-primary uppercase" aria-hidden="true">
        {copy.title}
      </figcaption>

      <div className="relative mt-4 grid min-h-[19rem] grid-cols-[minmax(0,1.05fr)_minmax(7.5rem,0.72fr)_minmax(0,1fr)] grid-rows-2 gap-x-10 gap-y-4 max-[40rem]:min-h-0 max-[40rem]:grid-cols-1 max-[40rem]:grid-rows-none max-[40rem]:gap-3" aria-hidden="true">
        <svg className="pointer-events-none absolute inset-0 h-full w-full text-fd-border max-[40rem]:hidden" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d="M30 25 L43 50 M30 75 L43 50 M57 50 L72 50" fill="none" stroke="currentColor" strokeWidth="0.55" vectorEffect="non-scaling-stroke" />
          <circle cx="43" cy="50" r="1.1" fill="var(--color-fd-primary)" />
          <circle cx="57" cy="50" r="1.1" fill="var(--color-fd-primary)" />
        </svg>

        <section className="relative z-10 grid min-w-0 content-center gap-3 rounded-[2px] border border-fd-border bg-fd-background p-4">
          <p className="m-0 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase">{copy.referenceLabel}</p>
          <div className="grid gap-1.5">
            {copy.referenceItems.map((item) => <span className={conceptItem} key={item}>{item}</span>)}
          </div>
        </section>

        <section className="relative z-10 row-start-2 grid min-w-0 content-center gap-3 rounded-[2px] border border-fd-border bg-fd-background p-4 max-[40rem]:row-auto">
          <p className="m-0 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase">{copy.relationsLabel}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {copy.relationItems.map((item) => <span className={conceptItem} key={item}>{item}</span>)}
          </div>
        </section>

        <section className="relative z-10 col-start-2 row-span-2 flex min-w-0 items-center max-[40rem]:col-auto max-[40rem]:row-auto">
          <div className="flex min-h-32 w-full items-center justify-center rounded-[2px] border border-fd-primary bg-fd-accent px-3 text-center text-xs font-semibold max-[40rem]:min-h-24">
            {copy.productSystemLabel}
          </div>
        </section>

        <section className="relative z-10 col-start-3 row-span-2 grid min-w-0 content-center gap-4 rounded-[2px] border border-fd-border bg-fd-background p-4 max-[40rem]:col-auto max-[40rem]:row-auto">
          <p className="m-0 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase">{copy.resultsLabel}</p>
          <div className="grid gap-4">
            {copy.impactLabels.map((label, index) => (
              <div className="grid gap-2" key={label}>
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.625rem] text-fd-muted-foreground">{label}</span>
                <i className="relative block h-1 bg-fd-border">
                  <span className={`absolute inset-y-0 start-0 bg-fd-primary ${index === 0 ? 'w-3/4' : 'w-1/2'}`} />
                </i>
              </div>
            ))}
          </div>
        </section>
      </div>
    </figure>
  );
}
