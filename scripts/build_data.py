#!/usr/bin/env python3
"""Build the storm-loss dataset for toronto-storm-parking-loss.

Pipeline:
  1. Load daily snowfall (Open-Meteo ERA5 reanalysis, Toronto 43.65,-79.38,
     2023-01-01 to 2025-12-31). data/raw_openmeteo_era5.json is the cached
     API response so the build works offline; the script re-fetches live if
     the cache is older than the requested window end.
  2. Detect major snowfall events: maximal runs of snow days (>= 1.0 cm),
     allowing one gap day below 1.0 cm inside an event. An event qualifies
     as "major" when total snowfall across start..end is >= 5.0 cm.
  3. Calibrate a transactions-per-cm rate on the TPA-disclosed February 2025
     episode: TPA says the lengthy February snow event closed 47% of its
     on-street inventory and cost 371,000 transactions (2026 Operating Budget
     report, Nov 2025). The episode spans Feb 8-9 and Feb 12-16, 2025.
  4. Estimate transactions and revenue lost per event: rate x snowfall,
     revenue at the blended $/transaction from TPA's 2025 forecast.
  5. Cross-check each event against daily City parking ticket counts:
     compare the impact window against a local baseline and flag where
     the ticket data disagrees with the estimator.

Outputs in data/: storms.json, storms.csv, snowfall_daily.csv, summary.json,
app_data.json. Copies of storms.csv and snowfall_daily.csv go to public/data/.

Snowfall units: centimetres. Money: Canadian dollars.
"""
import csv
import json
import os
import urllib.request
from datetime import date, timedelta

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "..", "data")
PUBLIC = os.path.join(BASE, "..", "public", "data")

# ---- Anchor facts (all verified against the TPA 2026 Operating Budget report,
# data/tpa_2026_budget_report.pdf, downloaded from toronto.ca) ----
ANCHOR_TRANSACTIONS_LOST = 371_000            # FACT: disclosed by TPA
ANCHOR_NOTE = "TPA 2026 Operating Budget report, Nov 25 2025, p.1"
TPA_FORECAST_REVENUE = 177_300_000            # FACT: 2025 forecast revenue
TPA_FORECAST_TRANSACTIONS = 32_400_000        # FACT: 2025 forecast total transactions
DOLLARS_PER_TRANSACTION = TPA_FORECAST_REVENUE / TPA_FORECAST_TRANSACTIONS  # 5.4722
DOLLARS_PER_TXN_LOW = DOLLARS_PER_TRANSACTION * 0.90
DOLLARS_PER_TXN_HIGH = DOLLARS_PER_TRANSACTION * 1.10
TXN_BAND = 0.30                               # +/-30% on the snowfall->loss rate

# Event detection knobs
SNOW_DAY_CM = 1.0     # a day with this much snowfall starts or continues an event
QUALIFY_TOTAL_CM = 5.0  # event must total at least this much snowfall
IMPACT_TAIL_DAYS = 6  # removal days after the last snow day included in the window
BASELINE_DAYS = 28    # baseline span on each side of the impact window

