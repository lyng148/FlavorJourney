export class Category {
    id: number;
    name_japanese: string;
    name_vietnamese: string;
    slug: string;
}

export class Region {
    id: number;
    name_japanese: string;
    name_vietnamese: string;
    code: string;
}

export class Dish {
    id: number;
    name_japanese: string;
    name_vietnamese: string;
    name_romaji?: string;
    description_japanese?: string;
    description_vietnamese?: string;
    description_romaji?: string;
    image_url?: string;
    category?: Category;
    region?: Region;
    view_count?: number;
}

export class ViewHistoryItemDto {
    id: number;
    user_id: number;
    dish_id: number;
    viewed_at: Date;
    dish: Dish;
}

export class ViewHistoryResponseDto {
    id: number;
    user_id: number;
    dish_id: number;
    viewed_at: Date;
    dish: Dish;
}

export class RecentViewHistoryResponseDto {
    items: ViewHistoryItemDto[];
    totalCount: number;
}
