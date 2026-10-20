"use client";

import { useLang } from "@/i18n";

export function Methodology() {
  const { t } = useLang();
  return (
    <section id="methodology" className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.method.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.method.title}</h2>
        <ul className="mt-8 max-w-[760px] space-y-4">
          {t.method.points.map((p, i) => (
            <li key={i} className="flex gap-4 rounded-[20px] border border-line bg-paper-warm p-5">
              <span className="display shrink-0 text-[22px] text-canada">{i + 1}</span>
              <p className="text-[16px] leading-relaxed text-ink/75">{p}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Downloads() {
  const { t } = useLang();
  const files = [
    { name: "storms.csv", path: "/data/storms.csv" },
    { name: "storms.json", path: "/api/v1/storms" },
    { name: "snowfall_daily.csv", path: "/data/snowfall_daily.csv" },
    { name: "summary.json", path: "/api/v1/storms/summary" },
  ];
  return (
    <section id="data" className="bg-paper-warm">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.downloads.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.downloads.title}</h2>
        <p className="mt-5 max-w-[720px] text-[18px] leading-relaxed text-ink/70">{t.downloads.body}</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {files.map((f) => (
            <div key={f.name} className="flex items-center justify-between gap-4 rounded-[24px] border border-line bg-paper p-6">
              <code className="font-mono text-[15px] font-medium">{f.name}</code>
              <a href={f.path} download className="shrink-0 rounded-full border border-line px-5 py-2.5 text-[15px] font-semibold hover:border-ink">
                {t.downloads.download}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
