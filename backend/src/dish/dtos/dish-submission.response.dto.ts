export class DishSubmissionResponseDto {
    id: number;
    name_japanese: string;
    name_vietnamese: string;
    name_romaji?: string;
    description_japanese?: string;
    description_vietnamese?: string;
    description_romaji?: string;
    image_url?: string;
    category_id?: number;
    region_id?: number;
    spiciness_level?: number;
    saltiness_level?: number;
    sweetness_level?: number;
    sourness_level?: number;
    ingredients?: string;
    how_to_eat?: string;
    status: string;
    submitted_by: number;
    reviewed_by?: number;
    submitted_at: Date;
    reviewed_at?: Date;
    rejection_reason?: string;
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
    submitter?: {
        id: number;
        username: string;
        email: string;
    };
}
