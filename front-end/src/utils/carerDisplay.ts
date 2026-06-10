export const defaultCarerAvatar =
  'https://images.pexels.com/photos/15752232/pexels-photo-15752232.jpeg?auto=compress&cs=tinysrgb&w=800';

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
