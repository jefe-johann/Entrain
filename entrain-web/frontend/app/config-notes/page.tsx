import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/Header";

export default async function ConfigNotesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header credits={session.user.credits} isAdmin={session.user.isAdmin} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Affirmation Tips</h1>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. "I Am" (The First Person)</h2>
            <p className="font-semibold mb-2">The Theory:</p>
            <p className="mb-4">This aligns the affirmation with your own internal monologue. It is the gold standard for <strong>identity-level change</strong>.</p>

            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                <strong>The Research:</strong> Cognitive Behavioral Therapy (CBT) often uses "I" statements because they foster <strong>Self-Agency</strong>. When you say "I am," you are claiming a trait as part of your core identity.
              </li>
              <li>
                <strong>The Pro:</strong> It feels personal. There is no middleman; the message is coming <em>from</em> you.
              </li>
              <li>
                <strong>The Con (Psychological Reactance):</strong> If you have low self-esteem in a certain area, "I am" can trigger a "lie detector" response in the brain. If Jeff feels highly anxious and hears "I am calm," his subconscious might reject it immediately as a falsehood.
              </li>
              <li>
                <strong>Best for:</strong> Deep, long-term personality shifts and building self-worth.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. "You Are" (The Second Person)</h2>
            <p className="font-semibold mb-2">The Theory:</p>
            <p className="mb-4">This mimics the way we received information as children. We are socially conditioned to follow "You" instructions from parents, teachers, and coaches.</p>

            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                <strong>The Research:</strong> This taps into <strong>Authority Bias</strong>. Since birth, your brain has been "programmed" to accept "You are..." statements from external sources as facts (e.g., "You are a good boy," "You are doing a great job").
              </li>
              <li>
                <strong>The Pro:</strong> It bypasses the ego's "lie detector." It doesn't feel like you are lying to yourself; it feels like an external observer—or a mentor—is telling you the truth.
              </li>
              <li>
                <strong>The Con:</strong> It can feel "separate." You might believe the voice, but not fully integrate it into your own identity.
              </li>
              <li>
                <strong>Best for:</strong> Motivation, discipline, and performance. (e.g., "You are focused," "You are going to win.")
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. "Jeff Is" (The Third Person / Self-Distancing)</h2>
            <p className="font-semibold mb-2">The Theory:</p>
            <p className="mb-4">This is perhaps the most scientifically supported method for <strong>emotional regulation and stress</strong>.</p>

            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                <strong>The Research:</strong> <strong>Dr. Ethan Kross</strong> at the University of Michigan has done extensive research on <strong>"Self-Distancing."</strong> His studies show that when people talk to themselves in the third person (using their own name), they:
                <ol className="list-decimal pl-6 mt-2">
                  <li>Perform better under stress.</li>
                  <li>Have lower activation in the amygdala (the brain's fear center).</li>
                  <li>Regulate emotions more effectively.</li>
                </ol>
              </li>
              <li>
                <strong>The Pro:</strong> It creates "psychological distance." By saying "Jeff is confident," you are looking at yourself as a character or a project. This removes the "heat" of the emotion and allows you to analyze and change your behavior objectively.
              </li>
              <li>
                <strong>The Con:</strong> It can feel clinical or strange if you aren't used to it.
              </li>
              <li>
                <strong>Best for:</strong> Overcoming anxiety, social phobia, or breaking bad habits.
              </li>
            </ul>
          </section>

          <hr className="my-8" />

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Which should you use?</h2>
            <p className="mb-4">The most effective subliminal programs often use a <strong>layered approach</strong>. Here is how to decide based on your specific goal:</p>

            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-xl font-semibold mb-2">Scenario A: You want to change your identity (e.g., "I am a wealthy person")</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Use "I am."</strong> You want your brain to adopt this as its own internal truth.</li>
                  <li><em>Voice Tip:</em> Use your own voice or a voice very similar to yours.</li>
                </ul>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="text-xl font-semibold mb-2">Scenario B: You need to perform or be brave (e.g., "You are fearless")</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Use "You are."</strong> This acts like a coach in your ear during a workout or a high-stakes meeting.</li>
                  <li><em>Voice Tip:</em> Use a "Prestige" or authoritative voice (the accent you mentioned earlier).</li>
                </ul>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="text-xl font-semibold mb-2">Scenario C: You are trying to heal a trauma or stop a panic response (e.g., "Jeff is safe")</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Use "[Name] is."</strong> This calms the nervous system by making the problem feel like it's happening to "someone" you are taking care of, rather than your direct self.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8 bg-slate-100 dark:bg-slate-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">The "Triple-Threat" Formula</h3>
            <p className="mb-3">If you are making your own audio, many creators find the best results by <strong>stacking all three</strong> in the same track:</p>
            <ol className="list-decimal pl-6 mb-3">
              <li>"I am confident."</li>
              <li>"You are confident."</li>
              <li>"Jeff is confident."</li>
            </ol>
            <p><strong>Why this works:</strong> It attacks the belief from three different angles: your <strong>Identity</strong> (I), your <strong>Social Programming</strong> (You), and your <strong>Objective Observation</strong> (Name).</p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">One Final Thought on the Accent</h3>
            <p>If you use <strong>"You are"</strong> or <strong>"Jeff is"</strong> statements, an <strong>accented or authoritative voice</strong> can be very effective because it reinforces the "Mentor/Observer" role.</p>
            <p className="mt-3">However, if you use <strong>"I am"</strong> statements, it is usually better to use a voice that sounds <strong>as much like you as possible</strong> (or your own voice), because the brain needs to "own" that statement. Using a thick foreign accent to say "I am..." creates a cognitive mismatch—your brain knows <em>that</em> person is saying "I," not <em>you</em>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
