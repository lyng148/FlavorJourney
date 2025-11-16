export class DishResponseDto {
  id: number;

  name_japanese: string;
  name_vietnamese: string;
  name_romaji?: string;

  description_japanese?: string;
  description_vietnamese?: string;
  description_romaji?: string;

  submitted_id: {
    username: string;
  };

  image_url?: string;

  category?: {
    id: number;
    name_japanese: string;
    name_vietnamese: string;
  };

  region?: {
    id: number;
    name_japanese: string;
    name_vietnamese: string;
  };

  spiciness_level?: number;
  saltiness_level?: number;
  sweetness_level?: number;
  sourness_level?: number;

  ingredients: string;
  how_to_eat: string;

  view_count?: number;

  submitted_at?: Date;
  reviewed_at?: Date;
}

export interface PaginatedDishesResponse {
  data: DishResponseDto[]; // danh sách dishes
  page: number; // trang hiện tại
  limit: number; // số item/trang
  total: number; // tổng số bản ghi
  totalPages: number; // tổng số trang
}
