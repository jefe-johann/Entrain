import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { DashboardClient } from "./client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Tracks - Entrain",
  description: "View and manage your personalized meditation tracks",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header credits={session.user.credits} isAdmin={session.user.isAdmin} />

      {/* Main Content */}
      <main id="main-content" className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Your Meditation Tracks</h1>
          <DashboardClient userEmail={session.user.email!} />
        </div>
      </main>
    </div>
  );
}
