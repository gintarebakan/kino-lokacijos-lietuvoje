//locations.ts - kokybės kontrolė, aprašo, kaip duomenys privalo atrodyti.

export interface LocationProperties {
  //aprašytos struktūros (apibrėžtų lokacijos savybių) padarymas viešu
  id: string; //privalomi laukai
  name: string;
  slug?: string;
  county?: string;
  location_type: string;
  image_url?: string; //neprivalomi laukai
}
