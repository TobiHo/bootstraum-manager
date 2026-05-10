import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Clock, Users, Ticket, Anchor, Calendar as CalIcon, ChevronRight } from "lucide-react";
import heroImg from "@/assets/vvv/vechtesonne.jpg";
import sundownerImg from "@/assets/vvv/img1721.jpg";
import charterImg from "@/assets/vvv/ganzer-tag.jpg";
import punschImg from "@/assets/vvv/saettigung.jpg";
import rundfahrtImg from "@/assets/vvv/dsc00926.jpg";
import cliquenImg from "@/assets/vvv/dsc06194.jpg";
import rangerImg from "@/assets/vvv/img8462.jpg";

// Feste Reihenfolge & Bilder für die 6 Kern-Angebote
const TOUR_ORDER: { slug: string; name: string; image: string; tagline: string }[] = [
  { slug: "rundfahrt",   name: "Öffentliche Rundfahrten", image: rundfahrtImg, tagline: "Die klassische City-Rundfahrt auf der Vechte." },
  { slug: "charter",     name: "Exklusivfahrten",         image: charterImg,   tagline: "Das ganze Boot exklusiv für Ihre Gruppe." },
  { slug: "punsch",      name: "Punschfahrten",           image: punschImg,    tagline: "Heißer Punsch, warme Decken, Winterstimmung." },
  { slug: "ranger",      name: "Vechte-Ranger",           image: rangerImg,    tagline: "Die Abenteuer-Tour für Kinder & Familien." },
  { slug: "sundowner",   name: "Sundowner",               image: sundownerImg, tagline: "Sonnenuntergang vom Wasser aus erleben." },
  { slug: "cliquentour", name: "Cliquentour",             image: cliquenImg,   tagline: "Feiern mit Freunden auf der Vechte." },
];

export default function PublicHome() {
  const { data: tourTypes = [] } = useQuery({
    queryKey: ["public-tour-types"],
    queryFn: () => api.listTourTypes(true),
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
      {/* Hero – wie auf vvv-nordhorn.de/bootsfahrten */}
      <section className="relative">
        <img
          src={heroImg}
          alt="Bootstour auf der Vechte in Nordhorn"
          width={1920}
          height={900}
          className="h-[420px] md:h-[520px] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-foreground/30 to-transparent" />
        <div className="absolute inset-0">
          <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg leading-none">
              Bootsrundfahrten
            </h1>
            <p className="text-2xl md:text-3xl text-white/95 mt-2 italic font-light">
              auf der Vechte
            </p>
          </div>
        </div>
      </section>

      {/* Intro-Text */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6 text-center">
        <p className="text-foreground/90 leading-relaxed">
          Jedes Jahr eröffnet der VVV-Stadt- und Citymarketing Nordhorn e.V. im Frühjahr seine
          Bootssaison mit den beliebten Fahrgastschiffen <em>Vechtestromer</em>,{" "}
          <em>Vechtesonne</em>, <em>Vechteschute</em> und <em>Vechteprahm</em>. Wählen Sie unten
          Ihre Tour und buchen Sie direkt online über unseren Kalender.
        </p>
      </section>

      {/* Unsere Touren – alle 6 auf einmal sichtbar, direkt buchbar */}
      <section id="touren" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">Unsere Touren</h2>
          <div className="mx-auto mt-3 h-1 w-16 bg-primary rounded-full" />
          <p className="text-muted-foreground mt-3">
            Alle Angebote im Überblick – direkt online buchbar
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOUR_ORDER.map((entry) => {
            const t = findTour(entry.slug);
            const href = t ? `/touren/${t.slug}` : `/touren`;
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
                    <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition">
                      {entry.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {t?.description || entry.tagline}
                    </p>
                    <div className="mt-auto flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        {t && (
                          <>
                            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {t.durationMinutes} Min.</span>
                            <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {t.maxParticipants}</span>
                          </>
                        )}
                      </div>
                      {t ? (
                        <span className="font-bold text-primary">€ {t.pricePerTicket.toFixed(2)}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">auf Anfrage</span>
                      )}
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

        <div className="flex flex-wrap justify-center gap-3 mt-10">
          <Link to="/touren">
            <Button size="lg" className="gap-2">
              <Ticket className="h-5 w-5" /> Alle Tickets &amp; Termine
            </Button>
          </Link>
          <Link to="/charter">
            <Button size="lg" variant="outline" className="gap-2">
              <Anchor className="h-5 w-5" /> Privates Boot mieten
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
