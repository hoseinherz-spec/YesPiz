import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { resolveLocale, translate } from "@repo/i18n/node";
import type { Request, Response } from "express";

@Catch()
export class I18nExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(I18nExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const locale = resolveLocale(request.headers["accept-language"]);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorKey = "errors.internal";
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === "string") {
        errorKey = body.startsWith("errors.") ? body : this.statusToKey(status);
      } else if (body && typeof body === "object") {
        const obj = body as Record<string, unknown>;
        if (
          typeof obj.message === "string" &&
          obj.message.startsWith("errors.")
        ) {
          errorKey = obj.message;
        } else if (Array.isArray(obj.message)) {
          errorKey = "errors.validation";
          details = obj.message;
        } else if (typeof obj.errorKey === "string") {
          errorKey = obj.errorKey;
        } else {
          errorKey = this.statusToKey(status);
          details = obj.message ?? obj;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      errorKey,
      message: translate(locale, errorKey),
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private statusToKey(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return "errors.badRequest";
      case HttpStatus.UNAUTHORIZED:
        return "errors.unauthorized";
      case HttpStatus.FORBIDDEN:
        return "errors.forbidden";
      case HttpStatus.NOT_FOUND:
        return "errors.notFound";
      case HttpStatus.CONFLICT:
        return "errors.conflict";
      default:
        return "errors.internal";
    }
  }
}
