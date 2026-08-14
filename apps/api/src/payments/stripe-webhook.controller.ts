import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  Req,
  type RawBodyRequest,
} from "@nestjs/common";
import { ApiExcludeController, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { PaymentsService } from "./payments.service";

@ApiTags("payments")
@ApiExcludeController()
@Controller("payments/webhook")
export class StripeWebhookController {
  constructor(private readonly payments: PaymentsService) {}

  /**
   * Stripe webhook. When STRIPE_WEBHOOK_SECRET is set, signature is verified
   * against the raw body. Otherwise accepts a JSON `{ type, data }` event (test mode).
   */
  @Post("stripe")
  handleStripe(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    const raw =
      req.rawBody ??
      (Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(JSON.stringify(body ?? {})));

    if (!raw || (Buffer.isBuffer(raw) && raw.length === 0)) {
      throw new BadRequestException("errors.badRequest");
    }

    return this.payments.handleStripeWebhook(raw, signature, body);
  }
}