HOLIDAYS = {
    "2023-01-01", "2023-01-02", "2023-02-20", "2023-04-07", "2023-05-22",
    "2023-07-01", "2023-07-03", "2023-08-07", "2023-09-04", "2023-09-30",
    "2023-10-09", "2023-12-25", "2023-12-26",
    "2024-01-01", "2024-02-19", "2024-03-29", "2024-05-20", "2024-07-01",
    "2024-08-05", "2024-09-02", "2024-09-30", "2024-10-14", "2024-12-25",
    "2024-12-26",
    "2025-01-01", "2025-02-17", "2025-04-18", "2025-05-19", "2025-07-01",
    "2025-08-04", "2025-09-01", "2025-09-30", "2025-10-13", "2025-12-25",
    "2025-12-26",
}
HOLIDAY_NAMES = {
    "2023-01-01": "New Year's Day", "2023-01-02": "New Year's Day observed",
    "2023-02-20": "Family Day", "2023-04-07": "Good Friday",
    "2023-05-22": "Victoria Day", "2023-07-01": "Canada Day",
    "2023-07-03": "Canada Day observed", "2023-08-07": "Civic Holiday",
    "2023-09-04": "Labour Day", "2023-09-30": "Truth and Reconciliation Day",
    "2023-10-09": "Thanksgiving", "2023-12-25": "Christmas Day",
    "2023-12-26": "Boxing Day",
    "2024-01-01": "New Year's Day", "2024-02-19": "Family Day",
    "2024-03-29": "Good Friday", "2024-05-20": "Victoria Day",
    "2024-07-01": "Canada Day", "2024-08-05": "Civic Holiday",
    "2024-09-02": "Labour Day", "2024-09-30": "Truth and Reconciliation Day",
    "2024-10-14": "Thanksgiving", "2024-12-25": "Christmas Day",
    "2024-12-26": "Boxing Day",
    "2025-01-01": "New Year's Day", "2025-02-17": "Family Day",
    "2025-04-18": "Good Friday", "2025-05-19": "Victoria Day",
    "2025-07-01": "Canada Day", "2025-08-04": "Civic Holiday",
    "2025-09-01": "Labour Day", "2025-09-30": "Truth and Reconciliation Day",
    "2025-10-13": "Thanksgiving", "2025-12-25": "Christmas Day",
    "2025-12-26": "Boxing Day",
}


def fetch_snowfall():
    cache = os.path.join(DATA, "raw_openmeteo_era5.json")
    url = ("https://archive-api.open-meteo.com/v1/archive"
           "?latitude=43.65&longitude=-79.38"
           "&start_date=2023-01-01&end_date=2025-12-31"
           "&daily=snowfall_sum,precipitation_sum&timezone=America%2FToronto")
    try:
        with urllib.request.urlopen(url, timeout=120) as r:
            payload = json.loads(r.read().decode("utf-8"))
        with open(cache, "w") as f:
            json.dump(payload, f)
        print("snowfall: fetched live from Open-Meteo")
    except Exception as e:
        with open(cache) as f:
            payload = json.load(f)
        print(f"snowfall: live fetch failed ({e}), using cached copy")
    d = payload["daily"]
    return {t: (s or 0.0) for t, s in zip(d["time"], d["snowfall_sum"])}


def detect_events(snow):
    """Return list of dicts with start/end date strings and total snowfall."""
    days = sorted(snow.keys())
    runs, run, gap = [], [], 0
    for d in days:
        s = snow[d]
        if s >= SNOW_DAY_CM:
            if gap and not run:
                pass
            run.append(d)
            gap = 0
        else:
            if run:
                if gap == 0:
                    gap += 1  # tolerate one gap day
                else:
                    runs.append(run)
                    run, gap = [], 0
    if run:
        runs.append(run)
    events = []
    for r in runs:
        start, end = r[0], r[-1]
        total = sum(snow[x] for x in days_between(start, end))
        if total >= QUALIFY_TOTAL_CM:
            events.append({
                "start": start, "end": end,
                "snowfall_cm": round(total, 1),
                "peak_day": max(r, key=lambda x: snow[x]),
                "peak_day_cm": round(snow[max(r, key=lambda x: snow[x])], 1),
                "snow_days": len(r),
            })
    return events


def days_between(a, b):
    out, cur = [], date.fromisoformat(a)
    end = date.fromisoformat(b)
    while cur <= end:
        out.append(cur.isoformat())
        cur += timedelta(days=1)
    return out


def load_tickets():
    with open(os.path.join(DATA, "daily_tickets.json")) as f:
        return json.load(f)


