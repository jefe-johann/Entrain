import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Purchase Complete - Entrain",
};

export default async function CreditsSuccessPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-50/50 via-background to-indigo-50/30 pointer-events-none" />

      <div className="relative z-10">
        <Header
          credits={session.user.credits}
          isAdmin={session.user.isAdmin}
        />

        <main id="main-content" className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
                <CardTitle className="text-2xl">Purchase Complete!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Your credits have been added to your account.
                </p>
                <p className="text-lg font-semibold">
                  Balance:{" "}
                  {session.user.isAdmin
                    ? "unlimited"
                    : session.user.credits}{" "}
                  credits
                </p>
                <div className="flex gap-3 justify-center pt-2">
                  <Button asChild>
                    <Link href="/generate">Generate Track</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/credits">Buy More</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
