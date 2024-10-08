import { Request, Response } from "express";
import Stripe from "stripe";
import express from "express";

import { HttpServer } from "../interfaces/HttpServer";
import { verifyToken } from "../middleware/verifyToken";
import { HttpStatusCode } from "../../helpers/HttpStatusCode";
import prisma from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { absoluteUrl } from "../../utils/absoluteUrl";
import logger from "../../utils/logger";
import AppError from "../../helpers/AppError";
import { Plans } from "../../utils/@types";

const settingsUrl = absoluteUrl("/dashboard");

const planTypes: Plans = {
  professional: {
    name: "Postgate PRO",
    description: "Pacote nível profissional de mensagens e ferramentas para WhatsApp",
    level: "PROFESSIONAL",
    amount: 2490
  },
}

export default class StripeController {
  constructor(httpServer: HttpServer) {
    httpServer.on("get", "/stripe", [verifyToken],
      async (request: Request & { user?: string, email?: string }, response: Response) => {
        try {
          const { planType } = request.query as { planType: string };
          if (!planType) {
            logger.error("Plan type is missing!");
            return response.status(HttpStatusCode.BAD_REQUEST).send();
          }
          if (!request.user) {
            return response.status(HttpStatusCode.UNAUTHORIZED).send({ message: "User not found!" });
          }
          const userSubscription = await prisma.userSubscription.findUnique({
            where: { userId: request.user }
          })
          if (userSubscription && userSubscription.stripeCustomerId) {
            const stripeSession = await stripe.billingPortal.sessions.create({
              customer: userSubscription.stripeCustomerId,
              return_url: settingsUrl
            })
            return response.status(200).json({ url: stripeSession.url });
          }
          const plan = planTypes[planType];
          const stripeSession = await stripe.checkout.sessions.create({
            success_url: settingsUrl,
            cancel_url: settingsUrl,
            payment_method_types: ["card"],
            mode: "subscription",
            billing_address_collection: "auto",
            customer_email: request.email as string,
            subscription_data: {
              trial_period_days: 7
            },
            line_items: [
              {
                price_data: {
                  currency: "BRL",
                  product_data: {
                    name: plan.name,
                    description: plan.description
                  },
                  unit_amount: plan.amount,
                  recurring: {
                    interval: "month"
                  }
                },
                quantity: 1
              }
            ],
            metadata: {
              userId: request.user,
              level: plan.level
            }
          });
          return response.status(200).json({ url: stripeSession.url });

        } catch (error: any) {
          logger.error(`[Stripe] - ${error.message}`);
          return response.status(HttpStatusCode.BAD_REQUEST).json({ message: error.message });
        }
      });

    httpServer.on("post", "/stripe/webhook", [express.raw({ type: 'application/json' })], // Garantindo raw body
      async (request: Request & { rawBody?: Buffer }, response: Response) => {
        const { "stripe-signature": stripeSignature } = request.headers;

        // Validação da assinatura e do segredo
        if (!stripeSignature) {
          logger.error(`[Stripe] - Missing Stripe signature`);
          return response.status(HttpStatusCode.BAD_REQUEST).send({ message: "Missing Stripe signature" });
        }
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
          logger.error(`[Stripe] - Missing webhook secret`);
          return response.status(HttpStatusCode.INTERNAL_SERVER).send({ message: "Webhook secret not configured" });
        }

        const body = request.rawBody as Buffer;
        let event: Stripe.Event;

        // Tentativa de construir o evento do webhook
        try {
          event = stripe.webhooks.constructEvent(
            body,
            stripeSignature,
            process.env.STRIPE_WEBHOOK_SECRET
          );
        } catch (error: any) {
          logger.error(`[Stripe] - Webhook signature verification failed: ${error.message}`);
          return response.status(HttpStatusCode.BAD_REQUEST).send({ message: `Webhook Error: ${error.message}` });
        }

        const session = event.data.object as Stripe.Checkout.Session;

        // Tratamento para eventos checkout.session.completed
        if (event.type === "checkout.session.completed") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

          // Validação dos metadados
          if (!session.metadata || !session.metadata.userId || !session.metadata.level) {
            logger.error("[Stripe] - Missing metadata in session");
            return response.status(HttpStatusCode.BAD_REQUEST).json({ message: "Missing metadata in session" });
          }

          // Criação da assinatura no banco de dados
          await prisma.userSubscription.update({
            where: {
              userId: session.metadata.userId
            },
            data: {
              subscriptionLevel: session.metadata.level,
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: subscription.customer as string,
              stripePriceId: subscription.items.data[0].price.id,
              stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000)
            }
          });
        }

        // Tratamento para eventos invoice.payment_succeeded
        if (event.type === "invoice.payment_succeeded") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await prisma.userSubscription.updateMany({
            where: {
              stripeSubscriptionId: {
                equals: subscription.id
              }
            },
            data: {
              stripePriceId: subscription.items.data[0].price.id,
              stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            }
          });
        }

        // Caso o evento não seja tratado diretamente
        logger.info(`[Stripe] - Event received: ${event.type}`);

        return response.status(200).send();
      });

    httpServer.on("get", "/stripe/manage_subscription/:stripeCustomerId", [verifyToken],
      async (request: Request, response: Response) => {
        const { stripeCustomerId } = request.params as { stripeCustomerId: string; }
        try {
          const configuration = await stripe.billingPortal.configurations.create({
            business_profile: {
              headline: "Gerencie sua inscrição"
            },
            features: {
              subscription_cancel: {
                enabled: true,
                mode: 'at_period_end',
                cancellation_reason: {
                  enabled: true,
                  options: [
                    'too_expensive',
                    'missing_features',
                    'switched_service',
                    'unused',
                    'other',
                  ],
                },
              },
            }
          });
          const url = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${process.env.APP_URL}/dashboard`,
            configuration: configuration.id,
          });
          return response.json(url).status(200)
        } catch (error: any) {
          logger.error(error.message);
          return response.status(HttpStatusCode.BAD_REQUEST).send();
        }
      });
  }
}
