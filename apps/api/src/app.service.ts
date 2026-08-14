import { Injectable } from "@nestjs/common";
import { translate } from "@repo/i18n/node";

@Injectable()
export class AppService {
  getHello(acceptLanguage?: string) {
    return {
      message: "Yespizz API",
      hello: translate(acceptLanguage, "common.hello"),
    };
  }
}
