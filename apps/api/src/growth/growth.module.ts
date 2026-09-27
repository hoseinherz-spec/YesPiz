import {
  Coupon,
  CouponSchema,
  CreateCouponDto,
  CouponStatusDto,
  couponDiscount,
} from "./coupon";
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  InjectModel,
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
} from "@nestjs/mongoose";
import {
  IsDateString,
  IsIn,
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { HydratedDocument, Model } from "mongoose";
import { User, UserDocument, UserSchema } from "../account/schemas/user.schema";
import {
  Product,
  ProductDocument,
  ProductSchema,
  ProductRevision,
  ProductRevisionDocument,
  ProductRevisionSchema,
} from "../catalog/products/product.schema";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { OrderStatus, UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import {
  Order,
  OrderDocument,
  OrderSchema,
} from "../orders/schemas/order.schema";
@Schema({ timestamps: true, collection: "growth_campaigns" })
export class GrowthCampaign {
  @Prop({ required: true, unique: true }) code!: string;
  @Prop({ required: true }) name!: string;
  @Prop({ required: true }) channel!: string;
  @Prop({ required: true }) audience!: string;
  @Prop({ required: true }) startAt!: Date;
  @Prop({ required: true }) endAt!: Date;
  @Prop({ required: true }) budgetCents!: number;
  @Prop({ default: 0 }) spendCents!: number;
  @Prop({ default: "planned" }) status!: "planned" | "active" | "completed";
  @Prop({ required: true }) createdBy!: string;
  @Prop({
    type: [
      {
        _id: false,
        at: Date,
        actor: String,
        status: String,
        spendCents: Number,
      },
    ],
    default: [],
  })
  history!: { at: Date; actor: string; status: string; spendCents: number }[];
}
const GrowthCampaignSchema = SchemaFactory.createForClass(GrowthCampaign);
@Schema({ timestamps: true, collection: "operations_tasks" })
export class OperationsTask {
  @Prop({ required: true }) title!: string;
  @Prop({ required: true }) area!: string;
  @Prop({ required: true }) dueAt!: Date;
  @Prop({ default: "todo" }) status!: "todo" | "doing" | "done";
  @Prop({ required: true }) createdBy!: string;
  @Prop() ownerId?: string;
  @Prop({ default: 0 }) revision!: number;
  @Prop({
    type: [{ _id: false, at: Date, actor: String, status: String }],
    default: [],
  })
  history!: { at: Date; actor: string; status: string }[];
}
const OperationsTaskSchema = SchemaFactory.createForClass(OperationsTask);
class CreateCampaignDto {
  @IsString() @Matches(/^[a-z0-9-]{3,40}$/) code!: string;
  @IsString() @MinLength(3) @MaxLength(120) name!: string;
  @IsIn(["local", "search", "social", "referral", "business", "retention"])
  channel!: string;
  @IsIn(["new", "returning", "lapsed", "business"]) audience!: string;
  @IsDateString() startAt!: string;
  @IsDateString() endAt!: string;
  @IsInt() @Min(0) @Max(100000000) budgetCents!: number;
}
class UpdateCampaignDto {
  @IsIn(["planned", "active", "completed"]) status!:
    "planned" | "active" | "completed";
  @IsInt() @Min(0) @Max(100000000) spendCents!: number;
}
class CreateTaskDto {
  @IsString() @MinLength(5) @MaxLength(200) title!: string;
  @IsIn(["operations", "quality", "finance", "marketing", "partners"])
  area!: string;
  @IsDateString() dueAt!: string;
}
class UpdateTaskDto {
  @IsInt() @Min(0) revision!: number;
  @IsIn(["todo", "doing", "done"]) status!: "todo" | "doing" | "done";
}
@Injectable()
export class GrowthService {
  constructor(
    @InjectModel(Coupon.name)
    private readonly coupons: Model<HydratedDocument<Coupon>>,
    @InjectModel(GrowthCampaign.name)
    private readonly campaigns: Model<HydratedDocument<GrowthCampaign>>,
    @InjectModel(OperationsTask.name)
    private readonly tasks: Model<HydratedDocument<OperationsTask>>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(Product.name)
    private readonly products: Model<ProductDocument>,
    @InjectModel(ProductRevision.name)
    private readonly revisions: Model<ProductRevisionDocument>,
  ) {}
  async discount(
    code: string | undefined,
    context: {
      userId: string;
      subtotalCents: number;
      lines: Array<{
        menuItemId: unknown;
        productId?: unknown;
        unitPriceCents: number;
        quantity: number;
      }>;
    },
  ) {
    if (!code) return 0;
    const coupon = await this.coupons.findOne({ code }).exec();
    if (!coupon) throw new BadRequestException("Discount code not found.");
    const userScope = coupon.userScope ?? "all";
    const eligibleUserIds = coupon.eligibleUserIds ?? [];
    if (userScope === "specific" && !eligibleUserIds.includes(context.userId))
      throw new BadRequestException(
        "This discount code is not available for this account.",
      );

    const productScope = coupon.productScope ?? "all";
    const eligibleProductIds = new Set(coupon.eligibleProductIds ?? []);
    const eligibleLines =
      productScope === "specific"
        ? context.lines.filter((line) =>
            eligibleProductIds.has(String(line.productId ?? line.menuItemId)),
          )
        : context.lines;
    const eligibleQuantity = eligibleLines.reduce(
      (total, line) => total + line.quantity,
      0,
    );
    if (eligibleQuantity < (coupon.minimumEligibleQuantity ?? 1))
      throw new BadRequestException(
        "This discount code requires more eligible products in the cart.",
      );
    const discountableSubtotal = eligibleLines.reduce(
      (total, line) => total + line.unitPriceCents * line.quantity,
      0,
    );
    if (discountableSubtotal <= 0)
      throw new BadRequestException(
        "This discount code does not apply to the products in your cart.",
      );
    return couponDiscount(
      coupon,
      context.subtotalCents,
      new Date(),
      discountableSubtotal,
    );
  }
  async customerOffers(userId: string) {
    const now = new Date();
    const coupons = await this.coupons
      .find({
        active: true,
        startAt: { $lte: now },
        endAt: { $gt: now },
        $or: [
          { userScope: "all" },
          { userScope: { $exists: false } },
          { userScope: "specific", eligibleUserIds: userId },
        ],
      })
      .sort({ endAt: 1 })
      .limit(20)
      .exec();
    const productIds = [...new Set(coupons.flatMap((coupon) =>
      coupon.productScope === "specific" ? coupon.eligibleProductIds ?? [] : [],
    ))];
    const products = productIds.length
      ? await this.products.find({ _id: { $in: productIds } })
          .select("currentRevisionId").lean().exec()
      : [];
    const revisions = products.length
      ? await this.revisions.find({ _id: { $in: products.map((product) => product.currentRevisionId).filter(Boolean) } })
          .select("content.name").lean().exec()
      : [];
    const namesByRevision = new Map(revisions.map((revision) => [String(revision._id), revision.content.name]));
    const productNames = new Map(products.map((product) => [String(product._id),
      product.currentRevisionId ? namesByRevision.get(String(product.currentRevisionId)) : undefined,
    ]));
    return coupons.map((coupon) => ({
      code: coupon.code,
      name: coupon.name,
      kind: coupon.kind,
      value: coupon.value,
      minSubtotalCents: coupon.minSubtotalCents,
      maxDiscountCents: coupon.maxDiscountCents,
      endAt: coupon.endAt,
      productScope: coupon.productScope ?? "all",
      eligibleProducts: (coupon.eligibleProductIds ?? []).flatMap((id) => {
        const name = productNames.get(id);
        return name ? [{ id, name }] : [];
      }),
      minimumEligibleQuantity: coupon.minimumEligibleQuantity ?? 1,
    }));
  }
  async listCoupons() {
    return this.coupons.find().sort({ createdAt: -1 }).limit(200).exec();
  }
  async createCoupon(dto: CreateCouponDto, actor: string) {
    const userScope = dto.userScope ?? "all";
    const productScope = dto.productScope ?? "all";
    const eligibleUserIds = [...new Set(dto.eligibleUserIds ?? [])];
    const eligibleProductIds = [...new Set(dto.eligibleProductIds ?? [])];
    if (
      (dto.kind === "percent" && dto.value > 100) ||
      new Date(dto.endAt) <= new Date(dto.startAt) ||
      (userScope === "specific" && eligibleUserIds.length === 0) ||
      (productScope === "specific" && eligibleProductIds.length === 0)
    )
      throw new BadRequestException(
        "Choose a valid percentage and date range.",
      );
    try {
      if (userScope === "specific") {
        const count = await this.users.countDocuments({
          _id: { $in: eligibleUserIds },
          roles: UserRole.CUSTOMER,
        });
        if (count !== eligibleUserIds.length)
          throw new BadRequestException(
            "One or more selected customers do not exist.",
          );
      }
      if (productScope === "specific") {
        const count = await this.products.countDocuments({
          _id: { $in: eligibleProductIds },
        });
        if (count !== eligibleProductIds.length)
          throw new BadRequestException(
            "One or more selected products do not exist.",
          );
      }
      return await this.coupons.create({
        ...dto,
        userScope,
        productScope,
        eligibleUserIds: userScope === "specific" ? eligibleUserIds : [],
        eligibleProductIds:
          productScope === "specific" ? eligibleProductIds : [],
        minimumEligibleQuantity: dto.minimumEligibleQuantity ?? 1,
        createdBy: actor,
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000)
        throw new ConflictException("Discount code already exists.");
      throw error;
    }
  }
  async couponCustomers(q = "") {
    const query = q.trim().slice(0, 80);
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filter = query
      ? {
          roles: UserRole.CUSTOMER,
          $or: [
            { firstName: { $regex: escaped, $options: "i" } },
            { lastName: { $regex: escaped, $options: "i" } },
            { email: { $regex: escaped, $options: "i" } },
            { phone: { $regex: escaped, $options: "i" } },
          ],
        }
      : { roles: UserRole.CUSTOMER };
    const rows = await this.users
      .find(filter)
      .select("firstName lastName email phone")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
      .exec();
    return rows.map((row) => ({
      id: String(row._id),
      name: `${row.firstName} ${row.lastName}`.trim(),
      email: row.email ?? null,
      phone: row.phone ?? null,
    }));
  }
  async couponStatus(id: string, active: boolean) {
    const coupon = await this.coupons
      .findByIdAndUpdate(id, { $set: { active } }, { new: true })
      .exec();
    if (!coupon) throw new BadRequestException("Discount code not found.");
    return coupon;
  }
  async campaignSource(code?: string) {
    if (!code) return undefined;
    const now = new Date();
    const campaign = await this.campaigns
      .findOne({
        code,
        status: "active",
        startAt: { $lte: now },
        endAt: { $gt: now },
      })
      .select("code")
      .exec();
    return campaign?.code;
  }
  async createCampaign(dto: CreateCampaignDto, actor: string) {
    if (
      dto.name.trim().length < 3 ||
      new Date(dto.endAt) <= new Date(dto.startAt)
    )
      throw new BadRequestException(
        "Choose a name and an end date after the start.",
      );
    try {
      return await this.campaigns.create({
        ...dto,
        name: dto.name.trim(),
        createdBy: actor,
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000)
        throw new ConflictException("Campaign code already exists.");
      throw error;
    }
  }
  async updateCampaign(id: string, dto: UpdateCampaignDto, actor: string) {
    const doc = await this.campaigns
      .findByIdAndUpdate(
        id,
        { $set: dto, $push: { history: { at: new Date(), actor, ...dto } } },
        { new: true },
      )
      .exec();
    if (!doc) throw new BadRequestException("Campaign not found.");
    return doc;
  }
  async dashboard() {
    const [campaigns, attribution, customers] = await Promise.all([
      this.campaigns.find().sort({ createdAt: -1 }).limit(100).exec(),
      this.orders.aggregate([
        {
          $match: {
            campaignCode: { $exists: true },
            status: OrderStatus.COMPLETED,
            isTestOrder: { $ne: true },
          },
        },
        {
          $group: {
            _id: "$campaignCode",
            orders: { $sum: 1 },
            orderValueCents: { $sum: "$totalCents" },
            customers: { $addToSet: "$customerId" },
          },
        },
        {
          $project: {
            orders: 1,
            orderValueCents: 1,
            customers: { $size: "$customers" },
          },
        },
      ]),
      this.orders.aggregate([
        {
          $match: { status: OrderStatus.COMPLETED, isTestOrder: { $ne: true } },
        },
        {
          $group: {
            _id: "$customerId",
            orders: { $sum: 1 },
            lastOrderAt: { $max: "$completedAt" },
            totalCents: { $sum: "$totalCents" },
          },
        },
        {
          $group: {
            _id: null,
            customers: { $sum: 1 },
            repeatCustomers: {
              $sum: { $cond: [{ $gte: ["$orders", 2] }, 1, 0] },
            },
            lapsedCustomers: {
              $sum: {
                $cond: [
                  {
                    $lt: ["$lastOrderAt", new Date(Date.now() - 30 * 86400000)],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);
    return {
      campaigns,
      attribution,
      customers: customers[0] ?? {
        customers: 0,
        repeatCustomers: 0,
        lapsedCustomers: 0,
      },
    };
  }
  listTasks() {
    return this.tasks.find().sort({ dueAt: 1 }).limit(300).exec();
  }
  createTask(dto: CreateTaskDto, actor: string) {
    if (dto.title.trim().length < 5)
      throw new BadRequestException("Describe the task.");
    return this.tasks.create({
      ...dto,
      title: dto.title.trim(),
      createdBy: actor,
      history: [{ at: new Date(), actor, status: "todo" }],
    });
  }
  async updateTask(id: string, dto: UpdateTaskDto, actor: string) {
    const doc = await this.tasks
      .findOneAndUpdate(
        {
          _id: id,
          revision: dto.revision,
          $or: [{ ownerId: { $exists: false } }, { ownerId: actor }],
        },
        {
          $set: { status: dto.status, ownerId: actor },
          $inc: { revision: 1 },
          $push: { history: { at: new Date(), actor, status: dto.status } },
        },
        { new: true },
      )
      .exec();
    if (!doc)
      throw new ConflictException(
        "This task changed or belongs to another operator. Refresh the board.",
      );
    return doc;
  }
}
@Controller("growth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
class GrowthController {
  constructor(private readonly growth: GrowthService) {}
  @Get("coupons") coupons() {
    return this.growth.listCoupons();
  }
  @Get("coupon-targets/customers") couponCustomers(@Query("q") q?: string) {
    return this.growth.couponCustomers(q);
  }
  @Post("coupons") createCoupon(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CreateCouponDto,
  ) {
    return this.growth.createCoupon(dto, user.userId);
  }
  @Patch("coupons/:id") couponStatus(
    @Param("id") id: string,
    @Body() dto: CouponStatusDto,
  ) {
    return this.growth.couponStatus(id, dto.active);
  }
  @Get() dashboard() {
    return this.growth.dashboard();
  }
  @Post("campaigns") create(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.growth.createCampaign(dto, user.userId);
  }
  @Patch("campaigns/:id") update(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.growth.updateCampaign(id, dto, user.userId);
  }
  @Get("tasks") tasks() {
    return this.growth.listTasks();
  }
  @Post("tasks") task(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CreateTaskDto,
  ) {
    return this.growth.createTask(dto, user.userId);
  }
  @Patch("tasks/:id") updateTask(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.growth.updateTask(id, dto, user.userId);
  }
}
@Controller("offers")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
class CustomerOffersController {
  constructor(private readonly growth: GrowthService) {}
  @Get() list(@CurrentUser() user: JwtPayloadUser) {
    return this.growth.customerOffers(user.userId);
  }
}
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Coupon.name, schema: CouponSchema },
      { name: GrowthCampaign.name, schema: GrowthCampaignSchema },
      { name: OperationsTask.name, schema: OperationsTaskSchema },
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
      { name: ProductRevision.name, schema: ProductRevisionSchema },
    ]),
  ],
  controllers: [GrowthController, CustomerOffersController],
  providers: [GrowthService],
  exports: [GrowthService],
})
export class GrowthModule {}
