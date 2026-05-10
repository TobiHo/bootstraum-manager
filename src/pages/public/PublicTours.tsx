import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Clock, Users, Anchor } from "lucide-react";
import img1 from "@/assets/vvv/dsc00926.jpg";
import img2 from "@/assets/vvv/dsc06194.jpg";
import img3 from "@/assets/vvv/ganzer-tag.jpg";
import img4 from "@/assets/vvv/img1721.jpg";
import img5 from "@/assets/vvv/img8462.jpg";
import img6 from "@/assets/vvv/saettigung.jpg";
import img7 from "@/assets/vvv/vechtesonne.jpg";

const tourImages = [img1, img2, img3, img4, img5, img6, img7];

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
            {tourTypes.map((t, i) => (
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
