import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { User } from '../users/entities/user.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

// Helper to strip sensitive user fields
function sanitizeOwner(owner: User | null | undefined) {
  if (!owner) return undefined;
  const { password: _pw, ...safe } = owner as any;
  return safe;
}

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createPropertyDto: CreatePropertyDto): Promise<Property> {
    const { name, address, city, status, owner_id } = createPropertyDto;

    const property = this.propertyRepository.create({ name, address, city, status });

    if (owner_id) {
      const owner = await this.userRepository.findOne({
        where: { user_id: owner_id },
      });
      if (owner) property.owner = owner;
    }

    const saved = await this.propertyRepository.save(property);
    return this.findOne(saved.property_id);
  }

  async findAll(): Promise<any[]> {
    const properties = await this.propertyRepository.find({
      relations: ['owner'],
    });
    return properties.map((p) => ({
      ...p,
      owner: sanitizeOwner(p.owner),
    }));
  }

  async findOne(id: number): Promise<any> {
    const property = await this.propertyRepository.findOne({
      where: { property_id: id },
      relations: ['owner', 'rooms'],
    });
    if (!property) {
      throw new NotFoundException(`Property with id ${id} not found`);
    }
    return {
      ...property,
      owner: sanitizeOwner(property.owner),
    };
  }

  async update(id: number, updatePropertyDto: UpdatePropertyDto): Promise<any> {
    const property = await this.propertyRepository.findOne({
      where: { property_id: id },
      relations: ['owner'],
    });
    if (!property) throw new NotFoundException(`Property with id ${id} not found`);

    if (updatePropertyDto.name !== undefined) property.name = updatePropertyDto.name;
    if (updatePropertyDto.address !== undefined) property.address = updatePropertyDto.address;
    if (updatePropertyDto.city !== undefined) property.city = updatePropertyDto.city;
    if (updatePropertyDto.status !== undefined) property.status = updatePropertyDto.status;

    if ((updatePropertyDto as any).owner_id) {
      const owner = await this.userRepository.findOne({
        where: { user_id: (updatePropertyDto as any).owner_id },
      });
      if (owner) property.owner = owner;
    }

    await this.propertyRepository.save(property);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const property = await this.propertyRepository.findOne({
      where: { property_id: id },
    });
    if (!property) throw new NotFoundException(`Property with id ${id} not found`);
    await this.propertyRepository.remove(property);
  }
}
