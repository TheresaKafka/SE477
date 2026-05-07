import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { Room } from '../rooms/entities/room.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderDetail)
    private readonly orderDetailRepository: Repository<OrderDetail>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: number): Promise<Order> {
    let totalPrice = 0;
    const orderDetails: OrderDetail[] = [];

    // Check availability and calculate price
    for (const item of createOrderDto.items) {
      const room = await this.roomRepository.findOne({
        where: { room_id: item.room_id },
      });
      if (!room) {
        throw new NotFoundException(`Room with ID ${item.room_id} not found`);
      }

      const qty = item.quantity || 1;

      // Ensure room is available (e.g. quantity >= qty and status is not rented)
      if (
        room.quantity !== undefined &&
        room.quantity !== null &&
        room.quantity < qty
      ) {
        throw new BadRequestException(
          `Room ${room.name || room.room_id} does not have enough availability`,
        );
      }

      if (room.status === 'rented' || room.status === 'unavailable') {
        throw new BadRequestException(
          `Room ${room.name || room.room_id} is currently unavailable`,
        );
      }

      const price = room.price || 0;
      totalPrice += price * qty;

      const detail = this.orderDetailRepository.create({
        room: { room_id: room.room_id } as Room,
        quantity: qty,
        price: price,
      });
      orderDetails.push(detail);

      // Optionally update room quantity/status if immediate deduction is required
      // If we do this, we need to save the room later.
    }

    // Create order
    const order = this.orderRepository.create({
      user: { user_id: userId } as any,
      total_price: totalPrice,
      status: 'pending', // Trạng thái: pending / confirmed / cancelled
    });

    const savedOrder = await this.orderRepository.save(order);

    // Save order details
    for (const detail of orderDetails) {
      detail.order = savedOrder;
      await this.orderDetailRepository.save(detail);
    }

    return this.findOne(savedOrder.order_id);
  }

  async findAll(): Promise<Order[]> {
    return await this.orderRepository.find({
      relations: ['user', 'orderDetails', 'orderDetails.room'],
      order: { order_id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { order_id: id },
      relations: ['user', 'orderDetails', 'orderDetails.room'],
    });
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return order;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    if (updateOrderDto.status) {
      order.status = updateOrderDto.status;
    }
    return await this.orderRepository.save(order);
  }

  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
  }
}
