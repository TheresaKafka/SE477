import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { Room } from './entities/room.entity';
import { Property } from '../properties/entities/property.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Property])],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [TypeOrmModule, RoomsService],
})
export class RoomsModule {}
