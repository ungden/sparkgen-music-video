import Link from "next/link";

const genres = [
  { name: "Pop", icon: "music_note", color: "bg-pink-500" },
  { name: "Rock", icon: "electric_bolt", color: "bg-red-500" },
  { name: "Hip-Hop", icon: "mic", color: "bg-purple-500" },
  { name: "Electronic", icon: "equalizer", color: "bg-cyan-500" },
  { name: "R&B", icon: "favorite", color: "bg-rose-500" },
  { name: "Country", icon: "landscape", color: "bg-yellow-500" },
  { name: "Jazz", icon: "piano", color: "bg-indigo-500" },
  { name: "Classical", icon: "symphony", color: "bg-slate-500" },
  { name: "Kids", icon: "child_care", color: "bg-amber-500" },
  { name: "Latin", icon: "nightlife", color: "bg-orange-500" },
  { name: "Indie", icon: "headphones", color: "bg-teal-500" },
];

const steps = [
  {
    num: "01",
    icon: "lightbulb",
    title: "Choose Genre & Theme",
    desc: "Pick from 11 music genres. AI generates 4 unique theme ideas tailored to your style, or write your own prompt.",
    color: "from-blue-500 to-blue-600",
  },
  {
    num: "02",
    icon: "lyrics",
    title: "AI Writes Lyrics",
    desc: "Genre-aware AI songwriter crafts catchy lyrics with the right feel — from kids' rhymes to hip-hop bars to rock anthems.",
    color: "from-violet-500 to-purple-600",
  },
  {
    num: "03",
    icon: "image",
    title: "Storyboard & Visuals",
    desc: "AI creates a unique character, picks a visual style matching your genre, and generates stunning illustrations for each scene.",
    color: "from-amber-500 to-orange-500",
  },
  {
    num: "04",
    icon: "movie",
    title: "Animation & Music",
    desc: "Veo AI animates your scenes into video clips. Lyria AI composes a full 2-minute soundtrack with vocals matching your genre.",
    color: "from-emerald-500 to-green-600",
  },
  {
    num: "05",
    icon: "download",
    title: "Render & Download",
    desc: "FFmpeg composites all clips with music and subtitles into a final MP4. Download your complete music video.",
    color: "from-rose-500 to-red-600",
  },
];

