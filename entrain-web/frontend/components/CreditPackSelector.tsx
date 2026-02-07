"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Sparkles, Zap } from "lucide-react";
import { api } from "@/lib/api";

const CREDIT_PACKS = [
  {
    priceId: "price_1Sy31V36rv1VSvW7AvPC7lAt",
    credits: 1,
    price: "$1.25",
    perCredit: "$1.25",
    icon: Coins,
    label: "Starter",
    description: "Try a new configuration",
  },
  {
    priceId: "price_1Sy31R36rv1VSvW7cIOt5tzW",
    credits: 5,
    price: "$4.99",
    perCredit: "$1.00",
    icon: Sparkles,
    label: "Popular",
    popular: true,
    description: "Best value for regular use",
    savings: "20% off",
  },
  {
    priceId: "price_1Sy31V36rv1VSvW7CKJKNDy7",
    credits: 10,
    price: "$8.99",
    perCredit: "$0.90",
    icon: Zap,
    label: "Best Value",
    description: "Maximum savings",
    savings: "28% off",
  },
];

interface CreditPackSelectorProps {
  userEmail: string;
}

export function CreditPackSelector({ userEmail }: CreditPackSelectorProps) {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const handlePurchase = async (priceId: string) => {
    setLoadingPriceId(priceId);
    try {
      api.setUserEmail(userEmail);
      const { checkout_url } = await api.createCheckoutSession(priceId);
      window.location.href = checkout_url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start checkout"
      );
      setLoadingPriceId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {CREDIT_PACKS.map((pack) => {
          const Icon = pack.icon;
          return (
            <Card
              key={pack.priceId}
              className={`relative border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm ${
                pack.popular ? "ring-2 ring-purple-500" : ""
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mx-auto mb-2">
                  <Icon className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">
                  {pack.credits} Credit{pack.credits !== 1 ? "s" : ""}
                </CardTitle>
                <p className="text-2xl font-bold text-foreground">
                  {pack.price}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pack.perCredit} per credit
                </p>
                {pack.savings && (
                  <span className="inline-block text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1">
                    {pack.savings}
                  </span>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  {pack.description}
                </p>
                <Button
                  className="w-full"
                  variant={pack.popular ? "default" : "outline"}
                  disabled={loadingPriceId !== null}
                  onClick={() => handlePurchase(pack.priceId)}
                >
                  {loadingPriceId === pack.priceId
                    ? "Redirecting..."
                    : "Buy Now"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>1 credit = up to 50 affirmation-repetitions per track</p>
        <p className="mt-1">Payments processed securely by Stripe</p>
      </div>
    </div>
  );
}
