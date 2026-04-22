import { NextRequest, NextResponse } from "next/server";

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

let cache: { data: unknown[]; ts: number } | null = null;
const CACHE_TTL = 1000 * 60 * 5;

async function fetchAllRecords(
  baseId: string,
  table: string,
  pat: string,
  filterByFormula?: string
): Promise<AirtableRecord[]> {
  const all: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(
      `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}`
    );
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    if (filterByFormula) url.searchParams.set("filterByFormula", filterByFormula);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${pat}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Airtable ${table} ${res.status}: ${text}`);
    }
    const data: AirtableResponse = await res.json();
    all.push(...data.records);
    offset = data.offset;
  } while (offset);
  return all;
}

async function buildLookup(
  baseId: string,
  table: string,
  pat: string
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const records = await fetchAllRecords(baseId, table, pat);
    for (const r of records) {
      const f = r.fields;
      const name =
        (f["Name"] as string) ||
        (f["Vendor"] as string) ||
        (f["Finish"] as string) ||
        (f["Title"] as string) ||
        (Object.values(f).find((v) => typeof v === "string") as string | undefined) ||
        r.id;
      map.set(r.id, String(name));
    }
  } catch (err) {
    console.warn(`[airtable] lookup failed for table "${table}":`, err);
  }
  return map;
}

export async function GET(req: NextRequest) {
  const pat = process.env.AIRTABLE_PAT;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName =
    process.env.AIRTABLE_MATERIALS_TABLE_ID ||
    process.env.AIRTABLE_TABLE_NAME ||
    "Materials";
  const vendorsTable = process.env.AIRTABLE_VENDORS_TABLE || "Vendors";
  const finishesTable = process.env.AIRTABLE_FINISHES_TABLE || "Finishes";

  if (!pat || !baseId) {
    return NextResponse.json(
      {
        error: "Airtable not configured. Set AIRTABLE_PAT and AIRTABLE_BASE_ID in .env.local",
        materials: [],
      },
      { status: 200 }
    );
  }

  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json({ materials: cache.data, source: "airtable_cache" });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "";

  try {
    let filterFormula: string | undefined;
    if (category) {
      filterFormula = `{Category} = '${category.replace(/'/g, "\\'")}'`;
    }

    const [allRecords, vendorMap, finishMap] = await Promise.all([
      fetchAllRecords(baseId, tableName, pat, filterFormula),
      buildLookup(baseId, vendorsTable, pat),
      buildLookup(baseId, finishesTable, pat),
    ]);

    const resolveLinkedNames = (val: unknown, m: Map<string, string>): string[] => {
      if (!Array.isArray(val)) return [];
      return val
        .map((id) => (typeof id === "string" ? m.get(id) || "" : ""))
        .filter((s): s is string => Boolean(s));
    };

    const materials = allRecords.map((rec) => {
      const f = rec.fields;
      const attachments =
        f["Image(s)"] || f["Image"] || f["Images"] || f["Photo"] || f["Photos"] || [];
      const imageArr = Array.isArray(attachments) ? attachments : [];
      const firstImg = imageArr[0] as
        | { url?: string; thumbnails?: { large?: { url?: string } } }
        | undefined;
      const imageUrl =
        firstImg?.thumbnails?.large?.url ||
        firstImg?.url ||
        (f["Image URL"] as string) ||
        "";

      const vendors = resolveLinkedNames(f["Vendor"], vendorMap);
      const finishes = resolveLinkedNames(f["Finishes*"] ?? f["Finishes"], finishMap);

      return {
        id: rec.id,
        name: (f["Name"] as string) || (f["Product Name"] as string) || "Untitled",
        category: (f["Category"] as string) || "",
        subCategory: (f["Sub category"] as string) || (f["Sub Category"] as string) || "",
        vendor: vendors[0] || "",
        vendors,
        price: (f["MSRP"] as number) ?? (f["Price"] as number) ?? null,
        description: (f["Description"] as string) || "",
        finish: finishes[0] || "",
        finishes,
        imageUrl,
        link: (f["Link"] as string) || (f["URL"] as string) || "",
      };
    });

    cache = { data: materials, ts: Date.now() };
    return NextResponse.json({ materials, source: "airtable" });
  } catch (err) {
    console.error("Airtable fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch from Airtable", materials: [] },
      { status: 500 }
    );
  }
}
