import Link from "next/link";

const features = [
  {
    step: "01",
    icon: "lightbulb",
    title: "Idea & Lyrics",
    desc: "Pick a theme or type your own. AI generates catchy, age-appropriate song lyrics with verses, chorus, and more.",
    color: "from-blue-500 to-blue-600",
  },
  {
    step: "02",
    icon: "image",
    title: "Storyboard & Images",
    desc: "AI breaks your song into cinematic scenes and generates stunning, consistent illustrations for each one.",
    color: "from-amber-500 to-orange-500",
  },
  {
    step: "03",
    icon: "movie",
    title: "Animation & Music",
    desc: "Transform still images into animated video clips with Veo AI. Generate a matching soundtrack with Lyria.",
    color: "from-emerald-500 to-green-600",
  },
  {
    step: "04",
    icon: "movie_edit",
    title: "Final Editor",
    desc: "Arrange scenes on a timeline, add transitions and effects, then render your complete music video.",
    color: "from-purple-500 to-violet-600",
  },
];

const stats = [
  { value: "30s", label: "Average generation time" },
  { value: "~$3", label: "Per video (budget mode)" },
  { value: "720p-4K", label: "Output resolution" },
  { value: "5+", label: "Scenes per video" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-container-high">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg filled">auto_awesome</span>
            </div>
            <span className="text-xl font-black text-blue-600 tracking-tight">SparkGen AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-5 py-2 font-bold text-sm text-on-surface-variant hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link href="/login" className="px-6 py-2.5 font-bold text-sm bg-primary text-white rounded-full hover:opacity-90 transition-all shadow-lg shadow-primary/20">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-green-400/5 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-full mb-8">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Powered by Google Gemini + Veo + Lyria</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            Create Kids Music Videos
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-amber-500 bg-clip-text text-transparent">
              with AI Magic
            </span>
          </h1>

          <p className="text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
            From idea to finished music video in minutes. AI generates lyrics, illustrations, animations, and soundtrack &mdash; all you do is pick a theme.
          </p>

          <div className="flex items-center justify-center gap-4 mb-16">
            <Link
              href="/login"
              className="px-10 py-4 bg-gradient-to-r from-primary to-blue-500 text-white font-black text-lg rounded-full shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
            >
              <span className="material-symbols-outlined filled">rocket_launch</span>
              Start Creating Free
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 font-bold text-on-surface-variant border-2 border-surface-container-high rounded-full hover:bg-surface-container-low transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined">play_circle</span>
              See How It Works
            </a>
          </div>

          {/* App Preview */}
          <div className="relative mx-auto max-w-4xl">
            <div className="bg-gradient-to-b from-surface-container-low to-surface-container rounded-2xl border-2 border-white shadow-2xl shadow-blue-900/10 p-2">
              <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
                {/* Fake app screenshot using UI elements */}
                <div className="flex">
                  {/* Mini sidebar */}
                  <div className="w-16 bg-blue-50 p-3 flex flex-col items-center gap-3 border-r border-surface-container">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-sm">auto_awesome</span>
                    </div>
                    <div className="w-8 h-2 rounded bg-blue-200" />
                    <div className="w-8 h-2 rounded bg-surface-container-high" />
                    <div className="w-8 h-2 rounded bg-surface-container-high" />
                  </div>
                  {/* Main content preview */}
                  <div className="flex-1 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-3 w-48 bg-blue-600/20 rounded" />
                      <div className="flex gap-2 ml-auto">
                        <div className="h-3 w-16 bg-surface-container-high rounded" />
                        <div className="h-3 w-20 bg-blue-600/30 rounded" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 h-40 rounded-xl bg-gradient-to-br from-blue-100 to-purple-50 flex items-center justify-center">
                        <div className="text-center">
                          <span className="material-symbols-outlined text-4xl text-blue-400 mb-2 block">movie_filter</span>
                          <div className="h-2 w-32 bg-blue-200 rounded mx-auto mb-1" />
                          <div className="h-2 w-24 bg-blue-100 rounded mx-auto" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-[74px] rounded-xl bg-amber-50 flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl text-amber-400">music_note</span>
                        </div>
                        <div className="h-[74px] rounded-xl bg-green-50 flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl text-green-400">image</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-10 bg-gradient-to-r from-primary to-blue-500">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center text-white">
              <p className="text-3xl font-black">{stat.value}</p>
              <p className="text-sm text-blue-100 font-medium mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-black text-primary uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Four Steps to a
              <span className="text-primary"> Music Video</span>
            </h2>
            <p className="text-on-surface-variant text-lg mt-4 max-w-2xl mx-auto">
              Our AI pipeline handles everything from songwriting to final video production.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature) => (
              <div
                key={feature.step}
                className="group relative bg-surface-container-lowest rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-surface-container-high/50"
              >
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-white text-2xl filled">{feature.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-black text-on-surface-variant/40 uppercase tracking-widest">Step {feature.step}</span>
                    </div>
                    <h3 className="text-xl font-black text-on-surface mb-2">{feature.title}</h3>
                    <p className="text-on-surface-variant leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Models Section */}
      <section className="py-20 px-6 bg-surface-container-low">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm font-black text-tertiary uppercase tracking-widest mb-3">Powered By</p>
          <h2 className="text-4xl font-black tracking-tight mb-12">
            Google&apos;s Most Advanced AI
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-blue-600 text-2xl">edit_note</span>
              </div>
              <h3 className="font-black text-lg mb-2">Gemini 2.5 Flash</h3>
              <p className="text-sm text-on-surface-variant">Lyrics generation, scene planning, creative writing with streaming output</p>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-green-600 text-2xl">videocam</span>
              </div>
              <h3 className="font-black text-lg mb-2">Veo 3.1</h3>
              <p className="text-sm text-on-surface-variant">Image-to-video animation at 720p/1080p/4K with 6-8 second clips</p>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-amber-600 text-2xl">music_note</span>
              </div>
              <h3 className="font-black text-lg mb-2">Lyria 3</h3>
              <p className="text-sm text-on-surface-variant">AI music composition with vocals, matching your lyrics perfectly</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm font-black text-secondary uppercase tracking-widest mb-3">Transparent Pricing</p>
          <h2 className="text-4xl font-black tracking-tight mb-4">Pay Only for What You Create</h2>
          <p className="text-on-surface-variant text-lg mb-12">No subscriptions. No hidden fees. Just AI generation costs.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-surface-container-lowest rounded-2xl p-8 border-2 border-surface-container-high shadow-sm">
              <div className="text-sm font-black text-on-surface-variant uppercase tracking-wider mb-2">Budget</div>
              <div className="text-4xl font-black text-on-surface mb-1">~$3</div>
              <div className="text-sm text-on-surface-variant mb-6">per music video</div>
              <ul className="text-left space-y-3 text-sm">
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-lg filled">check_circle</span> 5 scenes, 4s clips</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-lg filled">check_circle</span> 720p Fast render</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-lg filled">check_circle</span> 30s AI soundtrack</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-lg filled">check_circle</span> AI lyrics + images</li>
              </ul>
            </div>

            <div className="bg-gradient-to-b from-primary to-blue-600 rounded-2xl p-8 text-white shadow-xl shadow-primary/20 relative scale-105">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-secondary-container text-on-secondary-container text-xs font-black rounded-full">POPULAR</div>
              <div className="text-sm font-black text-blue-200 uppercase tracking-wider mb-2">Standard</div>
              <div className="text-4xl font-black mb-1">~$12</div>
              <div className="text-sm text-blue-200 mb-6">per music video</div>
              <ul className="text-left space-y-3 text-sm">
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-lg filled">check_circle</span> 5 scenes, 6s clips</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-lg filled">check_circle</span> 1080p Standard</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-lg filled">check_circle</span> 30s AI soundtrack</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-lg filled">check_circle</span> AI lyrics + images</li>
              </ul>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-8 border-2 border-surface-container-high shadow-sm">
              <div className="text-sm font-black text-on-surface-variant uppercase tracking-wider mb-2">Premium</div>
              <div className="text-4xl font-black text-on-surface mb-1">~$38</div>
              <div className="text-sm text-on-surface-variant mb-6">per music video</div>
              <ul className="text-left space-y-3 text-sm">
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-lg filled">check_circle</span> 8 scenes, 8s clips</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-lg filled">check_circle</span> 4K Standard</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-lg filled">check_circle</span> 2min Pro soundtrack</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-lg filled">check_circle</span> Ultra quality images</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-primary via-blue-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            Ready to Make Magic?
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            Join creators and educators who are already making AI-powered music videos for kids.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-3 px-12 py-5 bg-white text-primary font-black text-lg rounded-full shadow-2xl hover:scale-105 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined filled">rocket_launch</span>
            Create Your First Video
          </Link>
          <p className="text-sm text-blue-200 mt-6">No credit card required. Start with Google AI free tier.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-on-background text-inverse-on-surface">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm filled">auto_awesome</span>
            </div>
            <span className="font-black text-white">SparkGen AI</span>
          </div>
          <p className="text-sm text-center">Built with Google Gemini, Veo 3.1, Lyria 3, Next.js, Supabase</p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <span className="opacity-30">|</span>
            <Link href="/login" className="hover:text-white transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
