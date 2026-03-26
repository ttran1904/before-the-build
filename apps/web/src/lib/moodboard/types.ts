export interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Product {
  title: string;
  price: string;
  source: string;
  url: string;
  thumbnail: string;
}

export interface PointedItem {
  id: string;
  cropBox: CropBox;
  label: string;
  loading: boolean;
  products: Product[];
  selectedProductIdx: number | null;
}

export interface IdentificationResult {
  label: string;
  searchTerms: string;
}

export interface IdentifyAndSearchResult {
  label: string;
  products: Product[];
}
