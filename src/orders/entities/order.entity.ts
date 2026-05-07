import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { Payment } from '../../payments/entities/payment.entity';
import { User } from '../../users/entities/user.entity';
import { OrderDetail } from './order-detail.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn({ name: 'order_id' })
  order_id!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total_price?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  status?: string;

  @CreateDateColumn({ type: 'timestamp', nullable: true, name: 'created_at' })
  created_at?: Date;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.order)
  orderDetails!: OrderDetail[];

  @OneToMany(() => Payment, (payment) => payment.order)
  payments!: Payment[];
}
