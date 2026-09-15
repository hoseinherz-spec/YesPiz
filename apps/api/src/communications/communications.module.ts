import { MediaService } from "../media/media.module";
import { Schema as MongoSchema } from "mongoose";
import {
  BadRequestException,
  ConflictException,
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  InjectModel,
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
} from "@nestjs/mongoose";
import { Throttle } from "@nestjs/throttler";
import {
  IsString,
  IsUUID,
  MaxLength,
  IsOptional,
  IsMongoId,
} from "class-validator";
import { HydratedDocument, Model, Types } from "mongoose";
import Twilio from "twilio";
import {
  Order,
  OrderDocument,
  OrderSchema,
} from "../orders/schemas/order.schema";
import { User, UserDocument, UserSchema } from "../account/schemas/user.schema";
import { OrderStatus } from "../common/enums";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { PushService } from "../push/push.service";

@Schema({ timestamps: true, collection: "order_messages" })
class OrderMessage {
  @Prop({ type: MongoSchema.Types.ObjectId, required: true, index: true })
  orderId!: Types.ObjectId;
  @Prop({ required: true }) senderId!: string;
  @Prop({ required: true }) senderRole!: string;
  @Prop({ required: true }) clientId!: string;
  @Prop({ default: "" }) text!: string;
  @Prop({ type: MongoSchema.Types.Mixed }) attachment?: {
    id: string;
    contentType: string;
  };
}
const MessageSchema = SchemaFactory.createForClass(OrderMessage);
MessageSchema.index({ orderId: 1, senderId: 1, clientId: 1 }, { unique: true });
class MessageDto {
  @IsString() @MaxLength(1000) text!: string;
  @IsOptional() @IsMongoId() mediaId?: string;
  @IsUUID() clientId!: string;
}
@Injectable()
class CommunicationsService {
  constructor(
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(OrderMessage.name)
    private readonly messages: Model<HydratedDocument<OrderMessage>>,
    private readonly config: ConfigService,
    private readonly push: PushService,
    private readonly media: MediaService,
  ) {}
  private async authorize(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException();
    const order = await this.orders.findById(id).exec();
    if (
      !order ||
      !order.courierId ||
      ![String(order.customerId), String(order.courierId)].includes(userId)
    )
      throw new NotFoundException();
    return order;
  }
  private active(order: OrderDocument) {
    if (
      ![
        OrderStatus.ASSIGNED_TO_COURIER,
        OrderStatus.PICKED_UP,
        OrderStatus.ON_THE_WAY,
        OrderStatus.EXCEPTION_REPORTED,
        OrderStatus.ADMIN_REVIEW,
      ].includes(order.status)
    )
      throw new BadRequestException(
        "Communication is available during an active delivery.",
      );
  }
  async list(userId: string, id: string) {
    await this.authorize(userId, id);
    const rows = await this.messages
      .find({ orderId: id })
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();
    return rows.reverse().map((row) => ({
      id: row.id,
      text: row.text,
      attachment: row.attachment,
      mine: row.senderId === userId,
      senderRole: row.senderRole,
    }));
  }
  async send(userId: string, id: string, dto: MessageDto) {
    const order = await this.authorize(userId, id);
    this.active(order);
    const text = dto.text.trim();
    if (!text && !dto.mediaId)
      throw new BadRequestException("Enter a message or attach a file.");
    const attachment = dto.mediaId
      ? await this.media.chatAttachment(userId, id, dto.mediaId)
      : undefined;
    const customer = String(order.customerId) === userId;
    const result = await this.messages
      .updateOne(
        { orderId: id, senderId: userId, clientId: dto.clientId },
        {
          $setOnInsert: {
            text,
            attachment,
            senderRole: customer ? "customer" : "courier",
          },
        },
        { upsert: true },
      )
      .exec();
    const stored = await this.messages.findOne({
      orderId: id,
      senderId: userId,
      clientId: dto.clientId,
    });
    if (stored?.text !== text || stored?.attachment?.id !== attachment?.id)
      throw new ConflictException(
        "This message reference was already used. Start a new message.",
      );
    if (result.upsertedCount)
      await this.push.notify({
        userId: String(customer ? order.courierId : order.customerId),
        title: "New delivery message",
        body: "Open your order to read the message.",
        data: { type: "order.message", orderId: id },
      });
    return { sent: true };
  }
  async call(userId: string, id: string) {
    const order = await this.authorize(userId, id);
    this.active(order);
    const sid = this.config.get<string>("TWILIO_ACCOUNT_SID");
    const token = this.config.get<string>("TWILIO_AUTH_TOKEN");
    const from = this.config.get<string>("TWILIO_VOICE_NUMBER");
    if (!sid || !token || !from)
      throw new ServiceUnavailableException(
        "Phone calls are unavailable. Please use order chat.",
      );
    const customer = await this.users.findById(order.customerId).exec();
    const courier = await this.users.findById(order.courierId).exec();
    if (
      ![customer, courier].every(
        (user) =>
          user?.phoneVerifiedAt && /^\+[1-9]\d{7,14}$/.test(user.phone ?? ""),
      )
    )
      throw new BadRequestException(
        "Both participants need a verified phone number. Please use chat.",
      );
    const self = String(order.customerId) === userId ? customer! : courier!;
    const other = self === customer ? courier! : customer!;
    const response = new Twilio.twiml.VoiceResponse();
    response.say("Connecting your Yespizz delivery call.");
    response
      .dial({
        callerId: from,
        timeout: 25,
        timeLimit: 600,
        answerOnBridge: true,
      })
      .number(other.phone!);
    await Twilio(sid, token).calls.create({
      to: self.phone!,
      from,
      twiml: response.toString(),
      timeout: 25,
    });
    return {
      status: "calling",
      message:
        "Answer your registered phone to connect. Your number is hidden from the other participant.",
    };
  }
}
@Controller("communications/orders/:id")
@UseGuards(JwtAuthGuard)
class CommunicationsController {
  constructor(private readonly service: CommunicationsService) {}
  @Get("messages") list(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
  ) {
    return this.service.list(user.userId, id);
  }
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post("messages")
  send(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
    @Body() dto: MessageDto,
  ) {
    return this.service.send(user.userId, id, dto);
  }
  @Throttle({ default: { limit: 1, ttl: 60_000 } })
  @Post("call")
  call(@CurrentUser() user: JwtPayloadUser, @Param("id") id: string) {
    return this.service.call(user.userId, id);
  }
}
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
      { name: OrderMessage.name, schema: MessageSchema },
    ]),
  ],
  providers: [CommunicationsService],
  controllers: [CommunicationsController],
})
export class CommunicationsModule {}
