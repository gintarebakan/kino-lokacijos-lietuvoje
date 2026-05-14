//queryClient.ts kodas kuria podėlį/cache ir taisykles, kaip ilgai atsiminti atsakymus.

import { QueryClient } from "@tanstack/react-query";
//Iš TanStack Query bibliotekos pasiimame pagrindinį QueryClient įrankį.

export const createQueryClient = () =>
  //sukuriama createQueryClient funkcija
  new QueryClient({
    //kuri kiekvieną kartą ją iškvietus pagamins naują QueryClient
    defaultOptions: {
      //su mūsų nustatytomis numatytomus taisyklėmis
      queries: {
        staleTime: 60 * 1000, // 1 min, senėjimo laikas, duomenys laikomi atmintyje
        gcTime: 5 * 60 * 1000, // 5 min, kol laikomi naršyklės atmintyje, po to atlaisvinama RAM atmintis
        retry: 1, //bandymų skaičius
        refetchOnWindowFocus: false, //duomenys neperkraunami, kai grįžtama atgal į puslapį
      },
    },
  });
