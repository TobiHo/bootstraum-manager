import { AppLayout } from "@/components/layout/AppLayout";
import { BookingCalendar } from "@/components/calendar/BookingCalendar";

const Index = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <BookingCalendar />
      </div>
    </AppLayout>
  );
};

export default Index;
