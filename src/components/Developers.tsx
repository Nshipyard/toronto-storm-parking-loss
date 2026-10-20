"use client";

import { useLang } from "@/i18n";
import McpConnect from "./McpConnect";

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/storms",
    desc: "All 13 storms, ranked by estimated revenue lost",
    response: `{\n  "count": 13,\n  "storms": [{\n    "id": "S10",\n    "name": "12 February 2025 to 18 February 2025 storm",\n    "snowfall_cm": 32.6,\n    "est_transactions_lost": 288700,\n    "est_revenue_lost_cad": 1579600,\n    "method_tag": "anchor_disclosed"\n  }, … ]\n}`,
  },
  {
    method: "GET",
    path: "/api/v1/storms?id=S10",
    desc: "One storm, with its ticket cross-check",
    response: `{\n  "id": "S10",\n  "est_revenue_lost_cad": 1579600,\n  "est_revenue_lost_cad_low": 995100,\n  "est_revenue_lost_cad_high": 2258800,\n  "cross_check": {\n    "verdict": "agrees_strong",\n    "ticket_dip_pct": 30.0\n  }\n}`,
  },
  {
    method: "GET",
    path: "/api/v1/storms/summary",
    desc: "Anchor, calibration math, totals",
    response: `{\n  "storm_count": 13,\n  "total_revenue_lost_cad": 7883500,\n  "calibration": {\n    "rate_transactions_per_cm": 8854,\n    "dollars_per_transaction": 5.47\n  }\n}`,
  },
];

export default function Developers() {
  const { t } = useLang();
  return (
    <section id="developers" className="bg-ink text-white">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">{t.developers.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.developers.title}</h2>
        <p className="mt-5 max-w-[720px] text-[18px] leading-relaxed text-white/70">{t.developers.body}</p>

        <h3 className="mt-14 text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">{t.developers.endpoints}</h3>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {endpoints.map((e) => (
            <article key={e.path} className="overflow-hidden rounded-[24px] bg-white/[0.06]">
              <div className="border-b border-white/10 px-6 py-4">
                <span className="mr-3 rounded-full bg-canada px-2.5 py-1 font-mono text-[12px] font-semibold">{e.method}</span>
                <code className="font-mono text-[13px] text-white/85 break-all">{e.path}</code>
                <p className="mt-2 text-[14px] text-white/60">{e.desc}</p>
              </div>
              <pre className="overflow-x-auto px-6 py-4 font-mono text-[12.5px] leading-relaxed text-white/75">{e.response}</pre>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <a href="/api/openapi.json" className="block rounded-[24px] bg-white/[0.06] p-6 hover:bg-white/[0.09]">
            <h4 className="text-[19px] font-semibold">{t.developers.openapi}</h4>
            <code className="mt-2 block font-mono text-[13px] text-white/60">GET /api/openapi.json</code>
          </a>
        </div>

        <McpConnect
          config={{
            slug: "toronto-storm-parking-loss",
            displayName: "Toronto Storm Parking Loss",
            exampleEn: "Get the estimated revenue lost for the biggest storm and tell me its confidence band",
            exampleFr: "Donne-moi les revenus estimés perdus pour la plus grosse tempête et leur fourchette",
          }}
        />
      </div>
    </section>
  );
}
