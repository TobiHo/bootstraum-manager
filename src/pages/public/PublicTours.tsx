import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Clock, Users, Anchor } from "lucide-react";

export default function PublicTours() {
  const { data: tourTypes = [], isLoading } = useQuery({
    queryKey: ["public-tour-types-all"],
    queryFn: () => api.listTourTypes(true),
  });

  return (
    <PublicLayout>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-2">Öffentliche Touren</h1>
        <p className="text-muted-foreground mb-8">Wählen Sie eine Tour und buchen Sie Ihre Tickets online.</p>

        {isLoading ? (
          <p>Lädt...</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tourTypes.map((t) => (
              <Link key={t.id} to={`/touren/${t.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition h-full">
                  <div className="h-44 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Anchor className="h-12 w-12 text-primary" />
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg mb-2">{t.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{t.description}</p>
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
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
