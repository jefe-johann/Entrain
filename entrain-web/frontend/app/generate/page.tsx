import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GeneratorForm } from "@/components/GeneratorForm";

export default async function GeneratePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Entrain
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <div className="text-sm text-muted-foreground">
              {session.user.name || session.user.email}
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button variant="outline" size="sm">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

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
