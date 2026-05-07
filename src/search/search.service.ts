import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../rooms/entities/room.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async search(query: {
    location?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
    limit?: string;
    sort?: string;
  }) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '12', 10)));
    const skip = (page - 1) * limit;

    const qb = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.property', 'property');

    // ── Location filter (search in city, address, property name, room name)
    if (query.location && query.location.trim()) {
      qb.andWhere(
        `(
          property.city    LIKE :loc OR
          property.address LIKE :loc OR
          property.name    LIKE :loc OR
          room.name        LIKE :loc
        )`,
        { loc: `%${query.location.trim()}%` },
      );
    }

    // ── Price filters
    if (query.minPrice && !isNaN(parseFloat(query.minPrice))) {
      qb.andWhere('room.price >= :minPrice', {
        minPrice: parseFloat(query.minPrice),
      });
    }
    if (query.maxPrice && !isNaN(parseFloat(query.maxPrice))) {
      qb.andWhere('room.price <= :maxPrice', {
        maxPrice: parseFloat(query.maxPrice),
      });
    }

    // ── Sorting
    switch (query.sort) {
      case 'price_asc':
        qb.orderBy('room.price', 'ASC');
        break;
      case 'price_desc':
        qb.orderBy('room.price', 'DESC');
        break;
      default:
        qb.orderBy('room.room_id', 'DESC');
        break; // newest first
    }

    const total = await qb.getCount();
    const data = await qb.skip(skip).take(limit).getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
