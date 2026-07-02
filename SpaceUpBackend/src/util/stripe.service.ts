import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY')!,
      {
        apiVersion: '2024-06-20' as any,
      },
    );
  }

  async createCustomer(email: string, name?: string): Promise<string> {
    const customer = await this.stripe.customers.create({ email, name });
    return customer.id;
  }

  async createPaymentIntent(
    amountUSD: number,
    customerId: string,
    currency = 'usd',
  ) {
    const amountCents = Math.max(Math.round(amountUSD * 100), 100);

    this.logger.log(`🪙 Creando PaymentIntent real: ${amountUSD} ${currency}`);
    return await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });
  }

  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string,
  ) {
    this.logger.log(`🔔 Confirmando PaymentIntent real ${paymentIntentId}`);
    return await this.stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId ?? undefined,
      return_url: 'https://spaceup.local/success',
    });
  }

  async attachPaymentMethod(paymentMethodId: string, customerId: string) {
    return this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  async detachPaymentMethod(paymentMethodId: string) {
    return this.stripe.paymentMethods.detach(paymentMethodId);
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<any> {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.cancel(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      throw new Error(`Error al cancelar PaymentIntent: ${error.message}`);
    }
  }
}
