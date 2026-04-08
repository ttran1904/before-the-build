/**
 * Static Home Depot bathroom design collections.
 * Images sourced from Home Depot's lifestyle image CDN.
 * Pre-loaded so SerpAPI is NOT called until a user clicks into a collection.
 */

export interface HDCollection {
  id: string;
  name: string;
  styles: string[];
  image: string;          // hero / thumbnail from HD CDN
  description: string;
  /** Home Depot collection page URL */
  hdUrl: string;
  /** Search query for SerpAPI home_depot engine when fetching products */
  serpQuery: string;
}

export const HOME_DEPOT_COLLECTIONS: HDCollection[] = [
  {
    id: "41012",
    name: "Retro Color Pop Bathroom",
    styles: ["Vintage"],
    image: "https://images.homedepot-static.com/lifestyleimages/640x426/446162d6-a33d-45b2-8946-dfa6a609cbfc3.jpeg",
    description: "Bold greens, gold fixtures, and retro charm packed with personality.",
    hdUrl: "https://www.homedepot.com/collection/Bathroom/Retro-Color-Pop-Bathroom/id-41012",
    serpQuery: "retro color pop bathroom vanity green gold faucet",
  },
  {
    id: "41010",
    name: "Casual Bungalow Bathroom",
    styles: ["Cottage"],
    image: "https://images.thdstatic.com/lifestyleimages/1024x682/4add2d7e-ebac-4e6e-af14-7b074edbc2bb2.jpeg",
    description: "Relaxed cottage charm with natural wood, light tile, and airy finishes.",
    hdUrl: "https://www.homedepot.com/collection/Bathroom/Casual-Bungalow-Bathroom/id-41010",
    serpQuery: "casual bungalow bathroom cottage vanity wood light tile",
  },
  {
    id: "41008",
    name: "Soft Modern Bathroom",
    styles: ["Modern"],
    image: "https://images.homedepot-static.com/lifestyleimages/640x426/17a8f63e-6c62-4183-99a7-97e306189a801.jpeg",
    description: "Clean lines softened with warm neutrals and organic textures.",
    hdUrl: "https://www.homedepot.com/collection/Bathroom/Soft-Modern-Bathroom/id-41008",
    serpQuery: "soft modern bathroom warm neutral clean vanity faucet",
  },
  {
    id: "41006",
    name: "Heirloom Revival Bathroom",
    styles: ["Classic"],
    image: "https://images.thdstatic.com/lifestyleimages/1024x682/6f8a9f4a-fb41-4190-92c7-9859689a49180.jpeg",
    description: "Timeless elegance with rich woods, detailed hardware, and a freestanding tub.",
    hdUrl: "https://www.homedepot.com/collection/Bathroom/Heirloom-Revival-Bathroom/id-41006",
    serpQuery: "heirloom revival bathroom classic vanity rich wood freestanding tub",
  },
  {
    id: "40810",
    name: "Vintage Deluxe Bathroom",
    styles: ["Vintage"],
    image: "https://images.thdstatic.com/lifestyleimages/1024x682/41bedc7b-c28e-4419-81e6-c0213470ffb310.jpeg",
    description: "Ornate tilework and vintage fixtures bring old-world European charm.",
    hdUrl: "https://www.homedepot.com/collection/Bathroom/Vintage-Deluxe-Bathroom/id-40810",
    serpQuery: "vintage deluxe bathroom ornate tile vanity clawfoot brass",
  },
  {
    id: "40918",
    name: "Modern Embrace Bathroom",
    styles: ["Modern"],
    image: "https://images.thdstatic.com/lifestyleimages/1024x682/195eae4c-41ce-48ab-8335-c488bd8b48752.jpeg",
    description: "Warm wood vanity paired with matte black fixtures for a modern statement.",
    hdUrl: "https://www.homedepot.com/collection/Bathroom/Modern-Embrace-Bathroom/id-40918",
    serpQuery: "modern embrace bathroom wood vanity matte black faucet",
  },
  {
    id: "40812",
    name: "Cozy Cottage Bathroom",
    styles: ["Cottage", "Farmhouse"],
    image: "https://images.homedepot-static.com/lifestyleimages/640x426/e95965de-9e57-4502-aade-23b1396bc1981.jpeg",
    description: "Warm woven textures, wainscoting, and soft linens create a welcoming retreat.",
    hdUrl: "https://www.homedepot.com/collection/Bathroom/Cozy-Cottage-Bathroom/id-40812",
    serpQuery: "cozy cottage bathroom wainscoting vanity warm wood farmhouse",
  },
  {
    id: "40916",
    name: "Classic Elegance Bathroom",
    styles: ["Classic"],
    image: "https://images.homedepot-static.com/lifestyleimages/640x426/ce26f576-15c9-4134-bc8d-bfd2509fe6340.jpeg",
    description: "Polished nickel, marble counters, and shaker-style cabinetry.",
    hdUrl: "https://www.homedepot.com/collection/Bathroom/Classic-Elegance-Bathroom/id-40916",
    serpQuery: "classic elegance bathroom polished nickel marble shaker vanity",
  },
  {
    id: "40788",
    name: "Moonlight",
    styles: ["Art Deco", "Glam"],
    image: "https://images.thdstatic.com/lifestyleimages/1024x682/03d7c908-dbff-4865-9d2d-198e89968cf00.jpeg",
    description: "Art deco glamour with bold shapes, gilded accents, and dramatic lighting.",
    hdUrl: "https://www.homedepot.com/collection/Bathroom/Moonlight/id-40788",
    serpQuery: "moonlight art deco bathroom glamour vanity gold lighting",
  },
  {
    id: "40784",
    name: "Teal Appeal",
    styles: ["Classic", "Glam"],
    image: "https://images.thdstatic.com/lifestyleimages/1024x682/07d459b9-92e3-4ed5-8962-fb686717041336.jpeg",
    description: "Rich teal cabinetry with classic brass hardware and elegant tilework.",
    hdUrl: "https://www.homedepot.com/collection/Bathroom/Teal-Appeal/id-40784",
    serpQuery: "teal appeal bathroom teal vanity brass hardware classic tile",
  },
  {
    id: "40786",
    name: "Silver Linings",
    styles: ["Glam", "Modern"],
    image: "https://images.homedepot-static.com/lifestyleimages/640x426/71d56cb0-720c-4c0f-ab70-c88310a7fad125.jpeg",
    description: "Sleek silver fixtures, white marble, and modern glamour.",
    hdUrl: "https://www.homedepot.com/collection/Bathroom/Silver-Linings/id-40786",
    serpQuery: "silver linings bathroom modern glam chrome white marble vanity",
  },
  {
    id: "40782",
    name: "Supernova",
    styles: ["Art Deco", "Glam"],
    image: "https://images.homedepot-static.com/lifestyleimages/640x426/3e6ecc14-86ec-4ed3-a630-c10216decf5319.jpeg",
    description: "Opulent gold, ornate wallpaper, and statement fixtures that dazzle.",
    hdUrl: "https://www.homedepot.com/collection/Bathroom/Supernova/id-40782",
    serpQuery: "supernova bathroom gold ornate glam art deco vanity faucet",
  },
  {
    id: "40778",
    name: "Dreamscape",
    styles: ["Modern", "Glam"],
    image: "https://images.thdstatic.com/lifestyleimages/1024x682/b3c414af-4a89-4ba9-9ba9-3e91a8b697d40.jpeg",
    description: "Dreamy neutrals, statement mirrors, and luxe marble surfaces.",
    hdUrl: "https://www.homedepot.com/collection/Bathroom/Dreamscape/id-40778",
    serpQuery: "dreamscape bathroom modern neutral marble statement mirror vanity",
  },
  {
    id: "40766",
    name: "Stratosphere",
    styles: ["Modern"],
    image: "https://images.homedepot-static.com/lifestyleimages/640x426/31676973-067a-4c6f-aeaf-872a64e4fc2a3.jpeg",
    description: "Bold navy and sleek chrome in a high-contrast modern design.",
    hdUrl: "https://www.homedepot.com/collection/Bathroom/Stratosphere/id-40766",
    serpQuery: "stratosphere bathroom modern navy chrome bold contrast vanity",
  },
  {
    id: "40758",
    name: "Chateau",
    styles: ["Classic", "Traditional"],
    image: "https://images.homedepot-static.com/lifestyleimages/640x426/ce26f576-15c9-4134-bc8d-bfd2509fe6340.jpeg",
    description: "French-inspired elegance with carved details and crystal accents.",
    hdUrl: "https://www.homedepot.com/collection/Bathroom/Chateau/id-40758",
    serpQuery: "chateau bathroom french classic traditional vanity crystal elegant",
  },
  {
    id: "40600",
    name: "Casual Haven",
    styles: ["Cottage", "Modern"],
    image: "https://images.homedepot-static.com/lifestyleimages/640x426/49786aaf-6724-40b0-a7ad-0061327d46353.jpeg",
    description: "Effortlessly relaxed with clean lines and natural materials.",
    hdUrl: "https://www.homedepot.com/collection/bathroom/casual_haven/id-40600",
    serpQuery: "casual haven bathroom relaxed natural wood modern clean",
  },
  {
    id: "40770",
    name: "Kaleidoscope",
    styles: ["Bohemian", "Eclectic"],
    image: "https://images.homedepot-static.com/lifestyleimages/640x426/398bfd08-136a-42cb-bf97-2761904821e15.jpeg",
    description: "Colorful patterned tile, eclectic fixtures, and bohemian energy.",
    hdUrl: "https://www.homedepot.com/collection/Bathroom/Kaleidoscope/id-40770",
    serpQuery: "kaleidoscope bathroom bohemian colorful pattern tile eclectic vanity",
  },
  {
    id: "40712",
    name: "Northwoods",
    styles: ["Rustic", "Farmhouse"],
    image: "https://images.homedepot-static.com/lifestyleimages/640x426/460e60d8-c986-42db-aea8-5673241b9faf0.jpeg",
    description: "Rustic barnwood, stone accents, and cabin-inspired warmth.",
    hdUrl: "https://www.homedepot.com/collection/Bathroom/Northwoods/id-40712",
    serpQuery: "northwoods bathroom rustic barnwood stone cabin farmhouse vanity",
  },
  {
    id: "37609",
    name: "Muted Modern Bathroom",
    styles: ["Modern", "Minimalist"],
    image: "https://images.homedepot-static.com/lifestyleimages/640x426/b708674c-cec5-4c5a-98d6-099a5f0ff81223.jpeg",
    description: "Understated elegance with muted tones and minimalist design.",
    hdUrl: "https://www.homedepot.com/collection/bathroom/muted_modern_bathroom/id-37609",
    serpQuery: "muted modern bathroom minimalist neutral vanity clean faucet",
  },
  {
    id: "38014",
    name: "Minimalist Farmhouse Bathroom",
    styles: ["Farmhouse", "Minimalist"],
    image: "https://images.homedepot-static.com/lifestyleimages/640x426/a98e9d19-8d37-4308-be55-e34c67391133.jpeg",
    description: "Shiplap walls, open shelving, and pared-back farmhouse charm.",
    hdUrl: "https://www.homedepot.com/collection/bathroom/minimalist_farmhouse_bathroom/id-38014",
    serpQuery: "minimalist farmhouse bathroom shiplap open shelving vanity simple",
  },
];
