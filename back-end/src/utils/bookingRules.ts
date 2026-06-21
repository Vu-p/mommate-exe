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

export const isWithinAvailability = (start: Date, end: Date, availability: any[], timezone: string = 'Asia/Ho_Chi_Minh') => {
  if (!availability || availability.length === 0) return true;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  
  const formatTime = (date: Date) => {
    const parts = formatter.formatToParts(date);
    const day = parts.find((p) => p.type === 'weekday')?.value || '';
    let hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    if (hour === 24) hour = 0;
    return { day, minutes: hour * 60 + minute };
  };

  const startInfo = formatTime(start);
  let endInfo = formatTime(end);
  
  if (endInfo.day !== startInfo.day && endInfo.minutes === 0) {
    endInfo.minutes = 24 * 60;
  }

  if (endInfo.day !== startInfo.day && endInfo.minutes !== 24 * 60) {
     return false; // Booking spans across multiple days which is not supported in simple slot check
  }

  const dayAvailability = availability.find((a: any) => String(a.day).toLowerCase() === startInfo.day.toLowerCase());
  if (!dayAvailability || !dayAvailability.slots || dayAvailability.slots.length === 0) return false;

  for (const slot of dayAvailability.slots) {
    const [slotStartStr, slotEndStr] = String(slot).split('-');
    if (!slotStartStr || !slotEndStr) continue;
    const [sH, sM] = slotStartStr.split(':').map(Number);
    const [eH, eM] = slotEndStr.split(':').map(Number);
    const slotStartMinutes = (sH || 0) * 60 + (sM || 0);
    const slotEndMinutes = (eH || 0) * 60 + (eM || 0);

    if (startInfo.minutes >= slotStartMinutes && endInfo.minutes <= slotEndMinutes) {
      return true;
    }
  }

  return false;
};

