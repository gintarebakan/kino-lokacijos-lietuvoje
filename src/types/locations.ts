// src/types/locations.ts

export interface LocationProperties {
  id: string;
  name: string;
  slug?: string;
  county?: string;
  location_type: string;
  image_url?: string;
}