def cross_check(ev, snow_events_windows, tickets):
    start = date.fromisoformat(ev["start"])
    end = date.fromisoformat(ev["end"])
    win_start = start
    win_end = end + timedelta(days=IMPACT_TAIL_DAYS)
    window = days_between(win_start.isoformat(), win_end.isoformat())
    # baseline: BASELINE_DAYS before window and after, excluding other event windows
    def in_other_window(d):
        for s, e in snow_events_windows:
            if s <= d <= e:
                return True
        return False
    before = days_between((win_start - timedelta(days=BASELINE_DAYS + 1)).isoformat(),
                          (win_start - timedelta(days=1)).isoformat())
    after = days_between((win_end + timedelta(days=1)).isoformat(),
                         (win_end + timedelta(days=BASELINE_DAYS + 1)).isoformat())
    base_days = [d for d in (before + after)
                 if d in tickets and not in_other_window(d)]
    window_days = [d for d in window if d in tickets]
    if len(base_days) < 10 or not window_days:
        return {"verdict": "no_baseline",
                "note": "Not enough ticket days near the event to build a baseline."}
    base_mean = sum(tickets[d] for d in base_days) / len(base_days)
    win_mean = sum(tickets[d] for d in window_days) / len(window_days)
    expected = base_mean * len(window_days)
    observed = sum(tickets[d] for d in window_days)
    dip = 1 - win_mean / base_mean
    hols = sorted(HOLIDAYS.intersection(set(window_days)))
    hol_note = (" Affected by holiday: " + ", ".join(HOLIDAY_NAMES[h] for h in hols) + "."
                if hols else "")
    if dip >= 0.20:
        verdict = "agrees_strong"
        note = (f"Ticket counts fell {dip*100:.0f}% below baseline in the "
                f"{len(window_days)}-day impact window, consistent with a major disruption to street parking.")
    elif dip >= 0.08:
        verdict = "agrees_moderate"
        note = (f"Ticket counts fell {dip*100:.0f}% below baseline in the "
                f"{len(window_days)}-day impact window, consistent with the estimated loss.")
    elif dip >= 0.0:
        verdict = "weak"
        note = (f"Ticket counts fell only {dip*100:.0f}% below baseline in the "
                f"{len(window_days)}-day impact window. The snowfall estimate may overstate "
                f"the impact on street parking, or enforcement kept running through the snow.")
    else:
        verdict = "disagrees"
        note = (f"Ticket counts ROSE {-dip*100:.0f}% above baseline in the "
                f"{len(window_days)}-day impact window. The ticket data contradicts the "
                f"estimator for this event.")
    return {"verdict": verdict, "note": note + hol_note,
            "window_days": len(window_days),
            "baseline_days": len(base_days),
            "baseline_tickets_per_day": round(base_mean, 0),
            "window_tickets_per_day": round(win_mean, 0),
            "expected_window_tickets": round(expected, 0),
            "observed_window_tickets": observed,
            "ticket_dip_pct": round(dip * 100, 1)}


def nice_name(start, end, seq):
    fmt = lambda d: date.fromisoformat(d).strftime("%d %B %Y")
    if start == end:
        return f"{date.fromisoformat(start).strftime('%d %B %Y')} storm"
    return f"{fmt(start)} to {fmt(end)} storm"


