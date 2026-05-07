import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn({ name: 'payment_id' })
  payment_id!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'amount',
  })
  amount?: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'payment_method',
  })
  payment_method?: string; // Ví dụ: 'Cash', 'Credit Card', 'VNPAY'

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'status',
  })
  status?: string; // Ví dụ: 'Pending', 'Completed', 'Failed'

  @CreateDateColumn({
    type: 'timestamp',
    nullable: true,
    name: 'payment_date',
  })
  payment_date?: Date;

  // 🔗 Kết nối tới Order (Một đơn hàng có thể có một hoặc nhiều lần thanh toán)
  @ManyToOne(() => Order, (order) => order.payments)
  @JoinColumn({ name: 'order_id' })
  order!: Order;
}
