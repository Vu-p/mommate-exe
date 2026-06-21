export const PUBLISHED_REVIEW_MATCH = { moderationStatus: 'published' } as const;

export const calculatePublishedReviewStats = (
  reviews: { score: number; moderationStatus: string }[],
) => {
  const published = reviews.filter((review) => review.moderationStatus === 'published');
  if (!published.length) return { rating: null, reviewCount: 0 };
  const average = published.reduce((sum, review) => sum + review.score, 0) / published.length;
  return { rating: Math.round(average * 10) / 10, reviewCount: published.length };
};
