"use client";

import { useLang } from "@/i18n";
import type { Storm } from "@/lib/storms";

function money(n: number) {
  return "$" + n.toLocaleString("en-CA");
}

export default function StormChart({ storms }: { storms: Storm[] }) {
  const { t } = useLang();

  const ranked = [...storms].sort((a, b) => b.est_revenue_lost_cad - a.est_revenue_lost_cad);
  const max = ranked.length ? ranked[0].est_revenue_lost_cad : 1;
  const W = 1200;
  const rowH = 44;
  const H = ranked.length * rowH + 40;
  const labelW = 300;
  const valueW = 130;

  return (
    <section id="chart" className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.chart.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.chart.title}</h2>
        <p className="mt-5 max-w-[720px] text-[18px] leading-relaxed text-ink/70">{t.chart.body}</p>

        <div className="mt-10 overflow-x-auto rounded-[24px] border border-line bg-paper-warm p-6">
          {ranked.length > 0 ? (
            <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[760px] w-full" role="img" aria-label={t.chart.title}>
              {ranked.map((s, i) => {
                const y = 16 + i * rowH;
                const barW = ((W - labelW - valueW) * s.est_revenue_lost_cad) / max;
                const anchor = s.method_tag === "anchor_disclosed";
                return (
                  <g key={s.id}>
                    <text x={0} y={y + 20} fontSize={15} fill="#0a0f1e" fontWeight={500}>
                      {s.start_date}
                    </text>
                    <text x={118} y={y + 20} fontSize={13} fill="rgba(10,15,30,0.55)">
                      {s.snowfall_cm} cm
                    </text>
                    <rect x={labelW} y={y + 2} width={Math.max(barW, 3)} height={24} rx={6} fill={anchor ? "#d80621" : "#0a0f1e"} opacity={anchor ? 1 : 0.82} />
                    <text x={labelW + Math.max(barW, 3) + 12} y={y + 20} fontSize={15} fill="#0a0f1e" fontWeight={600}>
                      {money(s.est_revenue_lost_cad)}
                    </text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <p className="text-ink/60">Loading…</p>
          )}
        </div>
      </div>
    </section>
  );
}
