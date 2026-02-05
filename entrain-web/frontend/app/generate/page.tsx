import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GeneratorForm } from "@/components/GeneratorForm";

export default async function GeneratePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header credits={session.user.credits} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Create Meditation Track</CardTitle>
            <CardDescription>
              Configure your personalized meditation track with binaural beats and affirmations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GeneratorForm
              userEmail={session.user.email!}
              credits={session.user.credits}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
