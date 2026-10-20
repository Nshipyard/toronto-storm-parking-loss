import { NextResponse } from "next/server";
import { getData } from "@/lib/storms";

// Minimal MCP server over streamable HTTP (JSON-RPC 2.0 via POST).
// Supports: initialize, tools/list, tools/call. Stateless.

const SERVER = { name: "toronto-storm-parking-loss", version: "1.0.0" };

const TOOLS = [
  {
    name: "storms_list",
    description:
      "List all major Toronto snowfall events 2023-2025 with estimated transactions and revenue lost, ranked by estimated revenue. Each entry has a low and high band and a method tag.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "storm_detail",
    description:
      "Full record for one storm: snowfall, estimated transactions and revenue lost with bands, and the parking-ticket cross-check note. Pass the storm id, e.g. 'S10'.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Storm id, e.g. 'S10'" } },
      required: ["id"],
    },
  },
  {
    name: "storms_summary",
    description:
      "The anchor facts (February 2025 TPA disclosure), the calibration math (transactions per cm, dollars per transaction), the event definition, and the 3-year totals with bands.",
    inputSchema: { type: "object", properties: {} },
  },
];

function ok(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}
function err(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}
function textResult(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handle(msg: any) {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return err(msg?.id ?? null, -32600, "Invalid Request");
  }
  const id = msg.id ?? null;
  switch (msg.method) {
    case "initialize":
      return ok(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: SERVER,
      });
    case "notifications/initialized":
      return null;
    case "tools/list":
      return ok(id, { tools: TOOLS });
    case "tools/call": {
      const { name, arguments: args } = msg.params ?? {};
      try {
        const d = getData();
        if (name === "storms_list") {
          const ranked = [...d.storms].sort((a, b) => b.est_revenue_lost_cad - a.est_revenue_lost_cad);
          return ok(id, textResult({ count: ranked.length, storms: ranked }));
        }
        if (name === "storm_detail") {
          const s = d.storms.find((x) => x.id === String(args.id));
          if (!s) return err(id, -32001, `Unknown storm id ${args.id}`);
          return ok(id, textResult(s));
        }
        if (name === "storms_summary") {
          return ok(id, textResult(d.summary));
        }
        return err(id, -32602, `Unknown tool ${name}`);
      } catch (e) {
        return err(id, -32000, `Tool error: ${(e as Error).message}`);
      }
    }
    default:
      return err(id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function POST(req: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(err(null, -32700, "Parse error"), { status: 400 });
  }
  if (Array.isArray(body)) {
    const out = body.map(handle).filter((r) => r !== null);
    return NextResponse.json(out);
  }
  const out = handle(body);
  if (out === null) return new NextResponse(null, { status: 202 });
  return NextResponse.json(out);
}

export async function GET() {
  return NextResponse.json(
    { error: "This MCP server accepts JSON-RPC 2.0 via POST only." },
    { status: 405 }
  );
}

export async function DELETE() {
  return new NextResponse(null, { status: 405 });
}
