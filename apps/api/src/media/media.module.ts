import { Schema as MongoSchema } from "mongoose";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Global,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Post,
  StreamableFile,
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
import { HydratedDocument, Model, Types } from "mongoose";
import { IsIn, IsMongoId, IsString, MaxLength } from "class-validator";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import {
  Order,
  OrderDocument,
  OrderSchema,
} from "../orders/schemas/order.schema";
import {
  Provider,
  ProviderDocument,
  ProviderSchema,
} from "../providers/schemas/provider.schema";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { OrderStatus, UserRole } from "../common/enums";

@Schema({ timestamps: true, collection: "proof_media" })
class ProofMedia {
  @Prop({ type: MongoSchema.Types.ObjectId, required: true, index: true })
  orderId!: Types.ObjectId;
  @Prop({ required: true }) ownerId!: string;
  @Prop({ required: true }) key!: string;
  @Prop({ required: true }) contentType!: string;
  @Prop({ required: true }) purpose!: string;
  @Prop({ required: true }) storage!: string;
}
class UploadProofDto {
  @IsMongoId() orderId!: string;
  @IsIn(["ready", "dropoff", "signature", "incident", "chat"]) purpose!: string;
  @IsIn([
    "image/jpeg",
    "image/png",
    "application/pdf",
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "video/mp4",
    "video/webm",
  ])
  contentType!: string;
  @IsString() @MaxLength(7_000_000) base64!: string;
}
@Injectable()
export class MediaService {
  private readonly s3: S3Client;
  constructor(
    private readonly config: ConfigService,
    @InjectModel(ProofMedia.name)
    private readonly media: Model<HydratedDocument<ProofMedia>>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    @InjectModel(Provider.name)
    private readonly providers: Model<ProviderDocument>,
  ) {
    this.s3 = new S3Client({
      region: config.get("S3_REGION") || "eu-central-1",
      endpoint: config.get("S3_ENDPOINT") || undefined,
      forcePathStyle: config.get("S3_FORCE_PATH_STYLE") === "true",
      credentials: config.get("S3_ACCESS_KEY_ID")
        ? {
            accessKeyId: config.get("S3_ACCESS_KEY_ID")!,
            secretAccessKey: config.get("S3_SECRET_ACCESS_KEY")!,
          }
        : undefined,
    });
  }
  private directory() {
    return (
      this.config.get<string>("MEDIA_LOCAL_DIR") ||
      join(process.cwd(), "uploads")
    );
  }
  private async authorize(userId: string, orderId: string, purpose: string) {
    const order = await this.orders.findById(orderId).exec();
    if (!order) throw new NotFoundException("Order not found.");
    const allowed =
      purpose === "chat"
        ? !!order.courierId &&
          [String(order.customerId), String(order.courierId)].includes(
            userId,
          ) &&
          [
            OrderStatus.ASSIGNED_TO_COURIER,
            OrderStatus.PICKED_UP,
            OrderStatus.ON_THE_WAY,
            OrderStatus.EXCEPTION_REPORTED,
            OrderStatus.ADMIN_REVIEW,
          ].includes(order.status)
        : purpose === "ready"
          ? !!(await this.providers.exists({ _id: order.providerId, userId }))
          : String(order.courierId) === userId;
    if (!allowed) throw new NotFoundException("Order not found.");
  }
  async upload(userId: string, dto: UploadProofDto) {
    await this.authorize(userId, dto.orderId, dto.purpose);
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(dto.base64))
      throw new BadRequestException("Invalid image.");
    const bytes = Buffer.from(dto.base64, "base64");
    const png = bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const signatures: Record<string, boolean> = {
      "image/png": png,
      "image/jpeg": jpeg,
      "application/pdf": bytes.subarray(0, 5).toString() === "%PDF-",
      "audio/webm": bytes
        .subarray(0, 4)
        .equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])),
      "video/webm": bytes
        .subarray(0, 4)
        .equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])),
      "audio/ogg": bytes.subarray(0, 4).toString() === "OggS",
      "audio/mp4": bytes.subarray(4, 8).toString() === "ftyp",
      "video/mp4": bytes.subarray(4, 8).toString() === "ftyp",
    };
    if (
      bytes.length > 5 * 1024 * 1024 ||
      bytes.length < 16 ||
      !signatures[dto.contentType] ||
      (dto.purpose !== "chat" &&
        !["image/png", "image/jpeg"].includes(dto.contentType))
    )
      throw new BadRequestException(
        "Choose a supported file up to 5 MB. Proof requires PNG or JPEG.",
      );
    const extension: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "application/pdf": "pdf",
      "audio/webm": "webm",
      "video/webm": "webm",
      "audio/ogg": "ogg",
      "audio/mp4": "m4a",
      "video/mp4": "mp4",
    };
    const key = `${randomUUID()}.${extension[dto.contentType]}`;
    const bucket = this.config.get<string>("S3_BUCKET");
    if (bucket) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: `proof/${key}`,
          Body: bytes,
          ContentType: dto.contentType,
          ContentDisposition:
            dto.contentType === "application/pdf" ? "attachment" : "inline",
        }),
      );
    } else {
      if (this.config.get("NODE_ENV") === "production")
        throw new BadRequestException("Proof storage is not configured.");
      await mkdir(this.directory(), { recursive: true });
      await writeFile(join(this.directory(), key), bytes, { flag: "wx" });
    }
    const record = await this.media.create({
      orderId: dto.orderId,
      ownerId: userId,
      key,
      purpose: dto.purpose,
      contentType: dto.contentType,
      storage: bucket ? "s3" : "local",
    });
    return { id: record.id, reference: `media:${record.id}` };
  }
  async assertReference(
    reference: string | undefined,
    orderId: string,
    purpose: string,
  ) {
    if (!reference) return;
    const id = /^media:([a-f0-9]{24})$/.exec(reference)?.[1];
    if (!id || !(await this.media.exists({ _id: id, orderId, purpose })))
      throw new BadRequestException(
        "Upload proof for this order before submitting.",
      );
  }
  async chatAttachment(userId: string, orderId: string, id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException("Invalid attachment.");
    const record = await this.media
      .findOne({ _id: id, orderId, ownerId: userId, purpose: "chat" })
      .exec();
    if (!record)
      throw new BadRequestException(
        "Upload an attachment for this order first.",
      );
    return { id: record.id, contentType: record.contentType };
  }
  async read(user: JwtPayloadUser, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException();
    const record = await this.media.findById(id).exec();
    if (!record) throw new NotFoundException();
    let allowed =
      user.roles.includes(UserRole.ADMIN) || record.ownerId === user.userId;
    if (!allowed && record.purpose === "chat") {
      const order = await this.orders.findById(record.orderId).exec();
      allowed =
        !!order &&
        [String(order.customerId), String(order.courierId)].includes(
          user.userId,
        );
    }
    if (!allowed) throw new NotFoundException();
    if (record.storage === "s3") {
      return {
        url: await getSignedUrl(
          this.s3,
          new GetObjectCommand({
            Bucket: this.config.get("S3_BUCKET"),
            Key: `proof/${record.key}`,
          }),
          { expiresIn: 60 },
        ),
      };
    }
    return new StreamableFile(
      await readFile(join(this.directory(), record.key)),
      {
        type: record.contentType,
        disposition:
          record.contentType === "application/pdf" ? "attachment" : "inline",
      },
    );
  }
}
@Controller("media")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.COURIER, UserRole.PROVIDER, UserRole.ADMIN, UserRole.CUSTOMER)
class MediaController {
  constructor(private readonly media: MediaService) {}
  @Post() upload(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: UploadProofDto,
  ) {
    return this.media.upload(user.userId, dto);
  }
  @Get(":id") read(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
  ) {
    return this.media.read(user, id);
  }
}
@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ProofMedia.name,
        schema: SchemaFactory.createForClass(ProofMedia),
      },
      { name: Order.name, schema: OrderSchema },
      { name: Provider.name, schema: ProviderSchema },
    ]),
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
