import { IsOptional, IsString, IsNumber, MaxLength } from 'class-validator';

export class CreatePropertyDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @IsOptional()
  @IsNumber()
  owner_id?: number; // Set from JWT token by controller, not user input
}
