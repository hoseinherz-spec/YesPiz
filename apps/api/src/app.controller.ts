import { Controller, Get, Headers } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";

@ApiTags("health")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@Headers("accept-language") acceptLanguage?: string) {
    return this.appService.getHello(acceptLanguage);
  }
}
