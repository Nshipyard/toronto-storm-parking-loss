"use client";

import { useState } from "react";
import { useLang } from "@/i18n";
import type { Storm } from "@/lib/storms";

function fmt(n: number) {
  return n.toLocaleString("en-CA");
}
function money(n: number) {
  return "$" + n.toLocaleString("en-CA");
}

function verdictStyle(v: string) {
  if (v === "agrees_strong") return "bg-emerald-700";
  if (v === "agrees_moderate") return "bg-emerald-600/80";
  if (v === "weak") return "bg-amber-600";
  if (v === "disagrees") return "bg-canada";
  return "bg-ink/40";
}

export default function StormExplorer({ storms }: { storms: Storm[] }) {
  const { t } = useLang();
  const [openId, setOpenId] = useState<string | null>(null);

  const ranked = [...storms].sort((a, b) => b.est_revenue_lost_cad - a.est_revenue_lost_cad);

  return (
    <section id="storms" className="bg-paper-warm">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.explorer.kicker}</p>
        <h2 className="display mt-4 max-w-[760px] text-[40px] md:text-[52px]">{t.explorer.title}</h2>
        <p className="mt-5 max-w-[760px] text-[18px] leading-relaxed text-ink/70">{t.explorer.body}</p>

        <div className="mt-10 overflow-hidden rounded-[24px] border border-line bg-paper">
          <div className="hidden grid-cols-[1.7fr_0.6fr_0.9fr_0.9fr_1.2fr] gap-4 border-b border-line bg-muted px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink/55 md:grid">
            <span>{t.explorer.colStorm}</span>
            <span>{t.explorer.colSnow}</span>
            <span>{t.explorer.colTransactions}</span>
            <span>{t.explorer.colRevenue}</span>
            <span>{t.explorer.colCheck}</span>
          </div>
          {ranked.map((s) => (
            <div key={s.id} className="border-b border-line last:border-0">
              <button
                className="grid w-full grid-cols-1 gap-2 px-6 py-5 text-left hover:bg-muted/60 md:grid-cols-[1.7fr_0.6fr_0.9fr_0.9fr_1.2fr] md:gap-4"
                onClick={() => setOpenId(openId === s.id ? null : s.id)}
                aria-expanded={openId === s.id}
              >
                <span>
                  <span className="display block text-[20px] leading-tight">{s.name}</span>
                  <span className="mt-1 flex gap-2">
                    {s.method_tag === "anchor_disclosed" ? (
                      <span className="rounded-full bg-canada px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                        {t.labels.anchor}
                      </span>
                    ) : (
                      <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink/60">
                        {t.labels.estimate}
                      </span>
                    )}
                    <span className="text-[13px] text-ink/50">
                      {s.start_date} to {s.end_date} · peak {s.peak_day_snowfall_cm} cm on {s.peak_day}
                    </span>
                  </span>
                </span>
                <span className="text-[17px] font-medium">{s.snowfall_cm} cm</span>
                <span>
                  <span className="block text-[17px] font-medium">{fmt(s.est_transactions_lost)}</span>
                  <span className="block text-[13px] text-ink/50">
                    {fmt(s.est_transactions_lost_low)} to {fmt(s.est_transactions_lost_high)}
                  </span>
                </span>
                <span>
                  <span className="block text-[17px] font-semibold">{money(s.est_revenue_lost_cad)}</span>
                  <span className="block text-[13px] text-ink/50">
                    {money(s.est_revenue_lost_cad_low)} to {money(s.est_revenue_lost_cad_high)}
                  </span>
                </span>
                <span className="flex items-start gap-2">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${verdictStyle(s.cross_check.verdict)}`} />
                  <span className="text-[14px] leading-snug text-ink/70">
                    {s.cross_check.ticket_dip_pct !== undefined
                      ? `${s.cross_check.ticket_dip_pct}% ticket dip`
                      : s.cross_check.verdict}
                  </span>
                </span>
              </button>
              {openId === s.id && (
                <div className="border-t border-line bg-muted/50 px-6 py-5">
                  <p className="max-w-[820px] text-[15px] leading-relaxed text-ink/75">
                    <strong>{t.labels.crossCheck}:</strong> {s.cross_check.note}
                  </p>
                  <p className="mt-3 max-w-[820px] text-[14px] leading-relaxed text-ink/55">
                    Snowfall source: {s.snowfall_source}. Revenue band {t.explorer.band}:{" "}
                    {money(s.est_revenue_lost_cad_low)} to {money(s.est_revenue_lost_cad_high)}.
                    {s.method_tag === "anchor_disclosed" &&
                      " This row is part of the February 2025 anchor episode: the two anchor rows together reproduce the disclosed 371,000 transactions."}
                  </p>
                </div>
              )}
            </div>
          ))}
          {ranked.length === 0 && <p className="px-6 py-8 text-ink/60">Loading…</p>}
        </div>
      </div>
    </section>
  );
}
