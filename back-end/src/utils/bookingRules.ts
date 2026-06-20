export const calculateBookingPrice = ({
  unitPrice,
  hours,
  sessions,
  platformFeePercent,
}: {
  unitPrice: number;
  hours: number;
  sessions: number;
  platformFeePercent: number;
}) => {
  const safeHours = Math.max(1, hours);
  const safeSessions = Math.max(1, sessions);
  const totalPrice = Math.round(unitPrice * safeHours * safeSessions);
  const platformFeeAmount = Math.round(totalPrice * platformFeePercent / 100);
  return { totalPrice, platformFeeAmount, carerPayoutAmount: totalPrice - platformFeeAmount };
};

export const overlaps = (firstStart: Date, firstEnd: Date, secondStart: Date, secondEnd: Date) =>
  firstStart < secondEnd && firstEnd > secondStart;

export const isOutsideFreeCancellationWindow = (scheduledAt: Date, now = new Date()) =>
  scheduledAt.getTime() - now.getTime() >= 24 * 60 * 60_000;

export const isWithinCheckInWindow = (scheduledAt: Date, now = new Date()) =>
  now.getTime() >= scheduledAt.getTime() - 15 * 60_000
  && now.getTime() <= scheduledAt.getTime() + 30 * 60_000;

export const distanceMeters = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
  const toRad = (value: number) => value * Math.PI / 180;
  const earth = 6_371_000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};
