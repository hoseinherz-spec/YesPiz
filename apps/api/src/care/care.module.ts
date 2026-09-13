import { CatalogModule } from "../catalog/catalog.module";
import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Provider, ProviderSchema } from "../providers/schemas/provider.schema";
import { Order, OrderSchema } from "../orders/schemas/order.schema";
import {
  OrderFeedback,
  OrderFeedbackSchema,
  SupportCase,
  SupportCaseSchema,
} from "./care.schema";
import {
  PublicationPermissionDto,
  ModerateFeedbackDto,
  CreateSupportDto,
  ResolveSupportDto,
  SubmitFeedbackDto,
} from "./care.dto";
import { CareService } from "./care.service";
@Controller("care")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CareController {
  constructor(private readonly care: CareService) {}
  @Get("orders/:id/feedback")
  @Roles(UserRole.CUSTOMER)
  feedback(@CurrentUser() user: JwtPayloadUser, @Param("id") id: string) {
    return this.care.feedbackState(user.userId, id);
  }
  @Patch("orders/:id/publication-permission")
  @Roles(UserRole.CUSTOMER)
  permission(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
    @Body() dto: PublicationPermissionDto,
  ) {
    return this.care.publicationPermission(
      user.userId,
      id,
      dto.allowPublication,
    );
  }
  @Post("orders/:id/feedback")
  @Roles(UserRole.CUSTOMER)
  submit(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
    @Body() dto: SubmitFeedbackDto,
  ) {
    return this.care.submitFeedback(user.userId, id, dto);
  }
  @Get("requests")
  @Roles(UserRole.CUSTOMER)
  requests(@CurrentUser() user: JwtPayloadUser) {
    return this.care.customerCases(user.userId);
  }
  @Post("requests")
  @Roles(UserRole.CUSTOMER)
  create(@CurrentUser() user: JwtPayloadUser, @Body() dto: CreateSupportDto) {
    return this.care.createCase(user.userId, dto);
  }
  @Get("admin/requests")
  @Roles(UserRole.ADMIN)
  queue() {
    return this.care.listCases();
  }
  @Post("admin/requests/:id/claim")
  @Roles(UserRole.ADMIN)
  claim(@CurrentUser() user: JwtPayloadUser, @Param("id") id: string) {
    return this.care.claim(id, user.userId);
  }
  @Patch("admin/requests/:id")
  @Roles(UserRole.ADMIN)
  resolve(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
    @Body() dto: ResolveSupportDto,
  ) {
    return this.care.resolve(id, user.userId, dto);
  }
  @Patch("admin/feedback/:id/publication")
  @Roles(UserRole.ADMIN)
  moderate(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
    @Body() dto: ModerateFeedbackDto,
  ) {
    return this.care.moderate(id, user.userId, dto);
  }
  @Get("admin/feedback")
  @Roles(UserRole.ADMIN)
  metrics() {
    return this.care.metrics();
  }
}
@Controller("pizza-comments")
export class PublicCommentsController {
  constructor(private readonly care: CareService) {}
  @Get(":id") list(@Param("id") id: string) {
    return this.care.publicComments(id);
  }
}
@Module({
  imports: [
    CatalogModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Provider.name, schema: ProviderSchema },
      { name: OrderFeedback.name, schema: OrderFeedbackSchema },
      { name: SupportCase.name, schema: SupportCaseSchema },
    ]),
  ],
  controllers: [CareController, PublicCommentsController],
  providers: [CareService],
})
export class CareModule {}
