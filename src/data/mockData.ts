import { Boat, Captain, BookingData } from "@/types/booking";

export const mockBoats: Boat[] = [
  {
    id: "1",
    name: "MS Nordhorn",
    capacity: 50,
    type: "Ausflugsschiff",
    description: "Großes Ausflugsschiff für Gruppenfahrten",
    available: true
  },
  {
    id: "2", 
    name: "Wassertaxi",
    capacity: 12,
    type: "Wassertaxi",
    description: "Kleines wendiges Boot für private Touren",
    available: true
  },
  {
    id: "3",
    name: "Kanalboot Clara",
    capacity: 25,
    type: "Kanalboot",
    description: "Traditionelles Kanalboot mit überdachtem Bereich",
    available: true
  },
  {
    id: "4",
    name: "Sportboot Ems",
    capacity: 8,
    type: "Sportboot", 
    description: "Schnelles Boot für Sportgruppen",
    available: false
  }
];

export const mockCaptains: Captain[] = [
  {
    id: "1",
    name: "Klaus Müller",
    email: "k.mueller@bootstour.de",
    phone: "+49 5921 123456",
    certifications: ["Sportbootführerschein See", "Funkzeugnis"],
    availableBoats: ["1", "2", "3"]
  },
  {
    id: "2",
    name: "Andrea Schmidt",
    email: "a.schmidt@bootstour.de", 
    phone: "+49 5921 234567",
    certifications: ["Sportbootführerschein Binnen", "Erste Hilfe"],
    availableBoats: ["2", "3", "4"]
  },
  {
    id: "3",
    name: "Thomas Weber",
    email: "t.weber@bootstour.de",
    phone: "+49 5921 345678", 
    certifications: ["Kapitänspatent", "Funkzeugnis", "Erste Hilfe"],
    availableBoats: ["1", "2", "3", "4"]
  }
];

export const mockBookings: BookingData[] = [
  {
    id: "1",
    startDate: new Date(2024, 7, 15, 10, 0),
    endDate: new Date(2024, 7, 15, 14, 0),
    customer: {
      name: "Firma Nordhorn GmbH",
      email: "info@nordhorn-gmbh.de",
      phone: "+49 5921 987654"
    },
    participants: 35,
    boatId: "1",
    captainId: "3",
    catering: true,
    notes: "Firmenausflug mit Mittagessen",
    status: "confirmed",
    createdAt: new Date(2024, 7, 1)
  },
  {
    id: "2", 
    startDate: new Date(2024, 7, 16, 9, 0),
    endDate: new Date(2024, 7, 16, 11, 0),
    customer: {
      name: "Familie Janssen",
      email: "janssen@email.de",
      phone: "+49 5921 456789"
    },
    participants: 8,
    boatId: "2",
    captainId: "1",
    catering: false,
    notes: "Familienausflug zum Geburtstag",
    status: "confirmed",
    createdAt: new Date(2024, 7, 5)
  }
];