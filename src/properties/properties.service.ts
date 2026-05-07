import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { User } from '../users/entities/user.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ✅ Validates all ERD fields: name, address, city, status + owner_id FK
  async create(createPropertyDto: CreatePropertyDto): Promise<Property> {
    const { name, address, city, status, owner_id } = createPropertyDto;

    const property = this.propertyRepository.create({
      name,
      address,
      city,
      status,
    });

    // Link owner (FK: owner_id → users.user_id)
    if (owner_id) {
      const owner = await this.userRepository.findOne({
        where: { user_id: owner_id },
      });
      if (owner) property.owner = owner;
    }

    return await this.propertyRepository.save(property);
  }

  // ✅ Returns all fields including room count
  async findAll(): Promise<Property[]> {
    return await this.propertyRepository.find({
      relations: ['rooms', 'owner'],
    });
  }

  async findOne(id: number): Promise<Property> {
    const property = await this.propertyRepository.findOne({
      where: { property_id: id },
      relations: ['rooms', 'owner'],
    });
    if (!property) {
      throw new NotFoundException(`Property with id ${id} not found`);
    }
    return property;
  }

  async update(
    id: number,
    updatePropertyDto: UpdatePropertyDto,
  ): Promise<Property> {
    const property = await this.findOne(id);
    Object.assign(property, updatePropertyDto);
    return await this.propertyRepository.save(property);
  }

  // ✅ Cascade: removes all child rooms when property is deleted
  async remove(id: number): Promise<void> {
    const property = await this.findOne(id);
    await this.propertyRepository.remove(property);
  }
}
