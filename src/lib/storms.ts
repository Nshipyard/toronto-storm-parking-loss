import fs from "node:fs";
import path from "node:path";

const DATA = path.join(process.cwd(), "data");

export interface CrossCheck {
  verdict: string;
  note: string;
  window_days?: number;
  baseline_days?: number;
  baseline_tickets_per_day?: number;
  window_tickets_per_day?: number;
  expected_window_tickets?: number;
  observed_window_tickets?: number;
  ticket_dip_pct?: number;
}

export interface Storm {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  snow_days: number;
  peak_day: string;
  peak_day_snowfall_cm: number;
  snowfall_cm: number;
  snowfall_source: string;
  est_transactions_lost: number;
  est_transactions_lost_low: number;
  est_transactions_lost_high: number;
  est_revenue_lost_cad: number;
  est_revenue_lost_cad_low: number;
  est_revenue_lost_cad_high: number;
  method_tag: string;
  cross_check: CrossCheck;
}

export interface Summary {
  project: string;
  tagline: string;
  anchor: {
    event: string;
    transactions_lost_disclosed: number;
    on_street_inventory_closed_pct: number;
    episode_snowfall_cm: number;
    source: string;
  };
  calibration: {
    rate_transactions_per_cm: number;
    math: string;
    transactions_band_pct: number;
    dollars_per_transaction: number;
    dollars_per_transaction_source: string;
    dollars_per_transaction_range: number[];
    note: string;
  };
  event_definition: string;
  snowfall_source: string;
  ticket_cross_check: string;
  storm_count: number;
  total_transactions_lost: number;
  total_revenue_lost_cad: number;
  total_revenue_lost_cad_low: number;
  total_revenue_lost_cad_high: number;
  biggest_storm_id: string;
}

export interface MonthRollup {
  month: string;
  storms: number;
  snowfall_cm: number;
  transactions_lost: number;
  revenue_lost_cad: number;
}

export interface AppData {
  summary: Summary;
  storms: Storm[];
  monthly: MonthRollup[];
}

let cache: AppData | null = null;

export function getData(): AppData {
  if (!cache) {
    cache = JSON.parse(fs.readFileSync(path.join(DATA, "app_data.json"), "utf-8")) as AppData;
  }
  return cache;
}

export function fmt(n: number): string {
  return n.toLocaleString("en-CA");
}

export function money(n: number): string {
  return "$" + n.toLocaleString("en-CA");
}
