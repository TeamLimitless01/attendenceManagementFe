import CinematicScrollEngine from "@/components/CinematicScrollEngine";

export default function Frames() {
  return (
    <main className="min-h-screen bg-black">
      <CinematicScrollEngine />
      
      {/* Optional: Footer or other sections below the engine */}
      <section className="relative z-40 bg-black py-32 px-6">
        <div className="mx-auto max-w-4xl border-t border-white/10 pt-16">
          <div className="grid gap-12 md:grid-cols-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Core Tech</h3>
              <p className="text-sm text-zinc-400">Next.js 15, Framer Motion, Lenis Scroll, HTML5 Canvas.</p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Performance</h3>
              <p className="text-sm text-zinc-400">3-Stage Progressive Loader with memory-efficient frame caching.</p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Aesthetics</h3>
              <p className="text-sm text-zinc-400">Filmic noise overlays, radial vignettes, and spring-interpolated physics.</p>
            </div>
          </div>
          <div className="mt-24 text-center">
            <p className="text-[10px] uppercase tracking-[0.5em] text-zinc-700">© 2026 ANTIGRAVITY SYSTEMS</p>
          </div>
        </div>
      </section>
    </main>
  );
}
