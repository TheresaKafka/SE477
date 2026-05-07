// 7. rooms.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    const { property_id, ...rest } = createRoomDto;
    const room = this.roomRepository.create(rest);

    if (property_id) {
      // Assign FK via relation object — TypeORM maps this to property_id column
      room.property = { property_id } as any;
    }

    return await this.roomRepository.save(room);
  }

  async findAll(): Promise<Room[]> {
    return await this.roomRepository.find({ relations: ['property'] });
  }

  async findOne(id: number): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { room_id: id },
      relations: ['property'],
    });
    if (!room) {
      throw new NotFoundException(`Room with id ${id} not found`);
    }
    return room;
  }

  async update(id: number, updateRoomDto: UpdateRoomDto): Promise<Room> {
    const room = await this.findOne(id);
    const { property_id, ...rest } = updateRoomDto as any;
    this.roomRepository.merge(room, rest);
    if (property_id) {
      room.property = { property_id } as any;
    }
    return await this.roomRepository.save(room);
  }

  async remove(id: number): Promise<void> {
    const room = await this.findOne(id);
    await this.roomRepository.remove(room);
  }
}
