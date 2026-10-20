"use client";

import { useLang } from "@/i18n";
import type { Summary } from "@/lib/storms";

function fmt(n: number) {
  return n.toLocaleString("en-CA");
}
function money(n: number) {
  return "$" + n.toLocaleString("en-CA");
}

export default function Hero({ summary }: { summary: Summary }) {
  const { t } = useLang();
  const s = summary;
  const stats = [
    { value: fmt(s.storm_count), label: t.statsLabels[0] },
    { value: fmt(s.total_transactions_lost), label: t.statsLabels[1] },
    { value: money(s.total_revenue_lost_cad), label: t.statsLabels[2] },
    {
      value: `${money(s.total_revenue_lost_cad_low)} to ${money(s.total_revenue_lost_cad_high)}`,
      label: t.statsLabels[3],
    },
  ];
  return (
    <section id="top" className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 pb-16 pt-16 md:pb-24 md:pt-24">
        <h1 className="display mt-5 max-w-[880px] text-[52px] md:text-[84px]">{t.hero.title}</h1>
        <p className="mt-6 max-w-[680px] text-[19px] leading-relaxed text-ink/70 md:text-[21px]">{t.hero.lead}</p>
        <p className="mt-6 max-w-[680px] text-[19px] leading-relaxed text-ink/70 md:text-[21px]">{t.hero.sub}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a href="#storms" className="rounded-full bg-canada px-7 py-3.5 text-[16px] font-semibold text-white hover:bg-canada-dark">
            {t.hero.cta1}
          </a>
          <a href="#methodology" className="rounded-full border border-line px-7 py-3.5 text-[16px] font-semibold hover:border-ink">
            {t.hero.cta2}
          </a>
        </div>
        <div className="mt-16 grid gap-px overflow-hidden rounded-[24px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((st) => (
            <div key={st.label} className="bg-paper p-7">
              <p className="display text-[36px] text-canada md:text-[40px]">{st.value}</p>
              <p className="mt-2 text-[15px] leading-snug text-ink/65">{st.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
