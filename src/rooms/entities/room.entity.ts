import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Property } from '../../properties/entities/property.entity';
import { Review } from '../../reviews/entities/review.entity';
import { OrderDetail } from '../../orders/entities/order-detail.entity';
@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn({ name: 'room_id' })
  room_id!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: number;

  @Column({ type: 'int', nullable: true })
  quantity?: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  status?: string;

  // 🔗 Thuộc property nào (khóa ngoại property_id)
  @ManyToOne(() => Property, (property) => property.rooms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'property_id' })
  property!: Property;

  // 🔗 Quan hệ với Reviews (Một phòng có nhiều đánh giá)
  @OneToMany(() => Review, (review) => review.room)
  reviews!: Review[];

  // ✅ SỬA TẠI ĐÂY: Phải trỏ tới orderDetail.room
  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.room)
  orderDetails!: OrderDetail[];
}
