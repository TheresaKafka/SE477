import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';
import { User } from '../../users/entities/user.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn({ name: 'review_id' })
  review_id!: number;

  @Column({ type: 'int', nullable: true })
  rating?: number; // 1-5, thêm ? và nullable: true

  @Column({ type: 'varchar', length: 1000, nullable: true })
  comment?: string; // Khớp nvarchar(1000) và cho phép null

  // 🔗 user review
  @ManyToOne(() => User, (user) => user.reviews) // Nên thêm quan hệ ngược
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // 🔗 room được review
  @ManyToOne(() => Room, (room) => room.reviews) // Nên thêm quan hệ ngược
  @JoinColumn({ name: 'room_id' })
  room!: Room;
}
