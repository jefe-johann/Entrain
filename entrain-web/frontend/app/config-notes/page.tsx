import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/Header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Binaural Audio and Affirmation Guide - Entrain",
  description: "Learn how binaural beats and affirmation framing can support mindset change.",
};

const sectionLinks = [
  { href: "#science", label: "The Science" },
  { href: "#frequency-guide", label: "Frequency Guide" },
  { href: "#grammar", label: "Grammar of Belief" },
  { href: "#voice-choice", label: "Voice Choice" },
  { href: "#quick-start", label: "Quick Start Routine" },
];

const frequencyGuide = [
  {
    id: "hz-2",
    title: "2 Hz (Delta Waves)",
    state: "Deep, dreamless sleep and unconscious restoration.",
    bestFor: "Physical healing, deep subconscious access, and total detachment from the waking world.",
    tip: "Use this for sleep learning. With your conscious mind offline, resistance to new affirmations is lower.",
  },
  {
    id: "hz-4",
    title: "4 Hz (Theta/Delta Border)",
    state: "The twilight state between sleep and wakefulness.",
    bestFor: "Profound meditation, altered states, and access to suppressed memories or emotions.",
    tip: "A strong reprogramming window. You are relaxed enough to bypass logic but awake enough to visualize.",
  },
  {
    id: "hz-6",
    title: "6 Hz (Theta Waves)",
    state: "REM-like daydreaming, creativity, and imaginative absorption.",
    bestFor: "Goal visualization, emotional processing, and accelerated learning.",
    tip: "Children spend much of early life in theta. 6 Hz can recreate that absorbent learning state.",
  },
  {
    id: "hz-10",
    title: "10 Hz (Alpha Waves)",
    state: "Relaxed alertness and flow-state focus.",
    bestFor: "Stress reduction, positive thought patterns, and calm productivity.",
    tip: "Great for mornings. It bridges conscious focus with subconscious openness.",
  },
];

