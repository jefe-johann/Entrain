import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { Header } from "@/components/Header";
import type { Metadata } from "next";
import { ELEVENLABS_LABEL, ELEVENLABS_URL, VOICE_CLONE_STEPS } from "@/lib/customVoiceGuide";

export const metadata: Metadata = {
  title: "Binaural Audio and Affirmation Guide - Entrain",
  description: "Learn how binaural beats and affirmation framing can support mindset change.",
};

const sectionLinks = [
  { href: "#science", label: "The Science" },
  { href: "#affirmation-examples", label: "Affirmation Examples" },
  { href: "#frequency-guide", label: "Frequency Guide" },
  { href: "#grammar", label: "Grammar of Belief" },
  { href: "#voice-choice", label: "Voice Choice" },
  { href: "#quick-start", label: "Quick Start Routine" },
  { href: "#deeper-understanding", label: "Deeper Understanding" },
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

const selfConceptAffirmationExamples = [
  {
    id: "identity-worth",
    title: "Identity and Self-Worth",
    description: "Use these when you are building inner stability and self-respect.",
    examples: [
      "I am worthy of being loved, respected, and chosen.",
      "I am secure in who I am and how I show up.",
      "I am naturally valuable, even before I prove anything.",
    ],
  },
  {
    id: "abundance-success",
    title: "Abundance and Success",
    description: "Use these when your focus is money, career growth, or opportunities.",
    examples: [
      "I am the kind of person who creates and keeps wealth.",
      "I am open to consistent opportunities that match my goals.",
      "I am already becoming more successful through my daily choices.",
    ],
  },
  {
    id: "love-relationships",
    title: "Love and Relationships",
    description: "Use these when you want healthier relationship patterns and standards.",
    examples: [
      "I am deeply loved and emotionally safe in my relationships.",
      "I am someone who receives honest, respectful communication.",
      "I am aligned with relationships that reflect my self-respect.",
    ],
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
              <p className="mt-3 text-sm font-medium leading-relaxed text-foreground">
                Headphones are essential. Each ear must receive a separate tone for the binaural effect to occur.
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

            <section id="affirmation-examples" className="scroll-mt-24 rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <h2 className="text-2xl font-semibold tracking-tight">Choosing Affirmations: What to Say</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                If you are not sure what to pick, start with present-tense <strong>"I am"</strong> statements that define who your ideal
                self is right now. You are choosing identity first, then behavior tends to follow.
              </p>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                As your subconscious accepts that new self-concept, your attention, reactions, and expectations shift. As that identity
                stabilizes, the world starts to mirror it back through new opportunities, different people, and different outcomes.
              </p>
              <div className="mt-4 rounded-xl border border-border/70 bg-background/60 p-4">
                <h3 className="text-lg font-semibold">Simple Rules</h3>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                  <li>Keep each line in present tense and start with "I am".</li>
                  <li>Describe identity, not just outcomes: who you are being.</li>
                  <li>Pick one theme and repeat it daily for at least 7 days before switching.</li>
                </ul>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {selfConceptAffirmationExamples.map((group) => (
                  <article key={group.id} className="rounded-xl border border-border/70 bg-background/60 p-4">
                    <h3 className="text-lg font-semibold">{group.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{group.description}</p>
                    <ul className="mt-3 space-y-2 text-sm leading-relaxed">
                      {group.examples.map((example) => (
                        <li key={example}>
                          <em>"{example}"</em>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
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
              <div className="mt-5 rounded-xl border border-indigo-300/40 bg-indigo-50/60 p-4 dark:border-indigo-500/30 dark:bg-indigo-950/20">
                <h3 className="text-lg font-semibold">How to Add Your Own Voice</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  If you want the self-reference benefits above, set up your voice clone once and reuse it across future tracks.
                </p>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                  {VOICE_CLONE_STEPS.map((step, index) => (
                    <li key={`affirmation-voice-clone-step-${index}`}>
                      {"text" in step ? (
                        step.text
                      ) : (
                        <>
                          {step.beforeLink}
                          <a
                            href={ELEVENLABS_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-700 underline decoration-indigo-400 underline-offset-2 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
                          >
                            {ELEVENLABS_LABEL}
                          </a>
                          {step.afterLink}
                        </>
                      )}
                    </li>
                  ))}
                </ol>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    href="/generate"
                    className="inline-flex h-9 items-center justify-center rounded-md bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                  >
                    Go to Generate
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    In Voice settings, click the <span className="font-semibold">+</span> button and choose{" "}
                    <span className="font-semibold">Add other voices...</span>
                  </p>
                </div>
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

            <section id="deeper-understanding" className="scroll-mt-24 rounded-2xl border border-violet-500/30 bg-violet-50/70 p-6 shadow-sm dark:border-violet-500/40 dark:bg-violet-950/20">
              <h2 className="text-2xl font-semibold tracking-tight">Deeper Understanding</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                On a deeper level, manifestation is the idea that consciousness is creative: your dominant beliefs and self-concept are not
                just private thoughts, but organizing principles that influence how life arranges itself around you.
              </p>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                In this view, your identity is a broadcast. The more natural it feels to say <strong>"I am this now,"</strong> the more your
                world mirrors that signal through different choices, different people, new opportunities, and different outcomes.
              </p>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                This does not mean forcing reality with effort alone. It means becoming internally consistent with the version of you that
                already has what you want. As inner consistency grows, the outer world often reshapes in ways that feel both surprising and
                strangely natural.
              </p>

              <div className="mt-5 rounded-xl border border-violet-300/40 bg-background/70 p-4">
                <h3 className="text-lg font-semibold">A Working Metaphysical Model</h3>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
                  <li>
                    <span className="font-semibold text-foreground">Conscious choice:</span> You deliberately choose a new identity in
                    present tense ("I am secure," "I am chosen," "I am supported").
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Subconscious acceptance:</span> Repetition plus feeling makes that
                    identity feel familiar instead of fictional.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Perceptual shift:</span> Your attention filters reality differently, so
                    you notice pathways that matched your old story less often.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">External reflection:</span> Circumstances and interactions begin
                    reflecting the new baseline through a chain of events that can look like coincidence.
                  </li>
                </ol>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <article className="rounded-xl border border-violet-300/40 bg-background/70 p-4">
                  <h3 className="text-lg font-semibold">Identity Is the Root Cause</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    If your core assumption is "I am unseen," you will unconsciously recreate evidence for it. When the assumption becomes
                    "I am deeply valued," you begin selecting and sustaining realities that confirm that truth instead.
                  </p>
                </article>
                <article className="rounded-xl border border-violet-300/40 bg-background/70 p-4">
                  <h3 className="text-lg font-semibold">Feeling Gives the Signal Power</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Words alone can stay on the surface. Emotional conviction, calm certainty, and sensory imagination help the subconscious
                    treat your statement as present reality, not future hope.
                  </p>
                </article>
                <article className="rounded-xl border border-violet-300/40 bg-background/70 p-4">
                  <h3 className="text-lg font-semibold">The Bridge Often Looks Ordinary</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Manifestation usually arrives through normal life events: a message at the right time, a changed decision, an unexpected
                    invitation, a sudden opening where there used to be none.
                  </p>
                </article>
                <article className="rounded-xl border border-violet-300/40 bg-background/70 p-4">
                  <h3 className="text-lg font-semibold">The World Responds to Consistency</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Single bursts of belief can inspire moments, but stable self-concept changes reality at depth. Repeated inner alignment
                    is what bends your outer world over time.
                  </p>
                </article>
              </div>

              <div className="mt-5 rounded-xl border border-violet-300/40 bg-background/70 p-4">
                <h3 className="text-lg font-semibold">How to Apply This Daily</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
                  <li>Pick 3-5 identity statements around one core theme and commit to them for 30 days before changing them.</li>
                  <li>Use it when your mind is relaxed: waking, pre-sleep, meditation, or after breathwork.</li>
                  <li>When old evidence appears, return to the new identity instead of arguing with circumstances.</li>
                  <li>Take aligned action from the new self-concept, even in small ways, and let momentum build.</li>
                </ul>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  The practice is simple: choose, feel, repeat, and persist until the new self-concept feels natural. Once that shift
                  stabilizes, reality often follows as a reflection rather than a struggle.
                </p>
              </div>
            </section>
          </article>
        </div>
      </main>
    </div>
  );
}
