import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai/generate-mockup
 *
 * Accepts bathroom photos (as base64 data URLs) and selected product
 * thumbnails, then calls OpenAI's Image Edit API (gpt-image-1) with
 * image[] array syntax to produce a realistic mockup per bathroom angle.
 *
 * Body: {
 *   bathroomPhotos: string[]   – base64 data URLs of the user's bathroom
 *   products: { title: string; thumbnail: string; price?: string; source?: string }[]
 * }
 *
 * Returns: { images: string[] }  – base64 data URLs of generated mockups (one per angle)
 */

interface ProductInput {
  title: string;
  thumbnail: string;
  price?: string;
  source?: string;
}

/* ── helpers ── */

/** Convert a base64 data-URL to a Blob. */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/png";
  const bytes = Buffer.from(base64, "base64");
  return new Blob([bytes], { type: mime });
}

/** Fetch an external image URL and return it as a base64 data-URL. */
async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  if (url.startsWith("data:")) return url;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

/* ── route handler ── */

export async function POST(req: NextRequest) {
  const { bathroomPhotos, products } = (await req.json()) as {
    bathroomPhotos: string[];
    products: ProductInput[];
  };

  if (!bathroomPhotos || bathroomPhotos.length === 0) {
    return NextResponse.json(
      { error: "Please upload at least one bathroom photo." },
      { status: 400 },
    );
  }

  if (!products || products.length === 0) {
    return NextResponse.json(
      { error: "Please select at least one product item." },
      { status: 400 },
    );
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured." },
      { status: 500 },
    );
  }

  try {
    // Pre-fetch product thumbnails as data URLs
    const productDataUrls: string[] = [];
    for (const p of products.slice(0, 4)) {
      if (p.thumbnail) {
        const dataUrl = await fetchImageAsDataUrl(p.thumbnail);
        if (dataUrl) productDataUrls.push(dataUrl);
      }
    }

    const productDescriptions = products
      .map((p, i) => `${i + 1}. ${p.title}${p.price ? ` (${p.price})` : ""}`)
      .join("\n");

    // Generate one mockup per bathroom angle (limit 3 angles)
    const limitedPhotos = bathroomPhotos.slice(0, 3);
    const totalAngles = limitedPhotos.length;
    let firstError: string | null = null;

    const generateForAngle = async (photo: string, angleIdx: number): Promise<string | null> => {
      const prompt = `You are an expert interior designer. I'm providing images:
- The FIRST image is a photo of my current bathroom (Angle ${angleIdx + 1} of ${totalAngles})
- The REMAINING ${productDataUrls.length} images are specific products I've selected for my renovation

Please generate a photorealistic mockup of this bathroom angle after renovation:
1. Keep the EXACT same room layout, dimensions, camera angle, and window/door positions from the bathroom photo
2. Replace existing fixtures with the specific products shown in the product reference images
3. Only include products that would naturally be visible from this particular camera angle
4. Make all items look naturally placed with correct perspective, lighting, and shadows
5. Maintain photorealistic quality — this should look like a real photo, not a render

Products to incorporate (where visible from this angle):
${productDescriptions}

Generate ONE high-quality, photorealistic image of this remodeled bathroom angle.`;

      // Build multipart form data: bathroom photo + product thumbnails
      const formData = new FormData();
      formData.append("model", "gpt-image-1");
      formData.append("prompt", prompt);
      formData.append("n", "1");
      formData.append("size", "1536x1024");
      formData.append("quality", "high");

      // First image: the bathroom photo for this angle
      const bathroomBlob = dataUrlToBlob(photo);
      formData.append("image[]", bathroomBlob, `bathroom_angle_${angleIdx}.png`);

      // Remaining images: product thumbnails
      for (let i = 0; i < productDataUrls.length; i++) {
        const blob = dataUrlToBlob(productDataUrls[i]);
        formData.append("image[]", blob, `product_${i}.png`);
      }

      const response = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const msg = errData?.error?.message || "Unknown error";
        console.error(`OpenAI mockup error (angle ${angleIdx + 1}):`, msg);
        if (!firstError) firstError = msg;
        return null;
      }

      const data = await response.json();

      for (const item of data.data || []) {
        if (item.b64_json) {
          return `data:image/png;base64,${item.b64_json}`;
        } else if (item.url) {
          return item.url;
        }
      }
      return null;
    };

    // Run all angles in parallel for speed
    const results = await Promise.allSettled(
      limitedPhotos.map((photo, i) => generateForAngle(photo, i)),
    );

    const images: string[] = [];
    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        images.push(result.value);
      }
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: firstError || "No mockups were generated. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ images });
  } catch (err) {
    console.error("Mockup generation error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
