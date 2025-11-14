export class ProfileResponseDto {
    id: number;
    email: string;
    username: string;
    birthday?: Date;
    location?: string;
    registration_date?: Date;
    consecutive_login_days?: number;
    favoritedDishes?: {
        dishes: Dish[];
        numberOfDishes: number;
    };
}

export class Dish {
    id: number;
    name_japanese: string;
    name_vietnamese: string;
    name_romaji?: string
    description_japanese?: string;
    description_vietnamese?: string;
    description_romaji?: string
    image_url?: string;
    category?: Category;
    region?: Region;
}

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
