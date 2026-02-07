import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Waves, MessageSquareText, Mic, Headphones, PenLine, Sparkles, Download, ChevronDown } from "lucide-react";

export default async function LandingPage() {
  const session = await auth();

  // If user is already signed in, redirect to generate page
  if (session?.user) {
    redirect("/generate");
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Atmospheric background */}
      <div className="fixed inset-0 bg-gradient-to-b from-purple-50 via-white to-indigo-50/50" />

      {/* Decorative gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-indigo-200/25 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-200/20 rounded-full blur-3xl animate-float" />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-20 pb-8 px-4">
          <div className="container mx-auto max-w-5xl text-center">
            {/* Logo with glow */}
            <div className="flex justify-center mb-8 animate-fade-in-up">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-2xl scale-150 animate-pulse-glow" />
                <Image
                  src="/logo.png"
                  alt="Entrain Logo"
                  width={140}
                  height={140}
                  className="relative drop-shadow-lg"
                  priority
                />
              </div>
            </div>

            {/* Title with gradient */}
            <h1 className="animate-fade-in-up-delay-1 text-6xl sm:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-purple-700 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Entrain
            </h1>

            <p className="animate-fade-in-up-delay-2 text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Create personalized meditation tracks with binaural beats and spoken affirmations.
            </p>

            <p className="animate-fade-in-up-delay-3 text-base text-muted-foreground/70 mt-3 max-w-xl mx-auto">
              Designed for subconscious reprogramming during sleep and meditation.
            </p>

            {/* CTA Button */}
            <div className="animate-fade-in-up-delay-4 mt-10">
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/generate" });
                }}
              >
                <Button
                  type="submit"
                  size="lg"
                  className="text-lg px-8 py-6 rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Get Started Free
                </Button>
              </form>
              <p className="text-sm text-muted-foreground mt-3">
                Sign in with Google
              </p>
            </div>

            {/* Scroll Indicator */}
            <div className="mt-12 flex justify-center">
              <ChevronDown className="w-8 h-8 text-muted-foreground/40" />
            </div>
          </div>
        </section>

        {/* Wave divider */}
        <div className="relative h-16 sm:h-24">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full">
            <path d="M0,60 C300,120 600,0 900,60 C1050,90 1150,80 1200,60 L1200,120 L0,120 Z" className="fill-white/60" />
            <path d="M0,80 C200,40 500,100 800,60 C950,40 1100,70 1200,50 L1200,120 L0,120 Z" className="fill-white/40" />
          </svg>
        </div>

        {/* Features Section */}
        <section className="py-16 px-4 bg-white/40 backdrop-blur-sm">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-foreground">
              Everything you need for deep meditation
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Combine scientifically-backed binaural beats with personalized affirmations for powerful subconscious transformation.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                    <Waves className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Binaural Beats</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Choose from Delta, Theta, Alpha, or Beta wave frequencies to guide your brain into the ideal meditative state.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center mb-3 group-hover:bg-violet-200 transition-colors">
                    <MessageSquareText className="w-6 h-6 text-violet-600" />
                  </div>
                  <CardTitle className="text-lg">Custom Affirmations</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Write your own affirmations tailored to your goals. They&apos;re woven throughout your track at the perfect intervals.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
                    <Mic className="w-6 h-6 text-indigo-600" />
                  </div>
                  <CardTitle className="text-lg">Premium Voices</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    High-quality ElevenLabs voices bring your affirmations to life with natural, soothing speech.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
              How it works
            </h2>
            <p className="text-center text-muted-foreground mb-14">
              From sign-in to meditation in four simple steps.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20 group-hover:shadow-xl group-hover:shadow-purple-500/30 transition-all duration-300 group-hover:-translate-y-1">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="text-sm font-semibold text-purple-600 mb-1">Step 1</div>
                <p className="text-muted-foreground text-sm">Sign in with your Google account</p>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/20 group-hover:shadow-xl group-hover:shadow-violet-500/30 transition-all duration-300 group-hover:-translate-y-1">
                  <PenLine className="w-7 h-7 text-white" />
                </div>
                <div className="text-sm font-semibold text-violet-600 mb-1">Step 2</div>
                <p className="text-muted-foreground text-sm">Enter your affirmations and choose settings</p>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20 group-hover:shadow-xl group-hover:shadow-indigo-500/30 transition-all duration-300 group-hover:-translate-y-1">
                  <Headphones className="w-7 h-7 text-white" />
                </div>
                <div className="text-sm font-semibold text-indigo-600 mb-1">Step 3</div>
                <p className="text-muted-foreground text-sm">We generate your custom meditation track</p>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20 group-hover:shadow-xl group-hover:shadow-purple-500/30 transition-all duration-300 group-hover:-translate-y-1">
                  <Download className="w-7 h-7 text-white" />
                </div>
                <div className="text-sm font-semibold text-purple-600 mb-1">Step 4</div>
                <p className="text-muted-foreground text-sm">Download your track and start meditating</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-2xl">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white overflow-hidden relative">
              {/* Decorative elements inside card */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

              <CardHeader className="text-center relative z-10 pb-2">
                <CardTitle className="text-2xl sm:text-3xl text-white">Ready to begin?</CardTitle>
                <CardDescription className="text-purple-100 text-base">
                  Create your first personalized meditation track today. It&apos;s free to start.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 pb-8">
                <form
                  action={async () => {
                    "use server";
                    await signIn("google", { redirectTo: "/generate" });
                  }}
                  className="flex flex-col items-center"
                >
                  <Button
                    type="submit"
                    size="lg"
                    variant="secondary"
                    className="text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 text-purple-700 font-semibold"
                  >
                    Sign in with Google
                  </Button>
                  <p className="text-sm text-purple-200 mt-3">
                    No credit card required
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-border/40">
          <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Image src="/logo.png" alt="Entrain" width={24} height={24} />
              <span className="text-sm font-medium">Entrain</span>
            </div>
            <p className="text-sm text-muted-foreground/60">
              Personalized meditation through binaural beats &amp; affirmations
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
