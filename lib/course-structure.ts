export type TopicSeed = {
  slug: string;
  name: string;
  week: number | null;
  order: number;
  color: string;
  description: string;
  subtopics: string[];
};

export const TOPIC_STRUCTURE: TopicSeed[] = [
  {
    slug: "vektorrom-i",
    name: "Vektorrom I",
    week: 2,
    order: 1,
    color: "#7c63d6",
    description: "Reelle og komplekse vektorrom, spenn, underrom og lineær uavhengighet.",
    subtopics: ["Spenn", "Lineær uavhengighet", "Underrom", "Matriserom"]
  },
  {
    slug: "vektorrom-ii",
    name: "Vektorrom II",
    week: 3,
    order: 2,
    color: "#7c63d6",
    description: "Basis, dimensjon, koordinater og struktur i vektorrom.",
    subtopics: ["Basis", "Dimensjon", "Komplekse vektorrom", "Egenverdier og egenvektorer"]
  },
  {
    slug: "lineaertransformasjoner-i",
    name: "Lineærtransformasjoner I",
    week: 4,
    order: 3,
    color: "#4f6df0",
    description: "Lineære transformasjoner, kjerne, bilde, rekkevidde og rangteoremet.",
    subtopics: ["Kjerne", "Bilde / rekkevidde", "Rangteoremet", "Isomorfi"]
  },
  {
    slug: "lineaertransformasjoner-ii",
    name: "Lineærtransformasjoner II",
    week: 5,
    order: 4,
    color: "#4f6df0",
    description: "Matriserepresentasjoner, koordinatvektorer og basisbytte.",
    subtopics: ["Matriserepresentasjon", "Koordinatvektorer", "Basisbytte", "Overgangsmatriser"]
  },
  {
    slug: "indreproduktrom-i",
    name: "Indreproduktrom I",
    week: 6,
    order: 5,
    color: "#2aa897",
    description: "Indreprodukt, norm, ortogonalitet og ortogonale mengder.",
    subtopics: ["Indreprodukt", "Ortogonalitet", "Norm", "Ortonormale mengder"]
  },
  {
    slug: "indreproduktrom-ii",
    name: "Indreproduktrom II",
    week: 7,
    order: 6,
    color: "#2aa897",
    description: "Projeksjon, Gram-Schmidt, ortogonalt komplement og minste kvadraters metode.",
    subtopics: ["Projeksjon", "Gram-Schmidt", "Minste kvadraters metode", "Ortogonalt komplement"]
  },
  {
    slug: "differensialligninger-i",
    name: "Differensialligninger I",
    week: 8,
    order: 7,
    color: "#d68a26",
    description: "Lineære differensialligninger, egenbasis og andreordens ligninger.",
    subtopics: ["Differensialligninger", "Lineære differensialligninger", "Andre ordens differensialligninger", "Karakteristisk ligning"]
  },
  {
    slug: "differensialligninger-ii",
    name: "Differensialligninger II",
    week: 9,
    order: 8,
    color: "#d68a26",
    description: "Numeriske metoder for førsteordens differensialligninger og konvergens.",
    subtopics: ["Eulers metode", "Trapesmetoden", "Konvergens av numeriske metoder", "Feilanalyse"]
  },
  {
    slug: "differensialligninger-iii",
    name: "Differensialligninger III",
    week: 10,
    order: 9,
    color: "#d68a26",
    description: "Runge-Kutta, systemer av differensialligninger og høyere ordens ODE.",
    subtopics: ["Systemer av differensialligninger", "Runge-Kutta", "Butcher-tablå", "Numeriske metoder for ODE"]
  },
  {
    slug: "interpolasjonsmetoder",
    name: "Interpolasjonsmetoder",
    week: 11,
    order: 10,
    color: "#d76882",
    description: "Lagrangeinterpolasjon, Chebyshev-noder og stykkevis-polynomiale metoder.",
    subtopics: ["Interpolasjon", "Lagrangeinterpolasjon", "Chebyshev-noder", "Feilanalyse"]
  },
  {
    slug: "numerisk-integrasjon",
    name: "Numerisk integrasjon",
    week: 12,
    order: 11,
    color: "#d76882",
    description: "Midtpunkt-, trapes- og Simpsonsmetode, adaptiv kvadratur og feilkontroll.",
    subtopics: ["Numerisk integrasjon", "Trapesregelen", "Simpsons metode", "Adaptiv kvadratur"]
  },
  {
    slug: "rekker-i",
    name: "Rekker I",
    week: 13,
    order: 12,
    color: "#4aa365",
    description: "Følger, geometriske rekker, konvergens og konvergenstester.",
    subtopics: ["Rekker", "Geometriske rekker", "Konvergenstester", "Absolutt konvergens"]
  },
  {
    slug: "rekker-ii",
    name: "Rekker II",
    week: 15,
    order: 13,
    color: "#4aa365",
    description: "Potensrekker, konvergensradius og operasjoner på rekker.",
    subtopics: ["Potensrekker", "Konvergensradius", "Operasjoner på rekker", "Geometriske rekker"]
  },
  {
    slug: "taylorrekker-og-taylorpolynom",
    name: "Taylorrekker og Taylorpolynom",
    week: 16,
    order: 14,
    color: "#4aa365",
    description: "Taylorpolynom, Taylorrekker, restledd og anvendelser.",
    subtopics: ["Taylorrekker", "Taylorpolynom", "Restleddet", "Anvendelser"]
  },
  {
    slug: "repetisjon-hele-pensum",
    name: "Repetisjon / hele pensum",
    week: 17,
    order: 15,
    color: "#6b7280",
    description: "Blandede eksamensoppgaver og prøveeksamenssett fra hele pensum.",
    subtopics: ["Blandede oppgaver", "Eksamenssett", "Prøveeksamen", "Hele pensum"]
  }
];

export function slugifyNorwegian(value: string) {
  return value
    .toLowerCase()
    .replaceAll("æ", "ae")
    .replaceAll("ø", "o")
    .replaceAll("å", "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
