import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { GeneratorForm } from "@/components/GeneratorForm";
import { Headphones } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generate Track - Entrain",
  description: "Customize and generate your personalized meditation track with binaural beats and spoken affirmations",
};

export default async function GeneratePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen relative">
      {/* Subtle background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-50/50 via-background to-indigo-50/30 pointer-events-none" />

      <div className="relative z-10">
        <Header credits={session.user.credits} isAdmin={session.user.isAdmin} />

        <main id="main-content" className="container mx-auto px-4 py-8">
          {/* Page heading */}
          <div className="max-w-3xl mx-auto mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-md shadow-purple-500/20">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Create Meditation Track</h1>
            </div>
            <p className="text-muted-foreground ml-[52px]">
              Configure your personalized track with binaural beats and spoken affirmations.
            </p>
          </div>

          <Card className="max-w-3xl mx-auto border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <GeneratorForm
                userEmail={session.user.email!}
                credits={session.user.credits}
                isAdmin={session.user.isAdmin}
              />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
