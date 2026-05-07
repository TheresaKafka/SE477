import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { Property } from '../../properties/entities/property.entity';
import { Order } from '../../orders/entities/order.entity';
import { Review } from '../../reviews/entities/review.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  user_id!: number;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
  })
  email!: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  password!: string;

  @CreateDateColumn({
    type: 'timestamp',
    nullable: true,
    name: 'created_at',
  })
  created_at?: Date;

  // FK role_id
  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  // A User (owner) can own many Properties (1 → N via ERD)
  @OneToMany(() => Property, (property) => property.owner)
  properties!: Property[];

  @OneToMany(() => Order, (order) => order.user)
  orders!: Order[];

  @OneToMany(() => Review, (review) => review.user)
  reviews!: Review[];
}