export default async function ConfigNotesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header credits={session.user.credits} isAdmin={session.user.isAdmin} />

      <main id="main-content" className="container mx-auto max-w-7xl px-4 py-8 lg:py-10">
        <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-sky-50 via-background to-indigo-50 p-6 shadow-sm dark:from-slate-900 dark:via-background dark:to-slate-800 lg:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">User Guide</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight lg:text-4xl">
            Exploring Binaural Audio and Affirmations
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
            You have unlocked a powerful tool for changing your state of mind. This guide explains what binaural beats are, how to choose the right frequency, and why the way you phrase affirmations changes how your brain receives them.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {sectionLinks.map((section) => (
              <a
                key={section.href}
                href={section.href}
                className="rounded-full border border-border/70 bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                {section.label}
              </a>
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="h-fit lg:sticky lg:top-24">
            <nav className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">On this page</h2>
              <ul className="mt-3 space-y-1.5">
                {sectionLinks.map((section) => (
                  <li key={section.href}>
                    <a
                      href={section.href}
                      className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      {section.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-50 p-4 shadow-sm dark:bg-amber-950/20">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Important</p>
              <p className="mt-2 text-sm leading-relaxed text-amber-800 dark:text-amber-100">
                Use stereo headphones. Phone and laptop speakers blend both tones in open air and remove the binaural effect.
              </p>
            </div>
          </aside>

          <article className="space-y-6">
            <section id="science" className="scroll-mt-24 rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <h2 className="text-2xl font-semibold tracking-tight">The Science: How Binaural Audio Works</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Binaural beats are an auditory illusion that nudges your brain into a different state. Here is the core mechanism:
              </p>
              <ol className="mt-4 list-decimal space-y-4 pl-5">
                <li className="leading-relaxed">
                  <span className="font-semibold">The Phantom Beat:</span> If your left ear hears{" "}
                  <strong>200 Hz</strong> and your right ear hears <strong>205 Hz</strong>, your brain generates a perceived
                  third pulse at <strong>5 Hz</strong>.
                </li>
                <li className="leading-relaxed">
                  <span className="font-semibold">Frequency Following Response (FFR):</span> The brain tends to synchronize with a
                  steady rhythmic pulse. This is the entrainment effect.
                </li>
                <li className="leading-relaxed">
                  <span className="font-semibold">State Change:</span> With the right beat, you can shift from high-alert beta toward
                  calmer alpha and theta patterns.
                </li>
              </ol>
            </section>

            <section id="frequency-guide" className="scroll-mt-24 rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <h2 className="text-2xl font-semibold tracking-tight">Frequency Guide: Choosing Your Hz</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Different beat frequencies encourage different cognitive and emotional states.
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {frequencyGuide.map((item) => (
                  <article
                    key={item.id}
                    id={item.id}
                    className="rounded-xl border border-border/70 bg-background/60 p-4 scroll-mt-24"
                  >
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed">
                      <span className="font-semibold">The State:</span> {item.state}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">
                      <span className="font-semibold">Best For:</span> {item.bestFor}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">
                      <span className="font-semibold">Manifestation Tip:</span> {item.tip}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section id="grammar" className="scroll-mt-24 rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <h2 className="text-2xl font-semibold tracking-tight">The Grammar of Belief: 1st, 2nd, or 3rd Person</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                The way you address yourself changes how your brain interprets and accepts the message.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <article className="rounded-xl border border-border/70 bg-background/60 p-4">
                  <h3 className="text-lg font-semibold">1. First Person ("I am...")</h3>
                  <p className="mt-2 text-sm leading-relaxed">
                    <span className="font-semibold">The Vibe:</span> Ownership and embodiment.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    <span className="font-semibold">When to use:</span> When you want to feel the wish fulfilled from within.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    <span className="font-semibold">Example:</span> <em>"I am confident and calm."</em>
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    <span className="font-semibold">Effect:</span> Deeply emotional but can trigger resistance if it feels untrue.
                  </p>
                </article>

                <article className="rounded-xl border border-border/70 bg-background/60 p-4">
                  <h3 className="text-lg font-semibold">2. Second Person ("You are...")</h3>
                  <p className="mt-2 text-sm leading-relaxed">
                    <span className="font-semibold">The Vibe:</span> Coaching and authority.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    <span className="font-semibold">When to use:</span> For encouragement, effort, and self-regulation.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    <span className="font-semibold">Science:</span> Mirrors supportive coaching language and helps with challenging tasks.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    <span className="font-semibold">Example:</span> <em>"You are capable of handling this."</em>
                  </p>
                </article>

                <article className="rounded-xl border border-border/70 bg-background/60 p-4">
                  <h3 className="text-lg font-semibold">3. Third Person ("Your name is...")</h3>
                  <p className="mt-2 text-sm leading-relaxed">
                    <span className="font-semibold">The Vibe:</span> Objectivity and detachment.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    <span className="font-semibold">When to use:</span> During high anxiety or emotionally charged topics.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    <span className="font-semibold">Science:</span> Creates psychological distance and can reduce stress reactivity.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    <span className="font-semibold">Example:</span> <em>"Sarah is wealthy and secure."</em>
                  </p>
                </article>
              </div>
            </section>

            <section id="voice-choice" className="scroll-mt-24 rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <h2 className="text-2xl font-semibold tracking-tight">Your Voice vs. a Stranger's Voice</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <article className="rounded-xl border border-border/70 bg-background/60 p-4">
                  <h3 className="text-lg font-semibold">Using Your Own Voice</h3>
                  <p className="mt-2 text-sm leading-relaxed">
                    <span className="font-semibold">Self-reference effect:</span> The brain processes self-relevant information faster
                    and more deeply.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    <span className="font-semibold">Trust:</span> Your own voice often bypasses skepticism because it resembles your
                    inner monologue.
                  </p>
                </article>

                <article className="rounded-xl border border-border/70 bg-background/60 p-4">
                  <h3 className="text-lg font-semibold">Using Someone Else's Voice</h3>
                  <p className="mt-2 text-sm leading-relaxed">
                    <span className="font-semibold">Authority:</span> External voices can command more attention than your habitual inner
                    voice.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    <span className="font-semibold">Reparenting:</span> A calm, supportive external voice can replace harsh self-talk and
                    feel emotionally corrective.
                  </p>
                </article>
              </div>
            </section>

            <section id="quick-start" className="scroll-mt-24 rounded-2xl border border-emerald-500/40 bg-emerald-50 p-6 shadow-sm dark:bg-emerald-950/20">
              <h2 className="text-2xl font-semibold tracking-tight">Quick Start Routine</h2>
              <ol className="mt-4 list-decimal space-y-3 pl-5 leading-relaxed">
                <li>Put on stereo headphones.</li>
                <li>Select <strong>6 Hz (Theta)</strong> for deep reprogramming.</li>
                <li>
                  Choose <strong>"You are"</strong> affirmations if you need support, or <strong>"I am"</strong> if you are ready to own
                  the identity directly.
                </li>
                <li>Close your eyes and let the phantom beat guide you.</li>
              </ol>
              <p className="mt-4 text-sm font-medium text-emerald-900 dark:text-emerald-100">Happy manifesting.</p>
            </section>
          </article>
        </div>
      </main>
    </div>
  );
}