def main():
    snow = fetch_snowfall()
    tickets = load_tickets()
    events = detect_events(snow)
    # impact windows for baseline exclusion (all qualifying events)
    windows = [((date.fromisoformat(e["start"]) - timedelta(days=1)).isoformat(),
                (date.fromisoformat(e["end"]) + timedelta(days=IMPACT_TAIL_DAYS)).isoformat())
               for e in events]

    # Calibration: the TPA-disclosed February 2025 episode covers every
    # qualifying event that starts in February 2025 (two waves: Feb 6-9 and
    # Feb 12-18 in the ERA5 series).
    feb_events = [e for e in events if e["start"].startswith("2025-02")]
    assert len(feb_events) == 2, f"expected 2 Feb 2025 events, got {feb_events}"
    episode_snowfall = sum(e["snowfall_cm"] for e in feb_events)
    biggest_wave = max(feb_events, key=lambda e: e["snowfall_cm"])
    rate = ANCHOR_TRANSACTIONS_LOST / episode_snowfall
    alt_rate = ANCHOR_TRANSACTIONS_LOST / biggest_wave["snowfall_cm"]

    storms = []
    for i, e in enumerate(events, start=1):
        is_anchor = e["start"].startswith("2025-02")
        txn = rate * e["snowfall_cm"]
        rev = txn * DOLLARS_PER_TRANSACTION
        txn_low = txn * (1 - TXN_BAND)
        txn_high = txn * (1 + TXN_BAND)
        check = cross_check(e, windows, tickets)
        storms.append({
            "id": f"S{i:02d}",
            "name": nice_name(e["start"], e["end"], i),
            "start_date": e["start"],
            "end_date": e["end"],
            "snow_days": e["snow_days"],
            "peak_day": e["peak_day"],
            "peak_day_snowfall_cm": e["peak_day_cm"],
            "snowfall_cm": e["snowfall_cm"],
            "snowfall_source": "Open-Meteo ERA5 snowfall_sum at 43.65N 79.38W (fallback; ECCC bulk download blocked)",
            "est_transactions_lost": int(round(txn / 100) * 100),
            "est_transactions_lost_low": int(round(txn_low / 100) * 100),
            "est_transactions_lost_high": int(round(txn_high / 100) * 100),
            "est_revenue_lost_cad": int(round(rev / 100) * 100),
            "est_revenue_lost_cad_low": int(round(txn_low * DOLLARS_PER_TXN_LOW / 100) * 100),
            "est_revenue_lost_cad_high": int(round(txn_high * DOLLARS_PER_TXN_HIGH / 100) * 100),
            "method_tag": "anchor_disclosed" if is_anchor else "calibrated_estimate",
            "cross_check": check,
        })

    # monthly rollup of estimated losses
    monthly = {}
    for s in storms:
        m = s["start_date"][:7]
        monthly.setdefault(m, {"month": m, "storms": 0, "snowfall_cm": 0,
                               "transactions_lost": 0, "revenue_lost_cad": 0})
        monthly[m]["storms"] += 1
        monthly[m]["snowfall_cm"] = round(monthly[m]["snowfall_cm"] + s["snowfall_cm"], 1)
        monthly[m]["transactions_lost"] += s["est_transactions_lost"]
        monthly[m]["revenue_lost_cad"] += s["est_revenue_lost_cad"]

    summary = {
        "project": "toronto-storm-parking-loss",
        "tagline": "Toronto parking revenue lost to snowstorms, 2023-2025",
        "anchor": {
            "event": "February 2025 (Feb 6-9 and Feb 12-18 waves)",
            "transactions_lost_disclosed": ANCHOR_TRANSACTIONS_LOST,
            "on_street_inventory_closed_pct": 47,
            "episode_snowfall_cm": round(episode_snowfall, 1),
            "source": "Toronto Parking Authority 2026 Operating Budget report, Nov 25 2025, p.1",
        },
        "calibration": {
            "rate_transactions_per_cm": round(rate, 0),
            "math": (f"{ANCHOR_TRANSACTIONS_LOST:,} disclosed transactions / "
                     f"{episode_snowfall:.1f} cm episode snowfall = {rate:,.0f} transactions per cm"),
            "transactions_band_pct": TXN_BAND * 100,
            "dollars_per_transaction": round(DOLLARS_PER_TRANSACTION, 2),
            "dollars_per_transaction_source": (
                "TPA 2025 forecast: $177.3M revenue on 32.4M transactions, blended "
                f"rate {DOLLARS_PER_TRANSACTION:.2f} per transaction"),
            "dollars_per_transaction_range": [round(DOLLARS_PER_TXN_LOW, 2),
                                              round(DOLLARS_PER_TXN_HIGH, 2)],
            "note": (f"The +-{TXN_BAND*100:.0f}% band on the rate contains the alternative "
                     f"reading where the 371,000 covers only the larger Feb 12-18 wave "
                     f"(rate would be {alt_rate:,.0f} per cm)."),
        },
        "event_definition": (f"A snow day is >= {SNOW_DAY_CM} cm. An event is a maximal run of "
                             f"snow days allowing one gap day below {SNOW_DAY_CM} cm. A major "
                             f"storm qualifies at >= {QUALIFY_TOTAL_CM} cm total."),
        "snowfall_source": ("Open-Meteo archive (ERA5 reanalysis), Toronto 43.65N 79.38W, "
                            "daily snowfall_sum. Environment Canada bulk downloads were "
                            "unreachable from the build network; Open-Meteo is the "
                            "documented fallback."),
        "ticket_cross_check": ("Daily City of Toronto parking ticket counts, 2023-2025, are "
                               "used as a street parking activity proxy only, never as a revenue input."),
        "storm_count": len(storms),
        "total_transactions_lost": sum(s["est_transactions_lost"] for s in storms),
        "total_revenue_lost_cad": sum(s["est_revenue_lost_cad"] for s in storms),
        "total_revenue_lost_cad_low": sum(s["est_revenue_lost_cad_low"] for s in storms),
        "total_revenue_lost_cad_high": sum(s["est_revenue_lost_cad_high"] for s in storms),
        "biggest_storm_id": max(storms, key=lambda s: s["est_revenue_lost_cad"])["id"],
    }

    app_data = {"summary": summary, "storms": storms,
                "monthly": sorted(monthly.values(), key=lambda m: m["month"])}
    with open(os.path.join(DATA, "storms.json"), "w") as f:
        json.dump(storms, f, indent=2)
    with open(os.path.join(DATA, "summary.json"), "w") as f:
        json.dump(summary, f, indent=2)
    with open(os.path.join(DATA, "app_data.json"), "w") as f:
        json.dump(app_data, f, indent=2)

    csv_fields = ["id", "name", "start_date", "end_date", "snow_days", "peak_day",
                  "peak_day_snowfall_cm", "snowfall_cm",
                  "est_transactions_lost", "est_transactions_lost_low",
                  "est_transactions_lost_high", "est_revenue_lost_cad",
                  "est_revenue_lost_cad_low", "est_revenue_lost_cad_high",
                  "method_tag", "cross_check_verdict", "cross_check_note"]
    for p in (os.path.join(DATA, "storms.csv"), os.path.join(PUBLIC, "storms.csv")):
        with open(p, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=csv_fields)
            w.writeheader()
            for s in storms:
                w.writerow({k: s.get(k, "") for k in csv_fields[:15]} | {
                    "cross_check_verdict": s["cross_check"]["verdict"],
                    "cross_check_note": s["cross_check"]["note"]})

    with open(os.path.join(DATA, "snowfall_daily.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["date", "snowfall_cm"])
        for d in sorted(snow):
            w.writerow([d, round(snow[d], 2)])
    with open(os.path.join(PUBLIC, "snowfall_daily.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["date", "snowfall_cm"])
        for d in sorted(snow):
            w.writerow([d, round(snow[d], 2)])

    print(f"storms: {len(storms)}")
    print(f"total est transactions lost: {summary['total_transactions_lost']:,}")
    print(f"total est revenue lost: ${summary['total_revenue_lost_cad']:,}")
    print(f"calibration: {rate:,.0f} transactions per cm on {episode_snowfall:.1f} cm episode snowfall")
    for s in storms:
        print(f"  {s['id']} {s['start_date']}..{s['end_date']} "
              f"snow={s['snowfall_cm']}cm txn={s['est_transactions_lost']:,} "
              f"rev=${s['est_revenue_lost_cad']:,} check={s['cross_check']['verdict']}")


if __name__ == "__main__":
    main()
