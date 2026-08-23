export interface ConceptMapCopy {
  ariaLabel: string;
  referenceLabel: string;
  referenceItems: [string, string, string];
  relationsLabel: string;
  relationItems: [string, string, string];
  productSystemLabel: string;
  resultsLabel: string;
  impactLabels: [string, string];
}

const conceptNode = 'rounded-[2px] border border-fd-border bg-fd-background px-2 py-2 text-center text-[0.625rem] leading-tight font-medium';

function FlowArrow() {
  return (
    <svg className="h-4 w-6 shrink-0 text-fd-muted-foreground max-[40rem]:rotate-90" viewBox="0 0 24 16" aria-hidden="true">
      <path d="M1 8h20m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LcaConceptMap({ copy }: { copy: ConceptMapCopy }) {
  return (
    <figure
      className="m-0 w-full max-w-[43rem] justify-self-end rounded-[4px] border border-fd-border bg-fd-card p-6 max-[68rem]:max-w-none max-[68rem]:justify-self-stretch max-[40rem]:p-4"
      role="img"
      aria-label={copy.ariaLabel}
    >
      <div className="flex min-h-[20rem] items-center justify-between gap-3 max-[40rem]:min-h-0 max-[40rem]:flex-col" aria-hidden="true">
        <section className="grid min-w-0 flex-1 gap-3">
          <p className="m-0 text-[0.6875rem] font-semibold tracking-[0.06em] text-fd-muted-foreground uppercase">{copy.referenceLabel}</p>
          <div className="grid gap-2">
            {copy.referenceItems.map((item) => <span className={conceptNode} key={item}>{item}</span>)}
          </div>
        </section>

        <FlowArrow />

        <section className="grid min-w-0 flex-[1.35] gap-3">
          <p className="m-0 text-[0.6875rem] font-semibold tracking-[0.06em] text-fd-muted-foreground uppercase">{copy.relationsLabel}</p>
          <div className="grid grid-cols-2 gap-2">
            <span className={conceptNode}>{copy.relationItems[0]}</span>
            <span className={`${conceptNode} row-span-2 flex items-center justify-center border-fd-primary bg-fd-accent`}>{copy.relationItems[2]}</span>
            <span className={conceptNode}>{copy.relationItems[1]}</span>
          </div>
        </section>

        <FlowArrow />

        <section className="grid min-w-0 flex-1 gap-3">
          <p className="m-0 text-[0.6875rem] font-semibold tracking-[0.06em] text-fd-muted-foreground uppercase">{copy.productSystemLabel}</p>
          <div className="flex min-h-24 items-center justify-center rounded-[2px] border border-fd-primary bg-fd-accent px-3 text-center text-xs font-semibold">
            {copy.productSystemLabel}
          </div>
        </section>

        <FlowArrow />

        <section className="grid min-w-0 flex-1 gap-3">
          <p className="m-0 text-[0.6875rem] font-semibold tracking-[0.06em] text-fd-muted-foreground uppercase">{copy.resultsLabel}</p>
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
