import { NextResponse } from "next/server";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Toronto Storm Parking Loss API",
    version: "1.0.0",
    description:
      "Per-storm parking revenue loss estimates for Toronto, 2023-2025. Calibrated on the Toronto Parking Authority disclosure for February 2025 (371,000 transactions lost when snow removal closed 47% of on-street inventory). Snowfall from the Open-Meteo archive (ERA5 reanalysis). Every estimate carries a low and high band and a parking-ticket cross-check. MIT licensed.",
  },
  servers: [{ url: "https://storm-loss.canada.nshipyard.com/api/v1" }],
  paths: {
    "/storms": {
      get: {
        summary: "All major storms ranked by estimated revenue lost, or one storm by id",
        parameters: [
          { name: "id", in: "query", required: false, schema: { type: "string" }, example: "S10" },
        ],
        responses: {
          "200": { description: "Storm list sorted by estimated revenue lost, or a single storm" },
          "404": { description: "Unknown storm id" },
        },
      },
    },
    "/storms/summary": {
      get: {
        summary: "Anchor facts, calibration math, event definition, 3-year totals",
        responses: { "200": { description: "Summary object" } },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