const stats = [
  { value: "11", label: "Music Genres" },
  { value: "~$3", label: "Per Video" },
  { value: "8+", label: "Scenes / Video" },
  { value: "2 min", label: "Full Song Length" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-container-high">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg filled">auto_awesome</span>
            </div>
            <span className="text-xl font-black text-blue-600 tracking-tight">SparkGen AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/film" className="px-5 py-2 font-bold text-sm text-violet-600 hover:text-violet-800 transition-colors hidden sm:block">
              Film Studio
            </Link>
            <Link href="/login" className="px-5 py-2 font-bold text-sm text-on-surface-variant hover:text-primary transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link href="/login" className="px-6 py-2.5 font-bold text-sm bg-primary text-white rounded-full hover:opacity-90 transition-all shadow-lg shadow-primary/20">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-8 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-amber-400/8 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Powered by Gemini + Veo + Lyria</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-5">
            Turn Any Idea Into a
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-amber-500 bg-clip-text text-transparent">
              Music Video
            </span>
          </h1>

          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto mb-8 leading-relaxed">
            Choose a genre, describe your vision. AI writes lyrics, creates visuals,
            animates scenes, composes music, and renders a complete video &mdash; in minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
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

          {/* Genre Pills */}
          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            {genres.map((g) => (
              <span
                key={g.name}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-surface-container-high rounded-full text-sm font-bold text-on-surface-variant shadow-sm hover:shadow-md hover:scale-105 transition-all cursor-default"
              >
                <span className={`w-5 h-5 rounded-full ${g.color} flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-white text-[11px]">{g.icon}</span>
                </span>
                {g.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-10 mt-12 bg-gradient-to-r from-primary to-blue-500">
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
      <section id="how-it-works" className="py-24 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-black text-primary uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Five Steps to Your
              <span className="text-primary"> Music Video</span>
            </h2>
            <p className="text-on-surface-variant text-lg mt-4 max-w-2xl mx-auto">
              From blank canvas to finished MP4 &mdash; all AI-powered, all automatic.
            </p>
          </div>

          <div className="space-y-6">
            {steps.map((step) => (
              <div key={step.num} className="flex gap-6 items-start bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-shadow">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg shrink-0`}>
                  <span className="material-symbols-outlined text-white text-2xl filled">{step.icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-black text-on-surface-variant/40 uppercase tracking-widest">Step {step.num}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-on-surface mb-2">{step.title}</h3>
                  <p className="text-on-surface-variant leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Models Section */}
      <section className="py-20 px-4 md:px-6 bg-surface-container-low">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm font-black text-tertiary uppercase tracking-widest mb-3">Powered By</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-12">
            Google&apos;s Most Advanced AI
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "edit_note", color: "bg-blue-100", iconColor: "text-blue-600", title: "Gemini 3.1 Pro", desc: "Ideas, lyrics, scene planning, and character design with genre-aware creative writing" },
              { icon: "videocam", color: "bg-green-100", iconColor: "text-green-600", title: "Veo 3.1 Lite", desc: "Image-to-video animation at 720p with 6-second clips. Cost-optimized for volume." },
              { icon: "music_note", color: "bg-amber-100", iconColor: "text-amber-600", title: "Lyria 3 Pro", desc: "Full 2-minute songs with vocals, genre-matched instruments, and AI-composed melodies" },
            ].map((model) => (
              <div key={model.title} className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
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

      {/* Film Studio Promo */}
      <section className="py-20 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full mb-4">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider">New Feature</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Animated Short Films</h2>
                <p className="text-violet-100 text-lg leading-relaxed mb-6">
                  Create AI-powered animated short films with narration. Pick a style, AI writes the script,
                  generates visuals, animates scenes, and adds voice narration &mdash; all automatically.
                </p>
                <div className="flex flex-wrap gap-3 mb-6">
                  {["Adventure", "Fairy Tale", "Sci-Fi", "Comedy", "Mystery", "Documentary"].map((s) => (
                    <span key={s} className="px-3 py-1 bg-white/10 rounded-full text-sm font-bold">{s}</span>
                  ))}
                </div>
                <Link href="/film" className="inline-flex items-center gap-3 px-8 py-4 bg-white text-violet-700 font-black text-lg rounded-full hover:scale-105 transition-all active:scale-95 shadow-xl">
                  <span className="material-symbols-outlined filled">movie_filter</span>
                  Try Film Studio
                </Link>
              </div>
              <div className="flex-shrink-0 w-48 h-48 md:w-56 md:h-56 rounded-3xl bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-8xl text-white/40">movie_filter</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-4 md:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm font-black text-secondary uppercase tracking-widest mb-3">Transparent Pricing</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Pay Only for What You Create</h2>
          <p className="text-on-surface-variant text-lg mb-12">No subscriptions. No hidden fees. Just AI generation costs.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                tier: "Lite", price: "~$3", features: ["8 scenes, 6s clips", "720p Veo 3.1 Lite", "2-min Lyria Pro soundtrack", "Any genre"],
                style: "bg-surface-container-lowest border-2 border-surface-container-high text-on-surface",
                priceColor: "text-on-surface",
              },
              {
                tier: "Standard", price: "~$12", badge: "POPULAR",
                features: ["8 scenes, 6s clips", "1080p Veo 3.1", "2-min Lyria Pro soundtrack", "Character consistency"],
                style: "bg-gradient-to-b from-primary to-blue-600 text-white scale-105",
                priceColor: "text-white",
              },
              {
                tier: "Premium", price: "~$38", features: ["8 scenes, 8s clips", "4K Veo 3.1", "2-min Lyria Pro soundtrack", "Ultra quality images"],
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
      <section className="py-24 px-4 md:px-6 bg-gradient-to-br from-primary via-blue-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
            Ready to Make Your Video?
          </h2>
          <p className="text-lg md:text-xl text-blue-100 mb-10 leading-relaxed">
            Pop, Rock, Hip-Hop, Jazz, or anything in between &mdash;
            pick your genre and let AI handle the rest.
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
      <footer className="py-12 px-4 md:px-6 bg-on-background text-inverse-on-surface">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm filled">auto_awesome</span>
            </div>
            <span className="font-black text-white">SparkGen AI</span>
          </div>
          <p className="text-sm text-center">Built with Gemini 3.1, Veo 3.1, Lyria 3, Next.js, Supabase</p>
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
