import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LandingPage() {
  const session = await auth();

  // If user is already signed in, redirect to generate page
  if (session?.user) {
    redirect("/generate");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Entrain
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create personalized meditation tracks with binaural beats and spoken affirmations.
            Designed for subconscious reprogramming during sleep and meditation.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Binaural Beats</CardTitle>
              <CardDescription>
                Choose from Delta, Theta, Alpha, or Beta wave frequencies to match your meditation goals.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Custom Affirmations</CardTitle>
              <CardDescription>
                Write your own affirmations or use our templates. They&apos;ll be spoken throughout your track.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Premium Voices</CardTitle>
              <CardDescription>
                High-quality ElevenLabs voices bring your affirmations to life with natural speech.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Sign In */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Sign in to create your first meditation track. You&apos;ll receive 1 free credit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/generate" });
              }}
            >
              <Button type="submit" className="w-full" size="lg">
                Sign in with Google
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* How it works */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-8">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1</div>
              <p className="text-muted-foreground">Sign in with your Google account</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">2</div>
              <p className="text-muted-foreground">Enter your affirmations and choose settings</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">3</div>
              <p className="text-muted-foreground">We generate your custom track</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">4</div>
              <p className="text-muted-foreground">Download and meditate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
