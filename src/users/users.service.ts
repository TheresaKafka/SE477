import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, role_id } = createUserDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      role: { role_id } as Role,
    });
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find({ relations: ['role'] });
    // Strip password from response
    return users.map((u) => {
      const { password: _pw, ...safe } = u as any;
      return safe as User;
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { user_id: id },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    const { password: _pw, ...safe } = user as any;
    return safe as User;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { user_id: id },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    if (updateUserDto.email) user.email = updateUserDto.email;

    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    if (updateUserDto.role_id) {
      user.role = { role_id: updateUserDto.role_id } as Role;
    }

    await this.userRepository.save(user);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { user_id: id },
    });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    await this.userRepository.remove(user);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });
  }
}
