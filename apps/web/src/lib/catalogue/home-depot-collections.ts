/**
 * Static Home Depot bathroom design collections.
 * Pre-loaded so SerpAPI is NOT called until a user clicks into a collection.
 */

export interface HDCollection {
  id: string;
  name: string;
  style: string;
  image: string;          // hero / thumbnail
  description: string;
  /** Search query sent to SerpAPI when the user opens this collection */
  serpQuery: string;
}

export const HOME_DEPOT_COLLECTIONS: HDCollection[] = [
  {
    id: "hd-retro-color-pop",
    name: "Retro Color Pop Bathroom",
    style: "Vintage",
    image: "https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=600&q=80",
    description: "Bold colors meet retro fixtures for a bathroom full of personality.",
    serpQuery: "retro colorful bathroom fixtures vintage bold",
  },
  {
    id: "hd-casual-bungalow",
    name: "Casual Bungalow Bathroom",
    style: "Cottage",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80",
    description: "Relaxed cottage charm with natural wood tones and light finishes.",
    serpQuery: "cottage bungalow bathroom vanity natural wood",
  },
  {
    id: "hd-soft-modern",
    name: "Soft Modern Bathroom",
    style: "Modern",
    image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80",
    description: "Clean lines softened with warm neutrals and organic textures.",
    serpQuery: "modern bathroom soft neutral warm fixtures",
  },
  {
    id: "hd-heirloom-revival",
    name: "Heirloom Revival Bathroom",
    style: "Classic",
    image: "https://images.unsplash.com/photo-1586798271654-0471bb1b0517?w=600&q=80",
    description: "Timeless elegance with marble, brass, and classic pedestal sinks.",
    serpQuery: "classic heirloom bathroom marble brass traditional",
  },
  {
    id: "hd-vintage-deluxe",
    name: "Vintage Deluxe Bathroom",
    style: "Vintage",
    image: "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=600&q=80",
    description: "Ornate tilework and vintage fixtures bring old-world charm.",
    serpQuery: "vintage deluxe bathroom clawfoot tub ornate tile",
  },
  {
    id: "hd-modern-embrace",
    name: "Modern Embrace Bathroom",
    style: "Modern",
    image: "https://images.unsplash.com/photo-1600488999585-e4364713b90a?w=600&q=80",
    description: "Matte black fixtures and large-format tile for a sleek statement.",
    serpQuery: "modern matte black bathroom fixtures large tile",
  },
  {
    id: "hd-cozy-cottage",
    name: "Cozy Cottage Bathroom",
    style: "Cottage",
    image: "https://images.unsplash.com/photo-1584622781867-1c5d8e2bca0d?w=600&q=80",
    description: "Warm woods, wainscoting, and soft linens create a welcoming retreat.",
    serpQuery: "cozy cottage bathroom wainscoting warm wood",
  },
  {
    id: "hd-classic-elegance",
    name: "Classic Elegance Bathroom",
    style: "Classic",
    image: "https://images.unsplash.com/photo-1603825491066-983ec2e8ecca?w=600&q=80",
    description: "Polished nickel, marble counters, and traditional cabinetry.",
    serpQuery: "classic elegant bathroom polished nickel marble vanity",
  },
  {
    id: "hd-urban-zen",
    name: "Urban Zen Bathroom",
    style: "Modern",
    image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600&q=80",
    description: "Minimalist calm with floating vanities and natural stone.",
    serpQuery: "zen modern bathroom floating vanity natural stone",
  },
  {
    id: "hd-rustic-haven",
    name: "Rustic Haven Bathroom",
    style: "Rustic",
    image: "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=600&q=80",
    description: "Raw textures, exposed wood, and earth-toned palettes.",
    serpQuery: "rustic bathroom reclaimed wood earth tone fixtures",
  },
  {
    id: "hd-coastal-breeze",
    name: "Coastal Breeze Bathroom",
    style: "Coastal",
    image: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=600&q=80",
    description: "Ocean-inspired blues, white shiplap, and breezy finishes.",
    serpQuery: "coastal bathroom blue white shiplap nautical",
  },
  {
    id: "hd-sleek-contemporary",
    name: "Sleek Contemporary Bathroom",
    style: "Modern",
    image: "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=600&q=80",
    description: "Ultra-modern with frameless glass, LED mirrors, and smart toilets.",
    serpQuery: "contemporary bathroom frameless glass LED mirror smart toilet",
  },
  {
    id: "hd-warm-industrial",
    name: "Warm Industrial Bathroom",
    style: "Industrial",
    image: "https://images.unsplash.com/photo-1560185008-a33f5c7b1844?w=600&q=80",
    description: "Concrete, exposed pipe, and warm Edison lighting.",
    serpQuery: "industrial bathroom concrete pipe edison lighting fixtures",
  },
  {
    id: "hd-bohemian-retreat",
    name: "Bohemian Retreat Bathroom",
    style: "Bohemian",
    image: "https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?w=600&q=80",
    description: "Eclectic patterns, lush greenery, and layered textiles.",
    serpQuery: "bohemian bathroom eclectic pattern plants textile",
  },
  {
    id: "hd-minimalist-spa",
    name: "Minimalist Spa Bathroom",
    style: "Minimalist",
    image: "https://images.unsplash.com/photo-1600566752229-250ed79470f8?w=600&q=80",
    description: "Pared-back luxury with rain showers and freestanding soaking tubs.",
    serpQuery: "minimalist spa bathroom rain shower freestanding tub",
  },
  {
    id: "hd-transitional-comfort",
    name: "Transitional Comfort Bathroom",
    style: "Transitional",
    image: "https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?w=600&q=80",
    description: "The perfect blend of traditional warmth and modern simplicity.",
    serpQuery: "transitional bathroom blend modern traditional comfort",
  },
  {
    id: "hd-mid-century",
    name: "Mid-Century Modern Bathroom",
    style: "Mid-Century",
    image: "https://images.unsplash.com/photo-1560185127-bdf0eab46dde?w=600&q=80",
    description: "Retro-inspired shapes, walnut wood, and geometric tile.",
    serpQuery: "mid century modern bathroom walnut geometric tile",
  },
  {
    id: "hd-mediterranean-oasis",
    name: "Mediterranean Oasis Bathroom",
    style: "Mediterranean",
    image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80&fit=crop&crop=bottom",
    description: "Terracotta, arched mirrors, and hand-painted tile.",
    serpQuery: "mediterranean bathroom terracotta arch mirror painted tile",
  },
  {
    id: "hd-scandinavian-clean",
    name: "Scandinavian Clean Bathroom",
    style: "Scandinavian",
    image: "https://images.unsplash.com/photo-1560185008-a33f5c7b1844?w=600&q=80",
    description: "Light wood, white walls, and thoughtful Scandinavian design.",
    serpQuery: "scandinavian bathroom light wood white minimal clean",
  },
  {
    id: "hd-art-deco-glamour",
    name: "Art Deco Glamour Bathroom",
    style: "Art Deco",
    image: "https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?w=600&q=80",
    description: "Gold accents, geometric patterns, and luxurious marble.",
    serpQuery: "art deco bathroom gold geometric marble glamour",
  },
];
