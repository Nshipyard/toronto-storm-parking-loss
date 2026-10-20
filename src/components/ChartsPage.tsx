"use client";

import { useLang } from "@/i18n";
import type { Storm } from "@/lib/storms";

function money(n: number) {
  return "$" + n.toLocaleString("en-CA");
}
function fmt(n: number) {
  return n.toLocaleString("en-CA");
}

const INK = "#0a0f1e";
const RED = "#d80621";
const FAINT = "rgba(10,15,30,0.55)";

function ChartShell({
  title,
  takeaway,
  source,
  legend,
  children,
}: {
  title: string;
  takeaway: string;
  source: string;
  legend?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="border-t border-line py-14 first:border-t-0 first:pt-4">
      <h2 className="display max-w-[760px] text-[36px] md:text-[44px]">{title}</h2>
      <p className="mt-4 max-w-[760px] text-[18px] leading-relaxed text-ink/75">{takeaway}</p>
      {legend ? <p className="mt-3 max-w-[760px] text-[15px] text-ink/55">{legend}</p> : null}
      <div className="mt-8 overflow-x-auto rounded-[24px] border border-line bg-paper-warm p-6">{children}</div>
      <p className="mt-4 max-w-[860px] text-[13px] leading-relaxed text-ink/50">{source}</p>
    </article>
  );
}

