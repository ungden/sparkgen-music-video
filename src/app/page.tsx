import Link from "next/link";

const features = [
  {
    step: "01",
    icon: "lightbulb",
    title: "Idea & Lyrics",
    desc: "Pick a genre and theme. AI generates catchy song lyrics with verses, chorus, and more — for any style.",
    color: "from-blue-500 to-blue-600",
    screenshot: "/screenshots/step1-idea-lyrics.png",
  },
  {
    step: "02",
    icon: "image",
    title: "Storyboard & Images",
    desc: "AI breaks your song into cinematic scenes and generates stunning, consistent illustrations for each one.",
    color: "from-amber-500 to-orange-500",
    screenshot: "/screenshots/step2-storyboard.png",
  },
  {
    step: "03",
    icon: "movie",
    title: "Animation & Music",
    desc: "Transform still images into animated video clips with Veo AI. Generate a matching soundtrack with Lyria.",
    color: "from-emerald-500 to-green-600",
    screenshot: "/screenshots/step3-animation.png",
  },
  {
    step: "04",
    icon: "movie_edit",
    title: "Final Editor",
    desc: "Arrange scenes on a timeline, add transitions and effects, then render your complete music video.",
    color: "from-purple-500 to-violet-600",
    screenshot: "/screenshots/step3-animation.png",
  },
];

const stats = [
  { value: "~5 min", label: "Full video creation" },
  { value: "~$3", label: "Per video (budget mode)" },
  { value: "11", label: "Music genres supported" },
  { value: "8+", label: "Scenes per video" },
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
      <section className="pt-28 pb-8 px-6 relative overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Powered by Google Gemini + Veo + Lyria</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-5">
            Create Music Videos
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-amber-500 bg-clip-text text-transparent">
              with AI Magic
            </span>
          </h1>

          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto mb-8 leading-relaxed">
            From idea to finished music video in minutes. AI generates lyrics, illustrations, animations, and soundtrack &mdash; all you do is pick a theme.
          </p>

          <div className="flex items-center justify-center gap-4 mb-12">
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

          {/* Hero Screenshot - Dashboard */}
          <div className="relative mx-auto max-w-5xl">
            <div className="bg-gradient-to-b from-surface-container-low to-surface-container rounded-2xl border border-white/80 shadow-2xl shadow-blue-900/15 p-1.5 overflow-hidden">
              <img
                src="/screenshots/dashboard-overview.png"
                alt="SparkGen AI Dashboard - My Studio"
                className="w-full rounded-xl"
              />
            </div>
            {/* Floating badges */}
            <div className="absolute -left-4 top-1/4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-surface-container-high">
              <div className="w-10 h-10 rounded-xl bg-tertiary-container flex items-center justify-center">
                <span className="material-symbols-outlined filled text-tertiary">auto_awesome</span>
              </div>
              <div>
                <p className="font-black text-sm text-on-surface">AI Generated</p>
                <p className="text-xs text-on-surface-variant">Lyrics + Images + Video</p>
              </div>
            </div>
            <div className="absolute -right-4 top-1/3 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-surface-container-high">
              <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined filled text-secondary">speed</span>
              </div>
              <div>
                <p className="font-black text-sm text-on-surface">Under 5 min</p>
                <p className="text-xs text-on-surface-variant">Full MV creation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-10 mt-8 bg-gradient-to-r from-primary to-blue-500">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center text-white">
              <p className="text-3xl font-black">{stat.value}</p>
              <p className="text-sm text-blue-100 font-medium mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works - with screenshots */}
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

          {/* Feature blocks with alternating layout */}
          <div className="space-y-20">
            {features.map((feature, i) => (
              <div
                key={feature.step}
                className={`flex flex-col ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-10`}
              >
                {/* Text */}
                <div className="flex-1 max-w-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                      <span className="material-symbols-outlined text-white text-xl filled">{feature.icon}</span>
                    </div>
                    <span className="text-xs font-black text-on-surface-variant/40 uppercase tracking-widest">Step {feature.step}</span>
                  </div>
                  <h3 className="text-3xl font-black text-on-surface mb-3">{feature.title}</h3>
                  <p className="text-on-surface-variant text-lg leading-relaxed">{feature.desc}</p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 mt-6 font-bold text-primary hover:underline"
                  >
                    Try it now
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
                {/* Screenshot */}
                <div className="flex-1">
                  <div className="bg-gradient-to-b from-surface-container-low to-surface-container rounded-2xl border border-white/80 shadow-xl p-1.5 overflow-hidden">
                    <img
                      src={feature.screenshot}
                      alt={`Step ${feature.step}: ${feature.title}`}
                      className="w-full rounded-xl"
                    />
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
            {[
              { icon: "edit_note", color: "bg-blue-100", iconColor: "text-blue-600", title: "Gemini 2.5 Flash", desc: "Lyrics generation, scene planning, creative writing with streaming output" },
              { icon: "videocam", color: "bg-green-100", iconColor: "text-green-600", title: "Veo 3.1", desc: "Image-to-video animation at 720p/1080p/4K with 6-8 second clips" },
              { icon: "music_note", color: "bg-amber-100", iconColor: "text-amber-600", title: "Lyria 3", desc: "AI music composition with vocals, matching your lyrics perfectly" },
            ].map((model) => (
              <div key={model.title} className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm">
                <div className={`w-12 h-12 rounded-xl ${model.color} flex items-center justify-center mx-auto mb-4`}>
                  <span className={`material-symbols-outlined ${model.iconColor} text-2xl`}>{model.icon}</span>
                </div>
                <h3 className="font-black text-lg mb-2">{model.title}</h3>
                <p className="text-sm text-on-surface-variant">{model.desc}</p>
              </div>
            ))}
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
            {[
              {
                tier: "Budget", price: "~$3", features: ["5 scenes, 4s clips", "720p Fast render", "30s AI soundtrack", "AI lyrics + images"],
                style: "bg-surface-container-lowest border-2 border-surface-container-high text-on-surface",
                priceColor: "text-on-surface",
              },
              {
                tier: "Standard", price: "~$12", badge: "POPULAR",
                features: ["5 scenes, 6s clips", "1080p Standard", "30s AI soundtrack", "AI lyrics + images"],
                style: "bg-gradient-to-b from-primary to-blue-600 text-white scale-105",
                priceColor: "text-white",
              },
              {
                tier: "Premium", price: "~$38", features: ["8 scenes, 8s clips", "4K Standard", "2min Pro soundtrack", "Ultra quality images"],
                style: "bg-surface-container-lowest border-2 border-surface-container-high text-on-surface",
                priceColor: "text-on-surface",
              },
            ].map((plan) => (
              <div key={plan.tier} className={`rounded-2xl p-8 shadow-sm relative ${plan.style}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-secondary-container text-on-secondary-container text-xs font-black rounded-full">
                    {plan.badge}
                  </div>
                )}
                <div className="text-sm font-black uppercase tracking-wider mb-2 opacity-70">{plan.tier}</div>
                <div className={`text-4xl font-black mb-1 ${plan.priceColor}`}>{plan.price}</div>
                <div className="text-sm mb-6 opacity-70">per music video</div>
                <ul className="text-left space-y-3 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg filled">check_circle</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
            Join creators who are already making AI-powered music videos for any genre.
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
