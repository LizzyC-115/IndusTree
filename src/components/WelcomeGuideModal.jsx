/* eslint-disable react/prop-types */
import { TreePine } from 'lucide-react';

const examplePosts = [
  {
    category: 'Internship Help',
    title: 'How should I prep for a PM coffee chat?',
    body: 'Give your goal, timeline, and what advice would help most.',
  },
  {
    category: 'Interview Debrief',
    title: 'What I learned from a SWE final round',
    body: 'Share patterns and takeaways, not private or leaked questions.',
  },
];

const rules = [
  'Be specific, kind, and useful.',
  'Keep posts career, school, internship, or industry related.',
  'Do not share private messages, confidential prompts, or personal info.',
  'No harassment, spam, gatekeeping, or putting people down.',
];

export default function WelcomeGuideModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-5 sm:p-8">
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-gradient-to-br from-rose-50 to-slate-50 px-8 py-7 sm:px-10 sm:py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500 shadow-lg shadow-rose-500/25">
              <TreePine className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-rose-500">Welcome to IndusTree</p>
              <h2 className="text-xl font-bold leading-tight text-slate-900 sm:text-2xl">
                Here is how the feed works.
              </h2>
            </div>
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600">
            Post with enough context for other students to help, and protect anything private.
          </p>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-8 py-7 sm:px-10 sm:py-8">
          <div className="grid gap-5 sm:grid-cols-2">
            {examplePosts.map((post) => (
              <div key={post.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-rose-500 shadow-sm">
                  {post.category}
                </span>
                <h3 className="mt-4 text-base font-bold leading-snug text-slate-900">{post.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{post.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-2xl border border-slate-100 p-6">
            <h3 className="text-base font-bold text-slate-900">Community rules</h3>
            <ul className="mt-5 space-y-4">
              {rules.map((rule) => (
                <li key={rule} className="flex gap-4 text-sm leading-7 text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-white px-8 py-6 sm:px-10">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-rose-500 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/25 transition-all hover:bg-rose-600 hover:shadow-rose-500/40"
          >
            Got it, take me to the feed
          </button>
        </div>
      </div>
    </div>
  );
}