/** Chart 1: revenue per storm, horizontal bars with the low to high band. */
function RevenueBandChart({ storms, title }: { storms: Storm[]; title: string }) {
  const rows = [...storms].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const max = Math.max(...rows.map((s) => s.est_revenue_lost_cad_high));
  const W = 1240;
  const labelW = 210;
  const areaW = 790;
  const valueX = labelW + areaW + 16;
  const top = 36;
  const rowH = 46;
  const H = top + rows.length * rowH + 8;
  const ticks = [0, 500000, 1000000, 1500000, 2000000];
  const x = (v: number) => labelW + (v / max) * areaW;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[820px] w-full" role="img" aria-label={title}>
      {ticks.map((tv) => (
        <g key={tv}>
          <line x1={x(tv)} y1={top - 8} x2={x(tv)} y2={H - 6} stroke={INK} strokeOpacity={0.08} />
          <text x={x(tv)} y={top - 16} fontSize={12} fill={FAINT} textAnchor="middle">
            {tv === 0 ? "$0" : `$${tv / 1000000}M`}
          </text>
        </g>
      ))}
      {rows.map((s, i) => {
        const y = top + i * rowH;
        const anchor = s.method_tag === "anchor_disclosed";
        return (
          <g key={s.id}>
            <text x={0} y={y + 21} fontSize={14} fill={INK} fontWeight={500}>
              {s.start_date}
            </text>
            <text x={118} y={y + 21} fontSize={12} fill={FAINT}>
              {s.id}
            </text>
            <rect x={x(s.est_revenue_lost_cad_low)} y={y + 3} width={Math.max(x(s.est_revenue_lost_cad_high) - x(s.est_revenue_lost_cad_low), 2)} height={24} rx={6} fill={RED} opacity={0.16} />
            <rect x={labelW} y={y + 3} width={Math.max(x(s.est_revenue_lost_cad) - labelW, 3)} height={24} rx={6} fill={anchor ? RED : INK} opacity={anchor ? 1 : 0.82} />
            <text x={valueX} y={y + 21} fontSize={14} fill={INK} fontWeight={600}>
              {money(s.est_revenue_lost_cad)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Chart 2: snowfall against revenue lost, one dot per storm. */
function ScatterChart({ storms, title, xLabel, yLabel, febLabel }: { storms: Storm[]; title: string; xLabel: string; yLabel: string; febLabel: string }) {
  const W = 1240;
  const H = 540;
  const L = 104;
  const R = 36;
  const T = 34;
  const B = 72;
  const plotW = W - L - R;
  const plotH = H - T - B;
  const xMax = 35;
  const yMax = 1750000;
  const x = (v: number) => L + (v / xMax) * plotW;
  const y = (v: number) => T + plotH - (v / yMax) * plotH;
  const yTicks = [0, 500000, 1000000, 1500000];
  const xTicks = [0, 10, 20, 30];
  const feb = storms.find((s) => s.id === "S10");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[820px] w-full" role="img" aria-label={title}>
      {yTicks.map((tv) => (
        <g key={tv}>
          <line x1={L} y1={y(tv)} x2={L + plotW} y2={y(tv)} stroke={INK} strokeOpacity={0.08} />
          <text x={L - 12} y={y(tv) + 5} fontSize={13} fill={FAINT} textAnchor="end">
            {tv === 0 ? "$0" : `$${(tv / 1000000).toFixed(1)}M`}
          </text>
        </g>
      ))}
      {xTicks.map((tv) => (
        <text key={tv} x={x(tv)} y={T + plotH + 26} fontSize={13} fill={FAINT} textAnchor="middle">
          {tv}
        </text>
      ))}
      <line x1={L} y1={T + plotH} x2={L + plotW} y2={T + plotH} stroke={INK} strokeOpacity={0.25} />
      <line x1={L} y1={T} x2={L} y2={T + plotH} stroke={INK} strokeOpacity={0.25} />
      <text x={L + plotW / 2} y={H - 14} fontSize={14} fill={INK} textAnchor="middle" fontWeight={500}>
        {xLabel}
      </text>
      <text x={22} y={T + plotH / 2} fontSize={14} fill={INK} textAnchor="middle" fontWeight={500} transform={`rotate(-90 22 ${T + plotH / 2})`}>
        {yLabel}
      </text>
      {storms.map((s) => {
        const anchor = s.method_tag === "anchor_disclosed";
        return <circle key={s.id} cx={x(s.snowfall_cm)} cy={y(s.est_revenue_lost_cad)} r={s.id === "S10" ? 9 : 6.5} fill={anchor ? RED : INK} opacity={s.id === "S10" ? 1 : 0.8} />;
      })}
      {feb ? (
        <g>
          <text x={x(feb.snowfall_cm) - 14} y={y(feb.est_revenue_lost_cad) - 20} fontSize={15} fill={RED} fontWeight={600} textAnchor="end">
            {febLabel}: {feb.snowfall_cm} cm, {money(feb.est_revenue_lost_cad)}
          </text>
        </g>
      ) : null}
    </svg>
  );
}

/** Chart 3: revenue summed by winter. Winter runs July to June, named for its start year. */
function WinterChart({ storms, title, stormsWord }: { storms: Storm[]; title: string; stormsWord: string }) {
  const byWinter = new Map<string, { revenue: number; count: number }>();
  for (const s of storms) {
    const year = Number(s.start_date.slice(0, 4));
    const month = Number(s.start_date.slice(5, 7));
    const startYear = month >= 7 ? year : year - 1;
    const label = `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
    const cur = byWinter.get(label) ?? { revenue: 0, count: 0 };
    cur.revenue += s.est_revenue_lost_cad;
    cur.count += 1;
    byWinter.set(label, cur);
  }
  const rows = [...byWinter.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const max = Math.max(...rows.map(([, v]) => v.revenue));
  const W = 1240;
  const H = 520;
  const L = 104;
  const R = 36;
  const T = 46;
  const B = 84;
  const plotW = W - L - R;
  const plotH = H - T - B;
  const yMax = 3500000;
  const y = (v: number) => T + plotH - (v / yMax) * plotH;
  const yTicks = [0, 1000000, 2000000, 3000000];
  const slot = plotW / Math.max(rows.length, 1);
  const barW = Math.min(170, slot * 0.52);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[820px] w-full" role="img" aria-label={title}>
      {yTicks.map((tv) => (
        <g key={tv}>
          <line x1={L} y1={y(tv)} x2={L + plotW} y2={y(tv)} stroke={INK} strokeOpacity={0.08} />
          <text x={L - 12} y={y(tv) + 5} fontSize={13} fill={FAINT} textAnchor="end">
            {tv === 0 ? "$0" : `$${tv / 1000000}M`}
          </text>
        </g>
      ))}
      <line x1={L} y1={T + plotH} x2={L + plotW} y2={T + plotH} stroke={INK} strokeOpacity={0.25} />
      {rows.map(([label, v], i) => {
        const cx = L + slot * i + slot / 2;
        const top = y(v.revenue);
        return (
          <g key={label}>
            <rect x={cx - barW / 2} y={top} width={barW} height={T + plotH - top} rx={8} fill={v.revenue === max ? RED : INK} opacity={v.revenue === max ? 1 : 0.82} />
            <text x={cx} y={top - 12} fontSize={16} fill={INK} fontWeight={600} textAnchor="middle">
              {money(v.revenue)}
            </text>
            <text x={cx} y={T + plotH + 28} fontSize={15} fill={INK} fontWeight={500} textAnchor="middle">
              {label}
            </text>
            <text x={cx} y={T + plotH + 52} fontSize={13} fill={FAINT} textAnchor="middle">
              {v.count} {stormsWord}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Chart 4: transactions lost per storm, horizontal bars in date order. */
function TransactionsChart({ storms, title }: { storms: Storm[]; title: string }) {
  const rows = [...storms].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const max = Math.max(...rows.map((s) => s.est_transactions_lost));
  const W = 1240;
  const labelW = 210;
  const areaW = 790;
  const top = 36;
  const rowH = 46;
  const H = top + rows.length * rowH + 8;
  const ticks = [0, 100000, 200000];
  const x = (v: number) => labelW + (v / max) * areaW;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[820px] w-full" role="img" aria-label={title}>
      {ticks.map((tv) => (
        <g key={tv}>
          <line x1={x(tv)} y1={top - 8} x2={x(tv)} y2={H - 6} stroke={INK} strokeOpacity={0.08} />
          <text x={x(tv)} y={top - 16} fontSize={12} fill={FAINT} textAnchor="middle">
            {fmt(tv)}
          </text>
        </g>
      ))}
      {rows.map((s, i) => {
        const y = top + i * rowH;
        const anchor = s.method_tag === "anchor_disclosed";
        return (
          <g key={s.id}>
            <text x={0} y={y + 21} fontSize={14} fill={INK} fontWeight={500}>
              {s.start_date}
            </text>
            <text x={118} y={y + 21} fontSize={12} fill={FAINT}>
              {s.id}
            </text>
            <rect x={labelW} y={y + 3} width={Math.max(x(s.est_transactions_lost) - labelW, 3)} height={24} rx={6} fill={anchor ? RED : INK} opacity={anchor ? 1 : 0.82} />
            <text x={labelW + Math.max(x(s.est_transactions_lost) - labelW, 3) + 12} y={y + 21} fontSize={14} fill={INK} fontWeight={600}>
              {fmt(s.est_transactions_lost)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function ChartsPage({ storms }: { storms: Storm[] }) {
  const { t } = useLang();
  const cp = t.chartsPage;
  return (
    <main className="flex-1">
      <section id="top" className="bg-paper">
        <div className="mx-auto max-w-[1392px] px-6 pb-8 pt-16 md:pt-24">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{cp.kicker}</p>
          <h1 className="display mt-4 max-w-[820px] text-[44px] md:text-[64px]">{cp.title}</h1>
          <p className="mt-6 max-w-[720px] text-[19px] leading-relaxed text-ink/70">{cp.lead}</p>
        </div>
      </section>
      <section className="bg-paper">
        <div className="mx-auto max-w-[1392px] px-6 pb-20 md:pb-28">
          <ChartShell title={cp.items[0].title} takeaway={cp.items[0].takeaway} source={cp.items[0].source} legend={cp.bandLegend}>
            <RevenueBandChart storms={storms} title={cp.items[0].title} />
          </ChartShell>
          <ChartShell title={cp.items[1].title} takeaway={cp.items[1].takeaway} source={cp.items[1].source}>
            <ScatterChart storms={storms} title={cp.items[1].title} xLabel={cp.snowfallAxis} yLabel={cp.revenueAxis} febLabel={cp.febLabel} />
          </ChartShell>
          <ChartShell title={cp.items[2].title} takeaway={cp.items[2].takeaway} source={cp.items[2].source}>
            <WinterChart storms={storms} title={cp.items[2].title} stormsWord={t.nav.explorer.toLowerCase()} />
          </ChartShell>
          <ChartShell title={cp.items[3].title} takeaway={cp.items[3].takeaway} source={cp.items[3].source}>
            <TransactionsChart storms={storms} title={cp.items[3].title} />
          </ChartShell>
        </div>
      </section>
    </main>
  );
}
