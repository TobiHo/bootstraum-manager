export function calculatePrice(
  tourType: string | undefined | null,
  participants: number,
  boatCapacity: number,
  durationHours: number
): number {
  if (!tourType) return 0;

  const tour = tourType.toLowerCase();

  switch (tour) {
    case "rundfahrt":
    case "sundowner":
      return participants * 11.5;

    case "punch_fahrt":
    case "punsch":
      return participants * 24;

    case "ranger":
      return 200;

    case "cliquentour":
      return participants >= 12 ? participants * 26 : 330;

    case "charter":
      const hourlyRate = boatCapacity > 14 ? 240 : 160;
      return hourlyRate * durationHours;

    default:
      return 0;
  }
}

export function getDurationHours(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  return Math.max(0, (end.getTime() - start.getTime()) / 3600000);
}

export const TOUR_TYPES = [
  { value: "rundfahrt", label: "Rundfahrt (öffentlich)", pricingHint: "€11,50/Person" },
  { value: "punsch", label: "Punsch-/Glühweinfahrt", pricingHint: "€24,00/Person" },
  { value: "sundowner", label: "Sundowner", pricingHint: "€11,50/Person" },
  { value: "ranger", label: "Vechte-Ranger", pricingHint: "€200 (Kinder)" },
  { value: "cliquentour", label: "Cliquentour", pricingHint: "€26/Person o. €330 Pauschal" },
  { value: "charter", label: "Exklusivcharter", pricingHint: "€160–€240/Std" },
];

export function formatPrice(price: number): string {
  return `€${price.toFixed(2).replace(".", ",")}`;
}
