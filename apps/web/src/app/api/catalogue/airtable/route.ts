import { NextRequest, NextResponse } from "next/server";

/**
 * Airtable materials API
 *
 * Pulls all records from the designer's Airtable base.
 * Required env vars:
 *   AIRTABLE_PAT          – Personal Access Token (starts with "pat")
 *   AIRTABLE_BASE_ID      – Base ID (starts with "app")
 *   AIRTABLE_TABLE_NAME   – Table name (default: "Materials")
 */

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

// Simple in-memory cache to avoid hammering Airtable on every request
let cache: { data: unknown[]; ts: number } | null = null;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export async function GET(req: NextRequest) {
  const pat = process.env.AIRTABLE_PAT;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME || "Materials";

  if (!pat || !baseId) {
    return NextResponse.json(
      {
        error: "Airtable not configured. Set AIRTABLE_PAT and AIRTABLE_BASE_ID in .env.local",
        materials: [],
      },
      { status: 200 }
    );
  }

  // Return cached data if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json({ materials: cache.data, source: "airtable_cache" });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "";
  const vendor = searchParams.get("vendor") || "";

  try {
    const allRecords: AirtableRecord[] = [];
    let offset: string | undefined;

    // Paginate through all records
    do {
      const url = new URL(
        `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableName)}`
      );
      url.searchParams.set("pageSize", "100");
      if (offset) url.searchParams.set("offset", offset);

      // Apply Airtable formula filters if present
      const filters: string[] = [];
      if (category) filters.push(`{Category} = '${category.replace(/'/g, "\\'")}'`);
      if (vendor) filters.push(`{Vendor} = '${vendor.replace(/'/g, "\\'")}'`);
      if (filters.length > 0) {
        url.searchParams.set(
          "filterByFormula",
          filters.length === 1 ? filters[0] : `AND(${filters.join(",")})`
        );
      }

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${pat}` },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Airtable error:", res.status, text);
        return NextResponse.json(
          { error: `Airtable API error: ${res.status}`, materials: [] },
          { status: 200 }
        );
      }

      const data: AirtableResponse = await res.json();
      allRecords.push(...data.records);
      offset = data.offset;
    } while (offset);

    // Normalize records into a consistent shape
    const materials = allRecords.map((rec) => {
      const f = rec.fields;

      // Airtable attachments come as an array of objects with {url, filename, ...}
      const attachments = f["Image"] || f["Images"] || f["Photo"] || f["Photos"] || [];
      const imageArr = Array.isArray(attachments) ? attachments : [];
      const imageUrl =
        (imageArr[0] as { url?: string })?.url ||
        (f["Image URL"] as string) ||
        (f["image_url"] as string) ||
        "";

      return {
        id: rec.id,
        name: (f["Name"] as string) || (f["Product Name"] as string) || "Untitled",
        category: (f["Category"] as string) || "",
        subCategory: (f["Sub Category"] as string) || "",
        vendor: (f["Vendor"] as string) || "",
        price: (f["MSRP"] as number) || (f["Price"] as number) || null,
        description: (f["Description"] as string) || "",
        finish: (f["Finishes*"] as string) || (f["Finish"] as string) || "",
        room: (f["Room(s)"] as string) || "",
        shoppedProject: (f["Shopped Project(s)"] as string) || "",
        imageUrl,
        link: (f["Link"] as string) || (f["URL"] as string) || "",
        raw: f,
      };
    });

    // Update cache
    cache = { data: materials, ts: Date.now() };

    return NextResponse.json({ materials, source: "airtable" });
  } catch (err) {
    console.error("Airtable fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch from Airtable", materials: [] }, { status: 500 });
  }
}
