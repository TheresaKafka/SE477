import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn({ name: 'role_id' })
  role_id!: number;

  @Column({
    type: 'varchar',
    length: 20, // Khớp với nvarchar(20) trong hình
    unique: true,
    name: 'role_name',
  })
  role_name!: string;

  @OneToMany(() => User, (user) => user.role)
  users!: User[];
}
