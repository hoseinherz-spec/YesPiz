import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { RedisService } from "./redis/redis.service";
import {
  Controller,
  Get,
  Headers,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";

@ApiTags("health")
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectConnection() private readonly db: Connection,
    private readonly redis: RedisService,
  ) {}

  @Get("health/live") live() {
    return { ok: true };
  }

  @Get("health/ready") async ready() {
    try {
      if (this.db.readyState !== 1 || !(await this.redis.ready()))
        throw new Error("unavailable");
      await this.db.db!.admin().ping();
      return { ok: true };
    } catch {
      throw new ServiceUnavailableException("Dependencies unavailable.");
    }
  }

  @Get()
  getHello(@Headers("accept-language") acceptLanguage?: string) {
    return this.appService.getHello(acceptLanguage);
  }
}
