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

const settingsUrl = absoluteUrl("/");

const planTypes: Plans = {
  beginner: {
    name: "Zapgate Iniciante",
    description: "Pacote nível iniciante de mensagens e ferramentas para whastapp",
    level: "BEGINNER",
    amount: 4900
  },
  professional: {
    name: "Zapgate Profissional",
    description: "Pacote nível profissional de mensagens e ferramentas para whastapp",
    level: "PROFESSIONAL",
    amount: 9900
  },
  business: {
    name: "Zapgate Empresa",
    description: "Pacote nível empresa de mensagens e ferramentas para whastapp",
    level: "BUSINESS",
    amount: 14900
  }
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

          const plan = planTypes[planType]
          const stripeSession = await stripe.checkout.sessions.create({
            success_url: settingsUrl,
            cancel_url: settingsUrl,
            payment_method_types: ["card"],
            mode: "subscription",
            billing_address_collection: "auto",
            customer_email: request.email as string,
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
          })
          return response.status(200).json({ url: stripeSession.url });

        } catch (error: any) {
          logger.error(`[Stripe] - ${error.message}`);
          return response.status(HttpStatusCode.BAD_REQUEST).json({ message: error.message });
        }
      });

    httpServer.on("post", "/stripe/webhook", [],
      async (request: Request & { rawBody?: Buffer }, response: Response) => {
        const { "stripe-signature": stripeSignature } = request.headers;
        const body = request.rawBody as Buffer;
        let event: Stripe.Event;
        try {
          event = stripe.webhooks.constructEvent(
            body,
            stripeSignature as any,
            process.env.STRIPE_WEBHOOK_SECRET as string
          )
        } catch (error: any) {
          logger.error(`[Stripe] - ${error.message}`);
          throw new AppError({ message: error.message, statusCode: HttpStatusCode.BAD_REQUEST });
        }
        const session = event.data.object as Stripe.Checkout.Session;
        if (event.type === "checkout.session.completed") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          if (!session.metadata?.userId) {
            return response.status(HttpStatusCode.BAD_REQUEST).json({ message: "User id required" });
          }
          if (!session.metadata?.level) {
            return response.status(HttpStatusCode.BAD_REQUEST).json({ message: "User level required" });
          }
          await prisma.userSubscription.create({
            data: {
              userId: session.metadata.userId,
              subscriptionLevel: session.metadata.level,
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: subscription.customer as string,
              stripePriceId: subscription.items.data[0].price.id,
              stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000)
            }
          })
        }
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
          })
        }
        return response.status(200).send();
      });
  }
}