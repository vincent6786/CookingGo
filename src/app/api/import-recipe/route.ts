import { NextRequest, NextResponse } from "next/server";
import { extractRecipeJsonLd, recipeFromJsonLd } from "@/lib/recipeImport";

export const dynamic = "force-dynamic";

const MAX_BYTES = 2_000_000;
const TIMEOUT_MS = 8000;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return NextResponse.json(
      { error: "Only http(s) URLs are supported" },
      { status: 400 }
    );
  }

  let html: string;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(target.toString(), {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        // Many recipe sites block the default fetch UA. A normal browser UA
        // gets us through the soft anti-bot checks.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Couldn't fetch the page (HTTP ${res.status}).` },
        { status: 502 }
      );
    }

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: "Page is too large to import." },
        { status: 413 }
      );
    }
    html = new TextDecoder("utf-8", { fatal: false }).decode(buf);
  } catch (err) {
    const msg = (err as Error)?.name === "AbortError" ? "Timed out" : (err as Error).message;
    return NextResponse.json({ error: `Fetch failed: ${msg}` }, { status: 502 });
  }

  const jsonLd = extractRecipeJsonLd(html);
  if (!jsonLd) {
    return NextResponse.json(
      { error: "No recipe data found on this page. Try a different URL." },
      { status: 404 }
    );
  }

  const recipe = recipeFromJsonLd(jsonLd);
  return NextResponse.json({ recipe, sourceUrl: target.toString() });
}
