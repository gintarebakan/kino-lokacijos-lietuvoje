//utils.ts - daizaino tvarkymas

import { clsx, type ClassValue } from "clsx"; //clsx ignoruoja tuščias vietas ir suklijuoja tekstus
import { twMerge } from "tailwind-merge"; //Tailwind CSS taisyklės, pvz konflikto atveju laimi parašytas vėliau, kitas ištrinamas

export function cn(...inputs: ClassValue[]) {
  //sukuriama vieša funkcija pavadinimu cn. dizaino klases sudeda į masyvą
  //class value - css validūs klasių pavadinimai (tekstai, objektai, masyvai)
  return twMerge(clsx(inputs)); //clsx(inputs) paima visą tavo netvarkingą krepšelį (kuriame galbūt yra null, undefined, false reikšmių nuo visokių if sąlygų) ir suklijuoja jas į vieną švarią teksto eilutę
} //Švari eilutė atiduodama twMerge(...), kas peržiūri eilutę, randa besidubliuojančias ar konfliktuojančias Tailwind klases (pvz., text-sm ir text-lg), palieka tik teisingą variantą ir atiduoda galutinį rezultatą
