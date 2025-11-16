import { IsNotEmpty, IsNumber } from "class-validator";

export class SaveViewHistoryRequestDto {
    @IsNumber({}, { message: "料理IDは数字でなければなりません" })
    @IsNotEmpty({ message: "料理IDは必須項目です" })
    dish_id: number;
}
