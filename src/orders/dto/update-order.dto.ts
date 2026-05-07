import { IsString, IsIn, IsOptional } from 'class-validator';

export class UpdateOrderDto {
  @IsString()
  @IsIn(['pending', 'confirmed', 'cancelled'])
  @IsOptional()
  status?: string;
}
