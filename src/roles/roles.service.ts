import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    try {
      const role = this.roleRepo.create(createRoleDto);
      return await this.roleRepo.save(role);
    } catch (error: any) {
      // Handle MSSQL unique constraint violation (Error codes 2627, 2601)
      if (error.number === 2627 || error.number === 2601) {
        throw new ConflictException(
          `Role with name '${createRoleDto.role_name}' already exists.`,
        );
      }
      throw error;
    }
  }

  async findAll(): Promise<Role[]> {
    return await this.roleRepo.find();
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { role_id: id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found.`);
    }

    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    this.roleRepo.merge(role, updateRoleDto);

    try {
      return await this.roleRepo.save(role);
    } catch (error: any) {
      if (error.number === 2627 || error.number === 2601) {
        throw new ConflictException(
          `Role with name '${updateRoleDto.role_name}' already exists.`,
        );
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);
    await this.roleRepo.remove(role);
  }
}
