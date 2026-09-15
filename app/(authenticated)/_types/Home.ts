export type HomeCategory = {
  description: string | null;
  id: string;
  name: string;
};

export type FeaturedProduct = {
  currency: string | null;
  description: string | null;
  id: string;
  imageUrl: string | null;
  model: string | null;
  name: string;
  price: number | null;
};

export type FeaturedProducts = {
  hasPartialFailure: boolean;
  items: FeaturedProduct[];
};

export type HomeSection<T> =
  | { data: T; status: "success" }
  | { status: "error" };
