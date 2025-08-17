import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument, PaymentStatus } from './payments.schema';
import { CartStatus } from '../carts/carts.schema';

// อิง order เพื่ออ่านยอด/อัปเดตสถานะ
import { Order, OrderDocument, OrderStatus } from 'src/orders/orders.schema';
import { CartsService } from 'src/carts/carts.service';
import { OrdersService } from 'src/orders/orders.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    private readonly ordersService: OrdersService,
    private readonly cartsService: CartsService,
  ) {}

  /** อัปเดตสถานะ payment; ถ้า SUCCEEDED → set paidAt และอัปเดต order เป็น PAID */
  async updateStatus(paymentId: string, status: PaymentStatus) {
    const _pid = new Types.ObjectId(paymentId);

    const payment = await this.paymentModel.findById(_pid).lean().exec();
    if (!payment) throw new NotFoundException('Payment not found');

    // หา order ที่เกี่ยวข้อง
    const order = await this.orderModel.findById(payment.orderId).lean().exec();
    if (!order) throw new NotFoundException('Order not found');

    // ถ้า order จ่ายไปแล้ว ไม่ให้เปลี่ยนเป็น SUCCEEDED ซ้ำ
    if (
      status === PaymentStatus.SUCCEEDED &&
      order.status === OrderStatus.PAID
    ) {
      throw new BadRequestException('Order already paid');
    }

    // อัปเดต payment
    const updated = await this.paymentModel
      .findOneAndUpdate(
        { _id: _pid },
        {
          $set: {
            status,
            paidAt: status === PaymentStatus.SUCCEEDED ? new Date() : null,
          },
        },
        { new: true },
      )
      .lean()
      .exec();

    // ถ้าจ่ายสำเร็จ → อัปเดต order เป็น PAID
    if (status === PaymentStatus.SUCCEEDED) {
      // await this.orderModel
      //   .updateOne(
      //     { _id: payment.orderId },
      //     { $set: { status: OrderStatus.PAID } },
      //   )
      //   .exec();
      await this.ordersService.updateStatus(
        payment.orderId.toString(),
        OrderStatus.PAID,
      );
    }

    await this.cartsService.setStatus(
      order.userId.toString(),
      CartStatus.ACTIVE,
    );

    return updated!;
  }

  async getById(paymentId: string) {
    const _pid = new Types.ObjectId(paymentId);
    const doc = await this.paymentModel.findById(_pid).lean().exec();
    if (!doc) throw new NotFoundException('Payment not found');
    return doc;
  }

  async listByOrder(orderId: string) {
    const _oid = new Types.ObjectId(orderId);
    return this.paymentModel
      .find({ orderId: _oid })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }
}
