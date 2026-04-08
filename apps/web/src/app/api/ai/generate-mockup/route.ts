import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai/generate-mockup
 *
 * Accepts bathroom photos (as base64 data URLs) and selected product
 * thumbnails, then calls OpenAI's image generation API (gpt-image-1) to
 * produce a realistic mockup of the remodeled bathroom.
 *
 * Body: {
 *   bathroomPhotos: string[]   – base64 data URLs of the user's bathroom
 *   products: { title: string; thumbnail: string; price?: string; source?: string }[]
 * }
 *
 * Returns: { images: string[] }  – base64 data URLs of generated mockups
 */

interface ProductInput {
  title: string;
  thumbnail: string;
  price?: string;
  source?: string;
}

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
    // Build the product description list for the prompt
    const productDescriptions = products
      .map((p, i) => `${i + 1}. ${p.title}${p.price ? ` (${p.price})` : ""}`)
      .join("\n");

    // Build input images array: bathroom photos + product thumbnails
    // OpenAI gpt-image-1 supports multiple input images
    const inputImages: { type: "input_image"; input_image: { url: string } }[] = [];

    // Add bathroom photos (limit to 3 to stay within API limits)
    for (const photo of bathroomPhotos.slice(0, 3)) {
      inputImages.push({
        type: "input_image",
        input_image: { url: photo },
      });
    }

    // Add product thumbnails (limit to 4)
    for (const product of products.slice(0, 4)) {
      if (product.thumbnail) {
        inputImages.push({
          type: "input_image",
          input_image: { url: product.thumbnail },
        });
      }
    }

    const prompt = `You are an expert interior designer. I'm giving you photos of my current bathroom and images of specific products I've selected for my renovation.

Please generate a photorealistic mockup of the renovated bathroom that:
1. Keeps the same room layout, dimensions, angles, and window/door positions from my bathroom photos
2. Replaces the existing fixtures with the specific products shown in the reference images
3. Makes the new items look naturally placed with correct perspective, lighting, and shadows
4. Maintains photorealistic quality — this should look like a real photo, not a render

Products to incorporate:
${productDescriptions}

Generate ONE high-quality, photorealistic image of the remodeled bathroom.`;

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1536x1024",
        quality: "high",
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("OpenAI image generation error:", errData);
      return NextResponse.json(
        { error: "Failed to generate mockup. Please try again." },
        { status: 500 },
      );
    }

    const data = await response.json();

    // gpt-image-1 returns base64 data in data[].b64_json or URLs in data[].url
    const images: string[] = [];
    for (const item of data.data || []) {
      if (item.b64_json) {
        images.push(`data:image/png;base64,${item.b64_json}`);
      } else if (item.url) {
        images.push(item.url);
      }
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: "No mockup was generated. Please try again." },
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
