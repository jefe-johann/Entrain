"use client";

import { useState } from "react";
import { ChevronDown, Gift, MousePointerClick, RotateCcw, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface ReferralMetricsSectionProps {
  clickCount: number;
  uniqueClickCount: number;
  attributedSignups: number;
  lifetimeRewardsGranted: number;
  reversedRewardsCount: number;
}

export function ReferralMetricsSection({
  clickCount,
  uniqueClickCount,
  attributedSignups,
  lifetimeRewardsGranted,
  reversedRewardsCount,
}: ReferralMetricsSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-3">
      <CollapsibleTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-between">
          Metrics
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MousePointerClick className="w-4 h-4 text-indigo-600" />
                Link clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{clickCount}</p>
              <p className="text-sm text-muted-foreground">
                Total visits with your `?ref=` link.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Unique clickers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{uniqueClickCount}</p>
              <p className="text-sm text-muted-foreground">
                Approximate unique visitors by hashed IP.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                Attributed signups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{attributedSignups}</p>
              <p className="text-sm text-muted-foreground">
                Users credited to your referral link.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-600" />
                Lifetime rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{lifetimeRewardsGranted}</p>
              <p className="text-sm text-muted-foreground">
                Total referral credits ever granted.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                Reversed rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{reversedRewardsCount}</p>
              <p className="text-sm text-muted-foreground">
                Credits removed after refunds/disputes.
              </p>
            </CardContent>
          </Card>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
