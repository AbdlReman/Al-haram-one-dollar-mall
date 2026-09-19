export interface IReview {
  _id: string;
  productId: string;
  authorName: string;
  rating: number;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export const REVIEW_ACCESS_STORAGE_KEY = "pumashoes_review_edit_tokens";
