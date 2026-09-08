import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { ProvidersService } from "../providers/providers.service";
import {
  CreateAddressDto,
  CreateOrderDto,
  ResolveAdminReviewDto,
  UpdateKitchenStatusDto,
} from "./dto/order.dto";
import { PrepOverrideDto } from "../providers/dto/provider.dto";
import { OrdersService } from "./orders.service";

@ApiTags("orders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("orders")
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly providers: ProvidersService,
  ) {}

  @Roles(UserRole.CUSTOMER)
  @Post("addresses")
  createAddress(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CreateAddressDto,
  ) {
    return this.orders.createAddress(user.userId, dto);
  }

  @Roles(UserRole.CUSTOMER)
  @Get("addresses")
  listAddresses(@CurrentUser() user: JwtPayloadUser) {
    return this.orders.listAddresses(user.userId);
  }

  @Roles(UserRole.CUSTOMER)
  @Delete("addresses/:id")
  deleteAddress(@CurrentUser() user: JwtPayloadUser, @Param("id") id: string) {
    return this.orders.deleteAddress(user.userId, id);
  }

  @Roles(UserRole.CUSTOMER)
  @Post("quote")
  quote(@CurrentUser() user: JwtPayloadUser, @Body() dto: CreateOrderDto) {
    return this.orders.quote(user.userId, dto);
  }

  @Roles(UserRole.CUSTOMER)
  @Post()
  create(@CurrentUser() user: JwtPayloadUser, @Body() dto: CreateOrderDto) {
    return this.orders.createOrder(user.userId, dto);
  }

  @Roles(UserRole.CUSTOMER)
  @Get()
  list(@CurrentUser() user: JwtPayloadUser) {
    return this.orders.listForCustomer(user.userId);
  }

  @Roles(UserRole.ADMIN)
  @Get("admin/at-risk")
  listAtRisk() {
    return this.orders.listAtRisk();
  }

  @Roles(UserRole.ADMIN)
  @Get("admin/review")
  listAdminReview() {
    return this.orders.listForAdminReview();
  }

  @Roles(UserRole.ADMIN)
  @Patch("admin/review/:id")
  resolveAdminReview(
    @Param("id") id: string,
    @Body() dto: ResolveAdminReviewDto,
  ) {
    return this.orders.resolveAdminReview(id, dto);
  }

  @Roles(UserRole.PROVIDER)
  @Get("kitchen")
  async listKitchen(@CurrentUser() user: JwtPayloadUser) {
    const provider = await this.providers.getSelf(user.userId);
    return this.orders.listKitchenForProvider(provider.id);
  }

  @Roles(UserRole.CUSTOMER)
  @Post("reorder/:orderId")
  reorder(
    @CurrentUser() user: JwtPayloadUser,
    @Param("orderId") orderId: string,
  ) {
    return this.orders.buildReorderPreview(user.userId, orderId);
  }

  @Roles(UserRole.CUSTOMER)
  @Get(":id/courier-location")
  courierLocation(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
  ) {
    return this.orders.getCourierLocationForCustomer(user.userId, id);
  }

  @Roles(UserRole.CUSTOMER)
  @Get(":id")
  get(@CurrentUser() user: JwtPayloadUser, @Param("id") id: string) {
    return this.orders.getForCustomer(user.userId, id);
  }

  @Roles(UserRole.PROVIDER)
  @Patch(":id/kitchen-status")
  async kitchenStatus(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
    @Body() dto: UpdateKitchenStatusDto,
  ) {
    const provider = await this.providers.getSelf(user.userId);
    return this.orders.updateKitchenStatus(user.userId, id, dto, provider.id);
  }

  @Roles(UserRole.PROVIDER)
  @Patch(":id/prep-override")
  async prepOverride(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
    @Body() dto: PrepOverrideDto,
  ) {
    const provider = await this.providers.getSelf(user.userId);
    return this.orders.setPrepOverride(provider.id, id, dto);
  }

  @Roles(UserRole.COURIER, UserRole.ADMIN)
  @Post(":id/failed-cash")
  markFailedCash(@CurrentUser() user: JwtPayloadUser, @Param("id") id: string) {
    return this.orders.markFailedCash(
      id,
      user.roles.includes(UserRole.ADMIN) ? undefined : user.userId,
    );
  }
}
