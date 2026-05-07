import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';
import { User } from '../../users/entities/user.entity';

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn({ name: 'property_id' })
  property_id!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'pending',
    nullable: true,
  })
  status?: string;

  // 🔗 Owner (Kết nối tới bảng users qua owner_id)
  @ManyToOne(() => User, (user) => user.properties)
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  // 🔗 Một Property có nhiều Rooms (cascade delete)
  @OneToMany(() => Room, (room) => room.property, { cascade: true })
  rooms!: Room[];
}
