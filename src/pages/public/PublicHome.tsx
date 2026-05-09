import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Clock, Users, Ticket, Anchor } from "lucide-react";
import heroImg from "@/assets/hero-boat-tour.jpg";
import captainImg from "@/assets/captain.jpg";
import fleetImg from "@/assets/fleet.jpg";
import publicTourImg from "@/assets/public-tour.jpg";
import charterImg from "@/assets/charter.jpg";

const tourImages = [publicTourImg, charterImg, fleetImg, heroImg, captainImg];

export default function PublicHome() {
  const { data: tourTypes = [] } = useQuery({
    queryKey: ["public-tour-types"],
    queryFn: () => api.listTourTypes(true),
  });

  return (
    <PublicLayout>
      {/* Hero */}
      <section
        className="relative text-primary-foreground overflow-hidden"
      >
        <img
          src={heroImg}
          alt="Bootstour auf der Vechte in Nordhorn"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-accent/70" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="relative max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Nordhorn vom Wasser entdecken
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8">
              Buchen Sie öffentliche Vechte-Rundfahrten oder ein ganzes Boot für Ihre Gruppe –
              schnell, einfach und sicher.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/touren">
                <Button size="lg" variant="secondary" className="gap-2">
                  <Ticket className="h-5 w-5" /> Tickets sichern
                </Button>
              </Link>
              <Link to="/charter">
                <Button size="lg" variant="outline" className="gap-2 bg-white/10 border-white/40 text-white hover:bg-white/20 hover:text-white">
                  <Anchor className="h-5 w-5" /> Privates Boot mieten
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tours */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Unsere Touren</h2>
            <p className="text-muted-foreground mt-1">Direkt online buchbar</p>
          </div>
          <Link to="/touren" className="text-primary font-medium hover:underline">
            Alle ansehen →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tourTypes.slice(0, 6).map((t, i) => (
            <Link key={t.id} to={`/touren/${t.slug}`}>
              <Card className="overflow-hidden hover:shadow-lg transition h-full">
                <img
                  src={tourImages[i % tourImages.length]}
                  alt={t.name}
                  loading="lazy"
                  width={1024}
                  height={768}
                  className="h-44 w-full object-cover"
                />
                <CardContent className="p-5">
                  <h3 className="font-semibold text-lg mb-2">{t.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{t.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" /> {t.durationMinutes} Min.
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" /> max. {t.maxParticipants}
                    </span>
                    <span className="font-bold text-primary">€ {t.pricePerTicket.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {tourTypes.length === 0 && (
            <p className="text-muted-foreground col-span-full">Noch keine Touren konfiguriert.</p>
          )}
        </div>
      </section>

      {/* USPs */}
      <section className="bg-secondary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-8">
          {[
            { title: "Erfahrene Bootsführer", text: "Unsere Schiffsführer kennen die Vechte wie ihre Westentasche.", img: captainImg },
            { title: "Sofort buchbar", text: "Reservieren Sie online in wenigen Minuten – auch kurzfristig.", img: publicTourImg },
            { title: "Für jede Gruppe", text: "Vom Familienausflug bis zum Firmenevent für 50 Personen.", img: charterImg },
          ].map((u) => (
            <Card key={u.title} className="overflow-hidden">
              <img src={u.img} alt={u.title} loading="lazy" width={1024} height={768} className="h-48 w-full object-cover" />
              <CardContent className="p-5 text-center">
                <h3 className="font-semibold text-lg mb-2">{u.title}</h3>
                <p className="text-muted-foreground">{u.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
