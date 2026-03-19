"use client";

import React, { useEffect, useRef, useState } from "react";
import { useScroll, useTransform, useSpring, motion, AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import { Shield, Zap, Sparkles, Cpu, Layers, MousePointer2, ChevronDown } from "lucide-react";

const FRAME_COUNT = 4;
const SUBFOLDER_PATH = "/frames/";
const NAMING_CONVENTION = (index: number) => 
  `ezgif-frame-${String(index).padStart(3, "0")}.jpg`;

const CinematicScrollEngine = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isCriticalLoaded, setIsCriticalLoaded] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // 1. Initialize Lenis for smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  // 2. Progressive Loader Logic
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = new Array(FRAME_COUNT);
    let loadedCount = 0;

    const loadImage = (index: number): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = `${SUBFOLDER_PATH}${NAMING_CONVENTION(index + 1)}`;
        img.onload = () => {
          loadedImages[index] = img;
          loadedCount++;
          // Calculate progress based on total frames
          setLoadingProgress(Math.floor((loadedCount / FRAME_COUNT) * 100));
          resolve(img);
        };
        img.onerror = () => {
          console.error(`Failed to load image at index ${index}`);
          resolve(new Image()); // Resolve with empty image to avoid hanging
        };
      });
    };

    const loadSequence = async () => {
      // Stage 1: Load the first frame immediately
      await loadImage(0);
      setIsCriticalLoaded(true);

      // Stage 2: Load every 4th frame for quick interaction
      const stage2Indices = [];
      for (let i = 0; i < FRAME_COUNT; i += 4) {
        if (i !== 0) stage2Indices.push(i);
      }
      await Promise.all(stage2Indices.map(loadImage));

      // Stage 3: Load the full sequence in chunks
      const remainingIndices = [];
      for (let i = 0; i < FRAME_COUNT; i++) {
        if (!loadedImages[i]) remainingIndices.push(i);
      }

      const chunkSize = 20;
      for (let i = 0; i < remainingIndices.length; i += chunkSize) {
        const chunk = remainingIndices.slice(i, i + chunkSize);
        await Promise.all(chunk.map(loadImage));
        await new Promise(r => setTimeout(r, 30)); // Free the main thread
      }

      setImages([...loadedImages]);
    };

    loadSequence();
  }, []);

  // 3. Scroll & Mouse Tracking
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const frameIndexRaw = useTransform(scrollYProgress, [0, 1], [0, FRAME_COUNT - 1]);
  const frameIndex = useSpring(frameIndexRaw, {
    stiffness: 120,
    damping: 35,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ 
        x: (e.clientX / window.innerWidth) * 100, 
        y: (e.clientY / window.innerHeight) * 100 
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // 4. Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const idx = Math.floor(frameIndex.get());
      const img = images[idx];

      if (img && img.complete && img.width > 0) {
        const canvasAspectRatio = canvas.width / canvas.height;
        const imageAspectRatio = img.width / img.height;
        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasAspectRatio > imageAspectRatio) {
          drawWidth = canvas.width;
          drawHeight = canvas.width / imageAspectRatio;
          offsetX = 0;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          drawWidth = canvas.height * imageAspectRatio;
          drawHeight = canvas.height;
          offsetX = (canvas.width - drawWidth) / 2;
          offsetY = 0;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      }
      requestAnimationFrame(render);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    const animId = requestAnimationFrame(render);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, [images, frameIndex]);

  return (
    <div ref={containerRef} className="relative h-[1000vh] w-full bg-black">
      {/* 1. Fixed Background Layer */}
      <div className="fixed inset-0 z-0 h-screen w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="h-full w-full object-cover"
        />
        
        {/* Environmental Overlays */}
        <div className="absolute inset-0 z-10">
          {/* Filmic Noise */}
          <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay">
            <svg className="h-full w-full">
              <filter id="noise">
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
              </filter>
              <rect width="100%" height="100%" filter="url(#noise)" />
            </svg>
          </div>
          
          {/* Vignette */}
          <div 
            className="absolute inset-0 bg-[radial-gradient(circle_at_var(--x)_var(--y),transparent_0%,rgba(0,0,0,0.8)_100%)] transition-all duration-300"
            style={{ "--x": `${mousePos.x}%`, "--y": `${mousePos.y}%` } as any}
          />
          
          {/* Ambient Glows */}
          <motion.div 
            animate={{ opacity: [0.1, 0.15, 0.1], scale: [1, 1.2, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1/2 -left-1/2 h-full w-full bg-[radial-gradient(circle,rgba(59,130,246,0.15)_0%,transparent_70%)]"
          />
          <motion.div 
            animate={{ opacity: [0.05, 0.1, 0.05], scale: [1.2, 1, 1.2] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -bottom-1/2 -right-1/2 h-full w-full bg-[radial-gradient(circle,rgba(139,92,246,0.1)_0%,transparent_70%)]"
          />
        </div>
      </div>

      {/* 2. Scrolling Foreground Layer */}
      <div className="relative z-20 w-full">
        {/* Milestone Sections (Sticky tracking) */}
        <div className="sticky top-0 h-screen w-full flex items-center justify-center pointer-events-none overflow-hidden">
          <ContentSection progress={scrollYProgress} range={[0, 0.08, 0.15]} icon={<Sparkles className="w-8 h-8 text-blue-400" />} title="CINEMATIC" accent="EXPERIENCE" description="High-fidelity frame sequences rendered on a precision canvas engine." />
          <ContentSection progress={scrollYProgress} range={[0.2, 0.28, 0.35]} icon={<Zap className="w-8 h-8 text-yellow-400" />} title="ULTRA" accent="FLUID" description="Zero-latency frame switching powered by Framer Motion springs." isGlass={true} />
          <ContentSection progress={scrollYProgress} range={[0.4, 0.48, 0.55]} icon={<Cpu className="w-8 h-8 text-purple-400" />} title="SMART" accent="LOADING" description="3-Stage progressive asset delivery keeps the experience snappy." />
          <ContentSection progress={scrollYProgress} range={[0.6, 0.68, 0.75]} icon={<Layers className="w-8 h-8 text-green-400" />} title="LAYERED" accent="AESTHETICS" description="Filmic noise and radial vignettes create a premium atmospheric depth." isGlass={true} />
          <ContentSection progress={scrollYProgress} range={[0.8, 0.9, 0.98]} icon={<Shield className="w-8 h-8 text-red-400" />} title="READY FOR" accent="PRODUCTION" description="Built with Next.js 15 for world-class performance and scalability." />
        </div>

        {/* Technical Specs Page (Static scrolling content) */}
        <div className="relative z-30 w-full bg-black/60 backdrop-blur-sm border-t border-white/5 mt-[100vh]">
          <div className="mx-auto max-w-6xl px-6 py-40">
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} className="text-center mb-24">
              <h3 className="text-[10px] font-bold tracking-[0.5em] text-blue-500 uppercase mb-4">Under the hood</h3>
              <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter">TECHNICAL SPECS</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SpecCard title="Canvas Core" desc="60FPS frame delivery using low-level canvas API to bypass DOM reconciliation." />
              <SpecCard title="Motion Physics" desc="Dampened springs (stiffness: 120) ensure heavy, intentional scroll feel." />
              <SpecCard title="Progressive Loader" desc="Critical path loading allows interaction within 500ms of first byte." />
              <SpecCard title="Memory Pool" desc="Efficient image cache management with automated garbage collection cycles." />
              <SpecCard title="Atmospherics" desc="Dynamic noise filters and radial light tracking for environmental immersion." />
              <SpecCard title="Scale-Free Render" desc="Resolution-independent mapping ensures sharp visuals on 4K+ displays." />
            </div>
          </div>
          
          {/* Bottom CTA */}
          <div className="pb-32 text-center">
             <motion.button
              whileHover={{ scale: 1.05, letterSpacing: "0.2em" }}
              whileTap={{ scale: 0.95 }}
              className="group relative overflow-hidden rounded-full border border-white/20 bg-white/5 px-12 py-4 text-sm font-bold uppercase tracking-[0.3em] backdrop-blur-md transition-all hover:bg-white hover:text-black"
            >
              <span className="relative z-10 transition-colors duration-500">Initialize Prototype</span>
              <motion.div className="absolute inset-0 z-0 bg-blue-500 opacity-0 transition-opacity duration-500 group-hover:opacity-20" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* 3. Perpetual HUD */}
      <div className="fixed inset-0 z-40 pointer-events-none">
        {/* Shutter Loader */}
        <AnimatePresence>
          {!isCriticalLoaded && (
            <motion.div exit={{ opacity: 0, transition: { duration: 0.8 } }} className="absolute inset-0 z-50 flex items-center justify-center bg-black">
              <div className="flex flex-col items-center">
                <motion.h1 initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-6xl font-black tracking-widest text-white mb-8">BOOTING...</motion.h1>
                <div className="h-1 w-64 bg-white/10 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${loadingProgress}%` }} className="h-full bg-blue-500" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global UI */}
        <div className="absolute top-10 left-10 flex items-center gap-3 text-[10px] font-bold tracking-[0.4em] text-white/40 uppercase">
          <div className="h-px w-6 bg-white/20" />
          <span>Core_System_v1.0</span>
        </div>
        
        <div className="absolute bottom-10 right-10 flex flex-col items-end gap-2">
          <span className="text-[10px] font-bold tracking-widest text-white/20 uppercase">Sync Status</span>
          <div className="h-24 w-[1px] bg-white/10 relative">
            <motion.div style={{ height: useTransform(scrollYProgress, [0, 1], ["0%", "100%"]) }} className="absolute top-0 w-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
          </div>
        </div>
      </div>
    </div>
  );
};

const ContentSection = ({ progress, range, title, accent, description, icon, isGlass }: any) => {
  const opacity = useTransform(progress, range, [0, 1, 0]);
  const y = useTransform(progress, range, [100, 0, -100]);
  const blur = useTransform(progress, range, ["20px", "0px", "20px"]);
  const scale = useTransform(progress, range, [0.8, 1, 0.8]);

  return (
    <motion.div 
      style={{ opacity, y, filter: `blur(${blur})`, scale }}
      className="absolute flex flex-col items-center"
    >
      {isGlass ? (
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex flex-col items-center px-12 py-16 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl">
            <div className="mb-6">{icon}</div>
            <h2 className="text-5xl font-black tracking-tighter md:text-7xl uppercase text-center leading-[0.9]">
              {title} <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                {accent}
              </span>
            </h2>
            <p className="mt-6 max-w-sm text-base text-zinc-400 font-light tracking-wide text-center">
              {description}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8">{icon}</div>
          <h2 className="text-6xl font-black tracking-tighter md:text-9xl uppercase leading-[0.8] text-center">
            {title} <br />
            <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
              {accent}
            </span>
          </h2>
          <p className="mt-8 max-w-lg text-lg text-zinc-400 font-light tracking-wide text-center">
            {description}
          </p>
        </>
      )}
      
      {/* Interactive Micro-animation Background */}
      {!isGlass && (
        <div className="absolute -z-10 h-64 w-64 opacity-20 blur-3xl bg-blue-500/30 rounded-full animate-pulse" />
      )}
    </motion.div>
  );
};

const SpecCard = ({ title, desc }: { title: string, desc: string }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="group relative h-full rounded-2xl border border-white/5 bg-white/5 p-8 transition-colors hover:bg-white/10"
  >
    <h4 className="text-xl font-bold text-white mb-3 tracking-tight">{title}</h4>
    <p className="text-sm text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">
      {desc}
    </p>
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
       <div className={`h-1.5 w-1.5 rounded-full ${title.includes('Optimization') ? 'bg-blue-500' : 'bg-zinc-500'}`} />
    </div>
  </motion.div>
);

export default CinematicScrollEngine;
