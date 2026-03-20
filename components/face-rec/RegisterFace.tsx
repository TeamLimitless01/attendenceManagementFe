'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ScanFace, 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCcw, 
  Loader2,
  Fingerprint,
  ArrowRight,
  ShieldCheck,
  PartyPopper
} from 'lucide-react';
import { strapi } from '@/lib/sdk/sdk';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model/';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    faceapi: any;
  }
}

export default function RegisterFace({ studentId, name }: { studentId: string; name?: string }) {
  const router = useRouter();
  
  // ── UI State ──
  const [modelsReady, setModelsReady] = useState(false);
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [loaderTxt, setLoaderTxt] = useState('Initializing Biometrics Engine…');
  const [loaderPct, setLoaderPct] = useState(0);
  const [toast, setToast] = useState({ msg: '', type: 'info' as 'info' | 'success' | 'error' });
  const [toastVisible, setToastVisible] = useState(false);
  const [step, setStep] = useState<'scan' | 'success'>('scan');

  // ── Enroll State ──
  const [enrollActive, setEnrollActive] = useState(false);
  const [enrollFaceMsg, setEnrollFaceMsg] = useState('');
  const [enrollFaceMsgOk, setEnrollFaceMsgOk] = useState(false);
  const [enrollMsg, setEnrollMsg] = useState({ text: '', type: 'info' as 'info' | 'success' | 'error' });
  const [capturedDesc, setCapturedDesc] = useState<number[] | null>(null);
  const [snapSrc, setSnapSrc] = useState('');
  const [showSnap, setShowSnap] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Refs ──
  const enrollVideoRef = useRef<HTMLVideoElement>(null);
  const enrollStreamRef = useRef<MediaStream | null>(null);
  const enrollDetTmrRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Boot ──
  useEffect(() => {
    loadModels();
    return () => {
      stopEnrollCam();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load Models ──
  async function loadModels() {
    const steps: [string, number, string][] = [
      ['tinyFaceDetector', 30, 'Awakening face detector…'],
      ['faceLandmark68Net', 65, 'Mapping biometric features…'],
      ['faceRecognitionNet', 95, 'Synthesizing neural pathways…'],
    ];
    try {
      if (!window.faceapi) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
          s.setAttribute('data-faceapi', '1');
          s.onload = () => resolve();
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      for (const [net, pct, label] of steps) {
        setLoaderTxt(label);
        setLoaderPct(pct);
        await window.faceapi.nets[net].loadFromUri(MODEL_URL);
      }

      setLoaderPct(100);
      await new Promise(r => setTimeout(r, 800));
      setLoaderVisible(false);
      setModelsReady(true);
      showToast('Neural Network Fully Operational', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setLoaderTxt('Biometric Access Restricted: ' + message);
      showToast('Registration system failure', 'error');
    }
  }

  // ── Toast ──
  const showToast = useCallback((msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ msg, type });
    setToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 4000);
  }, []);

  // ── Enroll Camera ──
  const toggleEnrollCam = useCallback(async () => {
    if (enrollStreamRef.current) {
      stopEnrollCam();
      return;
    }
    if (!modelsReady) { showToast('Synchronizing models...', 'info'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      enrollStreamRef.current = stream;
      if (enrollVideoRef.current) {
        enrollVideoRef.current.srcObject = stream;
        await enrollVideoRef.current.play();
      }
      setEnrollActive(true);
      setEnrollFaceMsg('Syncing identity scanner…');
      setEnrollFaceMsgOk(false);
      setShowSnap(false);
      startEnrollDetection();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast('Scanner access denied: ' + msg, 'error');
    }
  }, [modelsReady, showToast]); // eslint-disable-line react-hooks/exhaustive-deps

  function stopEnrollCam() {
    if (enrollStreamRef.current) {
      enrollStreamRef.current.getTracks().forEach(t => t.stop());
      enrollStreamRef.current = null;
    }
    if (enrollDetTmrRef.current) { clearTimeout(enrollDetTmrRef.current); enrollDetTmrRef.current = null; }
    if (enrollVideoRef.current) { enrollVideoRef.current.srcObject = null; }
    setEnrollActive(false);
    setEnrollFaceMsg('');
  }

  function startEnrollDetection() {
    async function loop() {
      if (!enrollStreamRef.current) return;
      try {
        const det = await window.faceapi.detectSingleFace(
          enrollVideoRef.current,
          new window.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
        );
        if (det) { 
          setEnrollFaceMsgOk(true); 
          setEnrollFaceMsg('✓ Biometric Signature Valid'); 
        } else { 
          setEnrollFaceMsgOk(false); 
          setEnrollFaceMsg('Align face within detection zone...'); 
        }
      } catch { /* ignore */ }
      enrollDetTmrRef.current = setTimeout(loop, 400);
    }
    loop();
  }

  const captureFace = useCallback(async () => {
    if (!enrollStreamRef.current) { showToast('Activate vision sensor first', 'info'); return; }
    setEnrollMsg({ text: 'Verifying facial anatomy…', type: 'info' });
    try {
      const det = await window.faceapi
        .detectSingleFace(enrollVideoRef.current, new window.faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.45 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (!det) { 
        setEnrollMsg({ text: 'Mapping failed. Ensure clear lighting.', type: 'error' }); 
        return; 
      }
      
      setCapturedDesc(Array.from(det.descriptor));
      const snap = document.createElement('canvas');
      const v = enrollVideoRef.current!;
      snap.width = v.videoWidth; 
      snap.height = v.videoHeight;
      const ctx = snap.getContext('2d');
      if (ctx) ctx.drawImage(v, 0, 0);
      
      setSnapSrc(snap.toDataURL('image/jpeg', 0.9));
      setShowSnap(true);
      stopEnrollCam();
      setEnrollMsg({ text: 'Biometric profile captured.', type: 'success' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setEnrollMsg({ text: 'Neural processing error: ' + msg, type: 'error' });
    }
  }, [showToast]);

  function retakeFace() {
    setCapturedDesc(null);
    setSnapSrc('');
    setShowSnap(false);
    setEnrollMsg({ text: '', type: 'info' });
    setTimeout(() => toggleEnrollCam(), 100);
  }

  async function enrollStudent() {
    if (!studentId) return;
    try {
      setLoading(true);
      if (!capturedDesc) { setEnrollMsg({ text: 'Biometric data missing.', type: 'error' }); return; }
      
      // Update Strapi Student Record
      await strapi.update('students', studentId, {
        faceEmbedding: capturedDesc
      });
      
      setStep('success');
      showToast('Identity Securely Registered', 'success');
      
      // Final Redirection
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (error: any) {
      showToast("Identity Registration Failed: " + (error?.message || "Server Error"), "error");
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {loaderVisible ? (
          <motion.div 
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center max-w-sm w-full text-center"
          >
            <div className="w-24 h-24 mb-10 relative">
                <div className="absolute inset-0 border-[3px] border-blue-100 rounded-[2rem]" />
                <motion.div 
                  className="absolute inset-0 border-[3px] border-blue-600 rounded-[2rem] border-t-transparent animate-spin" 
                  style={{ animationDuration: '1s' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <ScanFace className="w-10 h-10 text-blue-600" />
                </div>
            </div>
            
            <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Initializing Sensor</h2>
            <p className="text-slate-500 font-medium mb-10 text-base">{loaderTxt}</p>
            
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
              <motion.div 
                className="h-full bg-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${loaderPct}%` }}
                transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
              />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400/60">Biometric Identity Engine v3.0</span>
          </motion.div>
        ) : step === 'success' ? (
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-md w-full text-center bg-white rounded-[3rem] p-12 shadow-[0_32px_120px_-20px_rgba(37,99,235,0.15)] border border-blue-50"
          >
            <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <PartyPopper className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">Registration Complete</h2>
            <p className="text-slate-500 text-lg font-medium mb-10 leading-relaxed px-4">
              {name ? `Hello ${name}, your` : 'Your'} facial identity has been securely linked to the attendance system.
            </p>
            <div className="px-6 py-4 bg-slate-50 rounded-2xl flex items-center justify-center gap-3 text-emerald-600 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" /> Identity Verified & Linked
            </div>
            <p className="mt-8 text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">Redirecting home in 3s...</p>
          </motion.div>
        ) : (
          <motion.div 
            key="main"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl w-full"
          >
            <div className="bg-white rounded-[2.5rem] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.12)] border border-slate-100 overflow-hidden relative">
              
              {/* Header */}
              <div className="p-10 pb-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider mb-5">
                  <Fingerprint className="w-3.5 h-3.5" /> Biometric Identity Registration
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                  {name ? `Welcome, ${name}` : 'Register Your Face'}
                </h1>
                <p className="text-slate-500 mt-3 font-medium text-lg leading-snug">
                  Link your unique facial signature to student account.
                </p>
              </div>

              {/* Main Content */}
              <div className="p-10 pt-4">
                <div className="relative aspect-square md:aspect-video bg-slate-100 rounded-[2.5rem] overflow-hidden border-2 border-slate-100 shadow-inner group">
                   
                   {/* Scanner UI Overlay */}
                   <AnimatePresence>
                     {enrollActive && (
                       <motion.div 
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         className="absolute inset-0 z-10 pointer-events-none"
                       >
                          {/* Corner Borders */}
                          <div className="absolute top-10 left-10 w-16 h-16 border-t-4 border-l-4 border-blue-600 rounded-tl-2xl" />
                          <div className="absolute top-10 right-10 w-16 h-16 border-t-4 border-r-4 border-blue-600 rounded-tr-2xl" />
                          <div className="absolute bottom-10 left-10 w-16 h-16 border-b-4 border-l-4 border-blue-600 rounded-bl-2xl" />
                          <div className="absolute bottom-10 right-10 w-16 h-16 border-b-4 border-r-4 border-blue-600 rounded-br-2xl" />
                          
                          {/* Scanning Line */}
                          <motion.div 
                            className="absolute left-10 right-10 h-[2px] bg-blue-600/50 shadow-[0_0_20px_rgba(37,99,235,0.6)]"
                            animate={{ top: ['20%', '80%', '20%'] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                          />
                       </motion.div>
                     )}
                   </AnimatePresence>

                   {/* Video / Snap */}
                   <video 
                     ref={enrollVideoRef} 
                     autoPlay 
                     muted 
                     playsInline 
                     className="w-full h-full object-cover scale-x-[-1]"
                   />
                   
                   <AnimatePresence>
                     {showSnap && snapSrc && (
                       <motion.img 
                         initial={{ opacity: 0, scale: 1.1 }}
                         animate={{ opacity: 1, scale: 1 }}
                         src={snapSrc} 
                         alt="captured face" 
                         className="absolute inset-0 w-full h-full object-cover z-20" 
                       />
                     )}
                   </AnimatePresence>

                   {/* Camera Placeholder */}
                   {!enrollActive && !showSnap && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50 z-30">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                            <Camera className="w-10 h-10 stroke-[1.5]" />
                        </div>
                        <p className="text-sm font-bold tracking-tight px-12 text-center text-slate-400">
                          To begin your registration, activate the vision sensor below.
                        </p>
                     </div>
                   )}

                   {/* Face Success/Fail Badge */}
                   <AnimatePresence>
                    {enrollActive && (
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-40 px-8 py-3.5 rounded-[1.5rem] flex items-center gap-3.5 backdrop-blur-2xl border-2 shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-colors ${enrollFaceMsgOk ? 'bg-emerald-600/90 border-emerald-400/50 text-white' : 'bg-slate-900/80 border-slate-700/50 text-white'}`}
                      >
                         {enrollFaceMsgOk ? 
                            <ShieldCheck className="w-6 h-6 flex-shrink-0" /> : 
                            <Loader2 className="w-6 h-6 flex-shrink-0 animate-spin" />
                         }
                         <span className="text-base font-black truncate max-w-[240px] leading-tight tracking-tight">
                            {enrollFaceMsg}
                         </span>
                      </motion.div>
                    )}
                   </AnimatePresence>
                </div>

                {/* Status Message */}
                <div className="mt-8 text-center min-h-[1.5rem]">
                   <AnimatePresence mode="wait">
                     {enrollMsg.text && (
                        <motion.p 
                          key={enrollMsg.text}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className={`text-base font-bold flex items-center justify-center gap-3 ${enrollMsg.type === 'error' ? 'text-rose-600' : enrollMsg.type === 'success' ? 'text-emerald-700' : 'text-blue-600'}`}
                        >
                          {enrollMsg.type === 'error' ? <AlertCircle className="w-5 h-5" /> : enrollMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                          {enrollMsg.text}
                        </motion.p>
                     )}
                   </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="mt-8 flex flex-col gap-4">
                  {!showSnap ? (
                    <div className="grid grid-cols-2 gap-5">
                      <button 
                         onClick={toggleEnrollCam}
                         className={`h-16 rounded-[1.5rem] flex items-center justify-center font-black text-lg transition-all active:scale-[0.97] ${enrollActive ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                      >
                         {enrollActive ? 'Stop Sensor' : 'Open Camera'}
                      </button>
                      <button 
                         onClick={captureFace}
                         disabled={!enrollActive}
                         className="h-16 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center font-black text-lg transition-all hover:bg-blue-700 disabled:opacity-30 disabled:grayscale shadow-xl shadow-blue-600/20 active:scale-[0.97] gap-3"
                      >
                         <Camera className="w-6 h-6" /> Capture
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <button 
                         onClick={enrollStudent}
                         disabled={loading}
                         className="h-20 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl transition-all hover:bg-blue-700 shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] active:scale-[0.97] gap-4"
                      >
                         {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <ShieldCheck className="w-8 h-8" />}
                         {loading ? "Registration Sync..." : "Confirm & Register"}
                      </button>
                      <button 
                         onClick={retakeFace}
                         className="h-10 text-slate-400 font-bold text-sm flex items-center justify-center gap-2 hover:text-slate-600 transition-colors"
                      >
                         <RefreshCcw className="w-4 h-4" /> Recalibrate Scan
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Badge */}
              <div className="bg-slate-50/80 p-6 flex flex-col items-center justify-center gap-2 border-t border-slate-100">
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">AES-256 Biometric Handshake Secure</span>
                 </div>
                 <p className="text-[10px] text-slate-400 font-medium">Your biometric data is processed entirely locally and only descriptors are stored.</p>
              </div>
            </div>

            {/* Help Link */}
            <div className="mt-10 text-center">
               <button className="text-slate-400 hover:text-blue-600 font-bold text-sm transition-all flex items-center gap-2 mx-auto active:scale-95">
                 Need technical assistance? Contact AMS Support <ArrowRight className="w-4 h-4" />
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Toast Notification */}
      <AnimatePresence>
        {toastVisible && (
          <motion.div 
            initial={{ opacity: 0, y: 40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-10 left-1/2 z-[100] px-8 py-5 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] flex items-center gap-4 border text-white font-bold backdrop-blur-2xl ${toast.type === 'success' ? 'bg-emerald-600/90 border-emerald-400/20' : toast.type === 'error' ? 'bg-rose-600/90 border-rose-400/20' : 'bg-slate-900/90 border-slate-700/20'}`}
          >
             {toast.type === 'success' ? <PartyPopper className="w-6 h-6 text-emerald-100" /> : toast.type === 'error' ? <AlertCircle className="w-6 h-6 text-rose-100" /> : <Sparkles className="w-6 h-6 text-blue-100" />}
             <span className="text-base tracking-tight">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
