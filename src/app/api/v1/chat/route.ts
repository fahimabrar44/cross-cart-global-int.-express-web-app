import connectDB from "@/config/db";
import { FAQ } from "@/server/models/FAQ.model";
import { errorResponse } from "@/server/common/response";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GROQ_MODEL = process.env.GROQ_CHAT_MODEL || "llama-3.3-70b-versatile";

const BUSINESS_CONTEXT = `You are the official AI customer-support assistant for "Cross Cart Global International Express" (also CrossCart Global), an international courier & logistics company based in Dhaka, Bangladesh.
Services: international courier/parcel delivery, air freight, sea freight, eCommerce logistics & fulfillment, freight forwarding, customs clearance, door-to-door delivery, real-time shipment tracking.
Partners: DHL, FedEx, Aramex, UPS and local courier partners (discounted rates).
Contact: phone +8801811107751 / +8801410144466, email cross.cart.bd@gmail.com / support@crosscartglobal.com.
Site: https://crosscartglobal.com — tracking at /ship-and-track/track-shipment, quote at /ship-and-track/claculate-shipping-charge, contact at /contact.
Rules: Be polite & concise. Reply in the customer's language (Bengali or English). Use the provided tools whenever a user asks to track a parcel, get a shipping quote, submit a contact message, or search the FAQ. Never invent prices/transit times not returned by the tools. If you cannot help, suggest contacting support.`;

// Tools the model can invoke (executed server-side against public APIs / DB)
const TOOLS = [
  {
    type: "function",
    function: {
      name: "track_parcel",
      description:
        "Track a shipment using its tracking ID / tracking number and return current status.",
      parameters: {
        type: "object",
        properties: { tracking_id: { type: "string" } },
        required: ["tracking_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_shipping_quote",
      description:
        "Estimate a shipping charge/quote given origin, destination, weight (kg) and optional courier.",
      parameters: {
        type: "object",
        properties: {
          origin: { type: "string" },
          destination: { type: "string" },
          weight_kg: { type: "number" },
          courier: { type: "string" },
        },
        required: ["origin", "destination", "weight_kg"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "submit_contact",
      description:
        "Submit a customer contact/support message (name, phone, email, message).",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          message: { type: "string" },
        },
        required: ["name", "phone", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_faq",
      description: "Search the FAQ knowledge base for a relevant answer.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
];

function getBaseUrl(req: NextRequest): string {
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    process.env.PUBLIC_APP_URL ||
    "http://localhost:3000";
  return host.startsWith("http") ? host : `https://${host}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runTool(name: string, args: any, req: NextRequest): Promise<string> {
  const base = getBaseUrl(req);
  try {
    if (name === "track_parcel") {
      const r = await fetch(
        `${base}/api/v1/tracks/${encodeURIComponent(args.tracking_id)}`
      );
      return JSON.stringify(await r.json().catch(() => ({})));
    }
    if (name === "get_shipping_quote") {
      const r = await fetch(`${base}/api/v1/prices/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      return JSON.stringify(await r.json().catch(() => ({})));
    }
    if (name === "submit_contact") {
      const r = await fetch(`${base}/api/v1/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      return JSON.stringify(await r.json().catch(() => ({})));
    }
    if (name === "search_faq") {
      await connectDB();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q: any = { $text: { $search: args.query } };
      const faqs = await FAQ.find({ ...q, isActive: true })
        .limit(5)
        .select("question answer")
        .lean();
      return JSON.stringify(faqs);
    }
    return "Unknown tool";
  } catch (e) {
    return `Tool error: ${e instanceof Error ? e.message : "failed"}`;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => ({}));
    const message: string = (body.message || "").toString().trim();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const history: any[] = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return errorResponse({ status: 400, message: "Message is required", req });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return new NextResponse(
        "Chat is not configured yet (missing GROQ_API_KEY). Please contact the site administrator.",
        { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    const messages = [
      { role: "system", content: BUSINESS_CONTEXT },
      ...history.slice(-8).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || ""),
      })),
      { role: "user", content: message },
    ];

    // First call: decide whether to use a tool (non-streaming)
    const decideRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          temperature: 0.3,
          max_tokens: 700,
          tools: TOOLS,
          tool_choice: "auto",
          stream: false,
        }),
      }
    );

    const decideData = await decideRes.json().catch(() => null);
    const assistantMsg = decideData?.choices?.[0]?.message;

    if (assistantMsg?.tool_calls?.length) {
      // Execute tools server-side, then stream the final answer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toolMessages: any[] = [
        {
          role: "assistant",
          content: assistantMsg.content || null,
          tool_calls: assistantMsg.tool_calls,
        },
      ];
      for (const tc of assistantMsg.tool_calls) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const args = JSON.parse(tc.function.arguments || "{}");
        const result = await runTool(tc.function.name, args, req);
        toolMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result,
        });
      }

      const finalRes = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [...messages, ...toolMessages],
            temperature: 0.3,
            max_tokens: 700,
            stream: true,
          }),
        }
      );

      if (!finalRes.ok || !finalRes.body) {
        return new NextResponse(
          "Assistant is temporarily unavailable. Please try again later.",
          { status: 502, headers: { "Content-Type": "text/plain; charset=utf-8" } }
        );
      }
      return new NextResponse(finalRes.body, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
        },
      });
    }

    // No tool call: return the direct answer (streamed as a single chunk)
    const answer =
      assistantMsg?.content ||
      "Sorry, I could not generate a response. Please try again.";
    return new NextResponse(answer, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Chat failed";
    console.error("Chat route error:", msg);
    return new NextResponse(
      "Sorry, something went wrong. Please try again later.",
      { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }
}
