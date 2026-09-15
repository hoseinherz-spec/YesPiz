import {
  Body,
  ConflictException,
  Controller,
  Get,
  Global,
  Injectable,
  Module,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  InjectModel,
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
} from "@nestjs/mongoose";
import { Model, HydratedDocument } from "mongoose";
import { IsInt, Min, Max } from "class-validator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { UserRole } from "../common/enums";
export const DEFAULT_REWARD_POLICY = {
  version: 1,
  ordersPerReward: 5,
  rewardCents: 500,
  minimumOrderCents: 1000,
};
@Schema({ timestamps: true, collection: "reward_policies" })
class RewardPolicy {
  @Prop({ required: true, unique: true }) version!: number;
  @Prop({ required: true }) ordersPerReward!: number;
  @Prop({ required: true }) rewardCents!: number;
  @Prop({ required: true }) minimumOrderCents!: number;
  @Prop() actorId?: string;
}
const RewardPolicySchema = SchemaFactory.createForClass(RewardPolicy);
class PolicyDto {
  @IsInt() @Min(1) version!: number;
  @IsInt() @Min(1) @Max(50) ordersPerReward!: number;
  @IsInt() @Min(100) @Max(10000) rewardCents!: number;
  @IsInt() @Min(0) @Max(100000) minimumOrderCents!: number;
}
@Injectable()
export class RewardPolicyService {
  constructor(
    @InjectModel(RewardPolicy.name)
    private policies: Model<HydratedDocument<RewardPolicy>>,
  ) {}
  async current() {
    const p = await this.policies.findOne().sort({ version: -1 }).lean();
    return p
      ? {
          version: p.version,
          ordersPerReward: p.ordersPerReward,
          rewardCents: p.rewardCents,
          minimumOrderCents: p.minimumOrderCents,
        }
      : DEFAULT_REWARD_POLICY;
  }
  async history() {
    return this.policies.find().sort({ version: -1 }).limit(50).lean();
  }
  async update(dto: PolicyDto, actorId: string) {
    const current = await this.current();
    if (current.version !== dto.version)
      throw new ConflictException("Rules changed. Refresh before saving.");
    try {
      await this.policies.create({ ...dto, version: dto.version + 1, actorId });
    } catch (e) {
      if ((e as { code?: number }).code === 11000)
        throw new ConflictException("Rules changed. Refresh before saving.");
      throw e;
    }
    return this.current();
  }
}
@Controller("growth/reward-policy")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
class PolicyController {
  constructor(private service: RewardPolicyService) {}
  @Get() async get() {
    return {
      current: await this.service.current(),
      history: await this.service.history(),
    };
  }
  @Post() update(@Body() dto: PolicyDto, @CurrentUser() u: JwtPayloadUser) {
    return this.service.update(dto, u.userId);
  }
}
@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RewardPolicy.name, schema: RewardPolicySchema },
    ]),
  ],
  providers: [RewardPolicyService],
  controllers: [PolicyController],
  exports: [RewardPolicyService],
})
export class RewardPolicyModule {}
