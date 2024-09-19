export interface AuthenticateUser {
  execute(input: AuthenticateUser.Input): Promise<AuthenticateUser.Ouput>
}

export namespace AuthenticateUser {
  export type Input = {
    email: string;
    password: string;
  }
  export type Ouput = {
    token: string;
    user: {
      id: string;
      email: string;
      username: string | undefined | null;
      userSubscription: {
        id: string;
        stripeCurrentPeriodEnd: string | null;
        stripeCustomerId: string | null;
        stripePriceId: string | null;
        stripeSubscriptionId: string | null;
        subscriptionLevel: string;
        createdAt: string;
        updatedAt: string;
        userId: string;
      };
    }
  }
}