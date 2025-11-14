import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class ProfileEditRequestDto {
    @IsNotEmpty({ message: 'IDは必須です。' }) // ID không được để trống
    @IsNumber({}, { message: 'IDは数値である必要があります。' }) // ID phải là một số
    id: number;

    @IsOptional()
    @IsString({ message: '場所は文字列である必要があります。' }) // Vị trí phải là một chuỗi
    location?: string;

    // birthday format: 'YYYY-MM-DD'
    @IsOptional()
    @IsString({ message: '誕生日は文字列である必要があります。' }) // Ngày sinh phải là một chuỗi
    birthday?: string;

    @IsOptional()
    @IsEmail({}, { message: 'メールアドレスの形式が正しくありません。' }) // Email không hợp lệ
    email?: string;
}
