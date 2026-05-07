import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Email không tồn tại');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Sai mật khẩu');
    }

    const payload = {
      sub: user.user_id,
      email: user.email,
      role: user.role?.role_name || '',
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role?.role_name || '',
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<any> {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp');
    }

    const existingUser = await this.usersService.findOneByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new BadRequestException('Email đã tồn tại');
    }

    let userRole;
    try {
      userRole = await this.rolesService.findOne(registerDto.role_id);
    } catch (e) {
      throw new BadRequestException('Role không tồn tại');
    }

    // Lọc bỏ confirmPassword và property trước khi lưu User
    const { confirmPassword, property, ...createUserPayload } = registerDto;
    const newUser = await this.usersService.create(createUserPayload);

    const payload = {
      sub: newUser.user_id,
      email: newUser.email,
      role: userRole.role_name,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: newUser.user_id,
        email: newUser.email,
        role: userRole.role_name,
      },
    };
  }
}
