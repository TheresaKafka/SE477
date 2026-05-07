import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Room } from '../../rooms/entities/room.entity';

@Entity('order_details')
export class OrderDetail {
  @PrimaryGeneratedColumn({ name: 'order_detail_id' })
  order_detail_id!: number;

  @Column({ type: 'int', nullable: true })
  quantity?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: number;

  @ManyToOne(() => Order, (order) => order.orderDetails)
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => Room, (room) => room.orderDetails)
  @JoinColumn({ name: 'room_id' })
  room!: Room;
}
