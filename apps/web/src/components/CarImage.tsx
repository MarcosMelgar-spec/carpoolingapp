import Image from "next/image";

// Mapeo de nombres comunes en Argentina → título del artículo de Wikipedia
const TITLE_OVERRIDES: Array<[string, string]> = [
  // Volkswagen
  ["vw gol", "Volkswagen Gol"],
  ["gol trend", "Volkswagen Gol"],
  ["vw polo", "Volkswagen Polo"],
  ["vw t-cross", "Volkswagen T-Cross"],
  ["t-cross", "Volkswagen T-Cross"],
  ["vw vento", "Volkswagen Vento"],
  ["vw amarok", "Volkswagen Amarok"],
  ["vw nivus", "Volkswagen Nivus"],
  ["nivus", "Volkswagen Nivus"],
  // Toyota
  ["sw4", "Toyota SW4"],
  // Ford
  ["ford ka", "Ford Ka"],
  // Peugeot — modelo sin marca
  ["208", "Peugeot 208"],
  ["2008", "Peugeot 2008"],
  ["3008", "Peugeot 3008"],
  ["408", "Peugeot 408"],
  ["308", "Peugeot 308"],
  // Citroën
  ["citroen", "Citroën"],
  // Nombres cortos sin marca
  ["gol", "Volkswagen Gol"],
  ["polo", "Volkswagen Polo"],
  ["vento", "Volkswagen Vento"],
  ["amarok", "Volkswagen Amarok"],
  ["hilux", "Toyota Hilux"],
  ["corolla", "Toyota Corolla"],
  ["corolla cross", "Toyota Corolla Cross"],
  ["yaris", "Toyota Yaris"],
  ["sw4", "Toyota SW4"],
  ["ranger", "Ford Ranger"],
  ["maverick", "Ford Maverick (2021)"],
  ["territory", "Ford Territory"],
  ["s10", "Chevrolet S10"],
  ["tracker", "Chevrolet Tracker"],
  ["onix", "Chevrolet Onix"],
  ["cruze", "Chevrolet Cruze"],
  ["spin", "Chevrolet Spin"],
  ["sandero", "Renault Sandero"],
  ["stepway", "Renault Sandero Stepway"],
  ["duster", "Renault Duster"],
  ["kwid", "Renault Kwid"],
  ["kangoo", "Renault Kangoo"],
  ["cronos", "Fiat Cronos"],
  ["palio", "Fiat Palio"],
  ["argo", "Fiat Argo"],
  ["strada", "Fiat Strada"],
  ["toro", "Fiat Toro"],
  ["frontier", "Nissan Frontier"],
  ["kicks", "Nissan Kicks"],
  ["versa", "Nissan Versa"],
  ["creta", "Hyundai Creta"],
  ["tucson", "Hyundai Tucson"],
  ["hr-v", "Honda HR-V"],
  ["hrv", "Honda HR-V"],
  ["civic", "Honda Civic"],
  ["renegade", "Jeep Renegade"],
  ["compass", "Jeep Compass"],
];

function toWikipediaTitle(model: string): string {
  const lower = model.toLowerCase().trim();
  // Busca el override más largo que coincida
  for (const [key, title] of TITLE_OVERRIDES.sort((a, b) => b[0].length - a[0].length)) {
    if (lower.includes(key)) return title;
  }
  return model.trim();
}

async function fetchWikipediaThumb(model: string): Promise<string | null> {
  const title = toWikipediaTitle(model);
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=600&origin=*`,
      { next: { revalidate: 60 * 60 * 24 * 7 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data?.query?.pages as Record<string, { thumbnail?: { source: string } }>;
    if (!pages) return null;
    const page = Object.values(pages)[0];
    return page?.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

export default async function CarImage({ model, color }: { model: string; color?: string | null }) {
  const src = await fetchWikipediaThumb(model);
  if (!src) return null;

  const alt = [color, model].filter(Boolean).join(" ");

  return (
    <div className="mt-3 rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
      <Image
        src={src}
        alt={alt}
        width={600}
        height={380}
        className="w-full h-36 object-cover object-center"
      />
    </div>
  );
}
