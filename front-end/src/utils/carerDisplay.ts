export const defaultCarerAvatar =
  'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"%3E%3Crect width="320" height="320" fill="%23e7f2e8"/%3E%3Ccircle cx="160" cy="120" r="54" fill="%237bae7f"/%3E%3Cpath d="M65 286c12-66 49-99 95-99s83 33 95 99" fill="%237bae7f"/%3E%3C/svg%3E';

export const getCarerFullName = (carer: any) => {
  const firstName = carer?.user?.firstName || carer?.name?.split(' ')[0] || 'Chuyên gia';
  const lastName = carer?.user?.lastName || carer?.name?.split(' ').slice(1).join(' ') || '';

  return `${firstName} ${lastName}`.trim();
};

export const getCarerAvatar = (carer: any) =>
  carer?.user?.avatar || carer?.avatar || carer?.img || defaultCarerAvatar;

export const getReviewCount = (carer: any, actualReviews?: unknown[]) => {
  if (Array.isArray(actualReviews)) {
    return actualReviews.length;
  }

  return Number(carer?.reviewCount ?? carer?.numReviews ?? 0);
};

export const hasReviews = (carer: any, actualReviews?: unknown[]) => getReviewCount(carer, actualReviews) > 0;

export const getDisplayRating = (carer: any, actualReviews?: unknown[]) => {
  if (!hasReviews(carer, actualReviews)) {
    return null;
  }

  const rating = Number(carer?.rating || 0);
  return rating > 0 ? rating.toFixed(1) : null;
};

export const formatReviewLabel = (carer: any, actualReviews?: unknown[]) => {
  const count = getReviewCount(carer, actualReviews);
  return count > 0 ? `${count} bình luận` : 'Chưa có đánh giá';
};

export const formatLocation = (location?: string) => location || 'Chưa cập nhật';

export const formatAge = (age?: number) => (typeof age === 'number' && age > 0 ? `${age} tuổi` : 'Chưa cập nhật');

export const formatExperience = (experienceYears?: number) =>
  typeof experienceYears === 'number' && experienceYears > 0
    ? `${experienceYears} năm kinh nghiệm`
    : 'Chưa cập nhật';

export const formatExperienceShort = (experienceYears?: number) =>
  typeof experienceYears === 'number' && experienceYears > 0 ? `${experienceYears} năm` : 'Chưa cập nhật';

export const formatHourlyRate = (hourlyRate?: number | string) => {
  if (typeof hourlyRate === 'number' && hourlyRate > 0) {
    return `${hourlyRate.toLocaleString('vi-VN')} VNĐ/giờ`;
  }

  if (typeof hourlyRate === 'string' && hourlyRate.trim()) {
    return hourlyRate;
  }

  return 'Chưa cập nhật';
};
