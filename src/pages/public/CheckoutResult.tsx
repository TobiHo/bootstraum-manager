import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

export function CheckoutSuccess() {
  return (
    <PublicLayout>
      <section className="max-w-2xl mx-auto px-4 py-20">
        <Card>
          <CardContent className="p-10 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
            <h1 className="text-3xl font-bold">Vielen Dank für Ihre Buchung!</h1>
            <p className="text-muted-foreground">
              Ihre Zahlung wurde erfolgreich verarbeitet. Eine Bestätigung haben wir Ihnen per E-Mail geschickt.
            </p>
            <Button asChild size="lg"><Link to="/touren">Weitere Touren entdecken</Link></Button>
          </CardContent>
        </Card>
      </section>
    </PublicLayout>
  );
}

export function CheckoutCancel() {
  return (
    <PublicLayout>
      <section className="max-w-2xl mx-auto px-4 py-20">
        <Card>
          <CardContent className="p-10 text-center space-y-4">
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-3xl font-bold">Bezahlung abgebrochen</h1>
            <p className="text-muted-foreground">
              Ihre Buchung wurde noch nicht bezahlt. Sie können den Bezahlvorgang jederzeit erneut starten.
            </p>
            <Button asChild variant="outline"><Link to="/touren">Zurück zu den Touren</Link></Button>
          </CardContent>
        </Card>
      </section>
    </PublicLayout>
  );
}
