import {
  IsOptional,
  IsString,
  IsNumber,
  IsPositive,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRoomDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @IsOptional()
  @IsNumber()
  property_id?: number; // FK → properties.property_id (ERD enforced)
}
