import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface AdminReferralMetricsRow {
  userId: string;
  email: string;
  clicks: number;
  uniqueClickers: number;
  attributedSignups: number;
  pendingReferrals: number;
  activeRewards: number;
  rewardsGranted: number;
  rewardsReversed: number;
}

interface AdminReferralMetricsSectionProps {
  rows: AdminReferralMetricsRow[];
}

export function AdminReferralMetricsSection({ rows }: AdminReferralMetricsSectionProps) {
  return (
    <details className="group rounded-xl border border-border/60 bg-white/70 p-4 shadow-sm backdrop-blur-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
        <span>All Users Metrics</span>
        <span className="text-xs text-muted-foreground">Admin only</span>
      </summary>

      <div className="mt-4">
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0 pb-3">
            <CardTitle className="text-base">Referral Performance</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No referral activity found yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">User</th>
                      <th className="py-2 pr-3 font-medium">Clicks</th>
                      <th className="py-2 pr-3 font-medium">Unique</th>
                      <th className="py-2 pr-3 font-medium">Signups</th>
                      <th className="py-2 pr-3 font-medium">Pending</th>
                      <th className="py-2 pr-3 font-medium">Active</th>
                      <th className="py-2 pr-3 font-medium">Granted</th>
                      <th className="py-2 font-medium">Reversed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.userId} className="border-b border-border/40 last:border-0">
                        <td className="py-2 pr-3">{row.email}</td>
                        <td className="py-2 pr-3">{row.clicks}</td>
                        <td className="py-2 pr-3">{row.uniqueClickers}</td>
                        <td className="py-2 pr-3">{row.attributedSignups}</td>
                        <td className="py-2 pr-3">{row.pendingReferrals}</td>
                        <td className="py-2 pr-3">{row.activeRewards}</td>
                        <td className="py-2 pr-3">{row.rewardsGranted}</td>
                        <td className="py-2">{row.rewardsReversed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </details>
  );
}
