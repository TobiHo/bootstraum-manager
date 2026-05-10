import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Clock, Users, Calendar as CalIcon, ChevronRight } from "lucide-react";
import rundfahrtImg from "@/assets/vvv/dsc00926.jpg";
import cliquenImg from "@/assets/vvv/dsc06194.jpg";
import charterImg from "@/assets/vvv/ganzer-tag.jpg";
import sundownerImg from "@/assets/vvv/img1721.jpg";
import rangerImg from "@/assets/vvv/img8462.jpg";
import punschImg from "@/assets/vvv/saettigung.jpg";

// Fallback-Daten, falls Backend (FastAPI) nicht erreichbar ist
const TOUR_ORDER = [
  { slug: "rundfahrt",   name: "Öffentliche Rundfahrten", image: rundfahrtImg, description: "Die klassische City-Rundfahrt auf der Vechte.",  price: 14.5, duration: 90,  capacity: 25 },
  { slug: "charter",     name: "Exklusivfahrten",         image: charterImg,   description: "Das ganze Boot exklusiv für Ihre Gruppe.",        price: 290,  duration: 120, capacity: 25 },
  { slug: "punsch",      name: "Punschfahrten",           image: punschImg,    description: "Heißer Punsch, warme Decken, Winterstimmung.",    price: 18.5, duration: 90,  capacity: 25 },
  { slug: "ranger",      name: "Vechte-Ranger",           image: rangerImg,    description: "Die Abenteuer-Tour für Kinder & Familien.",       price: 9.5,  duration: 60,  capacity: 25 },
  { slug: "sundowner",   name: "Sundowner",               image: sundownerImg, description: "Sonnenuntergang vom Wasser aus erleben.",         price: 22,   duration: 90,  capacity: 25 },
  { slug: "cliquentour", name: "Cliquentour",             image: cliquenImg,   description: "Feiern mit Freunden auf der Vechte.",             price: 26,   duration: 120, capacity: 25 },
];

export default function PublicTours() {
  const { data: tourTypes = [] } = useQuery({
    queryKey: ["public-tour-types-all"],
    queryFn: () => api.listTourTypes(true),
    retry: false,
  });

  const findTour = (slug: string) =>
    tourTypes.find(
      (t) =>
        t.slug === slug ||
        t.slug.startsWith(slug) ||
        t.name.toLowerCase().includes(slug.replace(/-/g, " "))
    );

  return (
    <PublicLayout>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-2">Öffentliche Touren</h1>
        <p className="text-muted-foreground mb-8">Wählen Sie eine Tour und buchen Sie Ihre Tickets online.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOUR_ORDER.map((entry) => {
            const t = findTour(entry.slug);
            const href = t ? `/touren/${t.slug}` : `/touren/${entry.slug}`;
            const duration = t?.durationMinutes ?? entry.duration;
            const capacity = t?.maxParticipants ?? entry.capacity;
            const price = t?.pricePerTicket ?? entry.price;
            const priceLabel = entry.slug === "charter" ? `ab € ${price.toFixed(2)}` : `€ ${price.toFixed(2)}`;
            const priceSuffix = entry.slug === "charter" ? "pro Boot" : "pro Person";
            return (
              <Link key={entry.slug} to={href} className="group">
                <Card className="overflow-hidden hover:shadow-lg transition h-full flex flex-col border-t-4 border-t-primary/0 hover:border-t-primary">
                  <div className="relative">
                    <img
                      src={entry.image}
                      alt={entry.name}
                      loading="lazy"
                      width={1024}
                      height={640}
                      className="h-48 w-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded">
                      Direkt buchen
                    </div>
                  </div>
                  <CardContent className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition">{entry.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {t?.description || entry.description}
                    </p>
                    <div className="mt-auto flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {duration} Min.</span>
                        <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {capacity}</span>
                      </div>
                      <div className="text-right leading-tight">
                        <div className="font-bold text-primary">{priceLabel}</div>
                        <div className="text-[11px] text-muted-foreground">{priceSuffix}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-primary font-semibold text-sm">
                      <CalIcon className="h-4 w-4" /> Termine im Kalender ansehen
                      <ChevronRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </PublicLayout>
  );
}
