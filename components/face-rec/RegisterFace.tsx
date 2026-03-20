'use client';

import { loadConfig, loadLogs, loadStudents, saveLogs, saveStudents } from '@/lib/storage';
import type { Config, LogEntry, Student } from '@/lib/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ScanFace, 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCcw, 
  Loader2,
  Fingerprint,
  ArrowRight
} from 'lucide-react';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model/';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    faceapi: any;
  }
}

export default function RegisterFace({ studentId }: { studentId: string }) {
  // ── Data State ──
  const [students, setStudents] = useState<Student[]>([]);
  const [cfg, setCfg] = useState<Config>({ cls: '', subject: '', teacher: '', date: '' });

  // ── UI State ──
  const [modelsReady, setModelsReady] = useState(false);
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [loaderTxt, setLoaderTxt] = useState('Initializing AI Models…');
  const [loaderPct, setLoaderPct] = useState(0);
  const [toast, setToast] = useState({ msg: '', type: 'info' as 'info' | 'success' | 'error' });
  const [toastVisible, setToastVisible] = useState(false);

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
  const studentsRef = useRef<Student[]>([]);

  // Keep refs in sync
  useEffect(() => { studentsRef.current = students; }, [students]);

  // ── Boot ──
  useEffect(() => {
    const storedCfg = loadConfig();
    const storedStudents = loadStudents();
    const storedLogs = loadLogs();

    setCfg(storedCfg);
    setStudents(storedStudents);

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
      ['tinyFaceDetector', 30, 'Loading face detector…'],
      ['faceLandmark68Net', 65, 'Identifying facial contours…'],
      ['faceRecognitionNet', 95, 'Finalizing neural patterns…'],
    ];
    try {
      await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector('script[data-faceapi]');
        if (existing) { resolve(); return; }
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
        s.setAttribute('data-faceapi', '1');
        s.onload = () => resolve();
        s.onerror = reject;
        document.head.appendChild(s);
      });

      for (const [net, pct, label] of steps) {
        setLoaderTxt(label);
        setLoaderPct(pct);
        await window.faceapi.nets[net].loadFromUri(MODEL_URL);
      }

      setLoaderPct(100);
      await new Promise(r => setTimeout(r, 800));
      setLoaderVisible(false);
      setModelsReady(true);
      showToast('AI Intelligence Core Online', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setLoaderTxt('Neural Core Failure: ' + message);
      showToast('Failed to load neural core', 'error');
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
      setEnrollFaceMsg('Looking for valid face signature...');
      setEnrollFaceMsgOk(false);
      setShowSnap(false);
      startEnrollDetection();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast('Vision access denied: ' + msg, 'error');
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
          setEnrollFaceMsg('✅ Biometric Signature Clear'); 
        } else { 
          setEnrollFaceMsgOk(false); 
          setEnrollFaceMsg('🔍 Align face with sensor...'); 
        }
      } catch { /* ignore */ }
      enrollDetTmrRef.current = setTimeout(loop, 400);
    }
    loop();
  }

  const captureFace = useCallback(async () => {
    if (!enrollStreamRef.current) { showToast('Activate vision sensor first', 'info'); return; }
    setEnrollMsg({ text: 'Analyzing biometric data...', type: 'info' });
    try {
      const det = await window.faceapi
        .detectSingleFace(enrollVideoRef.current, new window.faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.45 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (!det) { 
        setEnrollMsg({ text: 'Neural scan failed. Look directly at the sensor.', type: 'error' }); 
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
      setEnrollMsg({ text: 'Signature captured. Ready for database enrollment.', type: 'success' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setEnrollMsg({ text: 'Data parse error: ' + msg, type: 'error' });
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
    try {
      setLoading(true);
      const roll = studentId.trim();
      if (!roll) { setEnrollMsg({ text: 'Student ID missing.', type: 'error' }); return; }
      if (!capturedDesc) { setEnrollMsg({ text: 'Capture face signature first.', type: 'error' }); return; }
      
      const studentsFound = studentsRef.current;
      if (studentsFound.find(s => s.roll === roll)) { 
        setEnrollMsg({ text: 'This identity is already enrolled in AMS.', type: 'error' }); 
        return; 
      }

      const updated = [...studentsFound, { id: Date.now().toString(), roll, descriptor: capturedDesc, photo: snapSrc }];
      setStudents(updated);
      await saveStudents(updated);
      
      setEnrollMsg({ text: 'Registration Successful. Syncing with AMS cloud...', type: 'success' });
      showToast('Registration Success', 'success');
      
      // Auto-leave or reset after success
      setTimeout(() => {
        retakeFace();
        window.location.href = '/'; // Or back to dashboard
      }, 2500);

    } catch (error) {
      showToast("Enrollment Sync Failed", "error");
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-blue-100">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[10%] left-[20%] w-[40rem] h-[40rem] bg-blue-400/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[20%] w-[35rem] h-[35rem] bg-indigo-400/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <AnimatePresence>
        {loaderVisible ? (
          <motion.div 
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center max-w-sm w-full text-center"
          >
            <div className="w-20 h-20 mb-8 relative">
                <div className="absolute inset-0 border-4 border-blue-100 rounded-3xl" />
                <div 
                  className="absolute inset-0 border-4 border-blue-600 rounded-3xl border-t-transparent animate-spin" 
                  style={{ animationDuration: '1.5s' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <ScanFace className="w-8 h-8 text-blue-600" />
                </div>
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Initializing Sensor</h2>
            <p className="text-slate-500 font-medium mb-8 text-sm">{loaderTxt}</p>
            
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
              <motion.div 
                className="h-full bg-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${loaderPct}%` }}
                transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
              />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading AMS AI Engine v2.0</span>
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
              <div className="p-8 pb-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                  <Fingerprint className="w-3.5 h-3.5" /> Biometric Registration
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Register Your Identity</h1>
                <p className="text-slate-500 mt-2 font-medium">Link your face to ID: <span className="text-blue-600 font-bold">{studentId}</span></p>
              </div>

              {/* Main Content */}
              <div className="p-8 pt-4">
                <div className="relative aspect-square md:aspect-video bg-slate-100 rounded-[2rem] overflow-hidden border-2 border-slate-100 shadow-inner group">
                   
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
                          <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-blue-600 rounded-tl-lg" />
                          <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-blue-600 rounded-tr-lg" />
                          <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-blue-600 rounded-bl-lg" />
                          <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-blue-600 rounded-br-lg" />
                          
                          {/* Scanning Line */}
                          <motion.div 
                            className="absolute left-8 right-8 h-[2px] bg-blue-600/50 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                            animate={{ top: ['20%', '80%', '20%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
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
                        <Camera className="w-16 h-16 mb-4 stroke-[1.5]" />
                        <p className="text-sm font-bold tracking-tight px-8 text-center">Ready for biometric scan. Click below to begin.</p>
                     </div>
                   )}

                   {/* Face Success/Fail Badge */}
                   <AnimatePresence>
                    {enrollActive && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-40 px-6 py-2.5 rounded-2xl flex items-center gap-3 backdrop-blur-xl border-2 shadow-2xl transition-colors ${enrollFaceMsgOk ? 'bg-emerald-500/90 border-emerald-400/50 text-white' : 'bg-slate-900/80 border-slate-700/50 text-white'}`}
                      >
                         {enrollFaceMsgOk ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" />}
                         <span className="text-sm font-bold truncate max-w-[200px]">{enrollFaceMsg}</span>
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
                          className={`text-sm font-bold flex items-center justify-center gap-2 ${enrollMsg.type === 'error' ? 'text-rose-600' : enrollMsg.type === 'success' ? 'text-emerald-600' : 'text-blue-600'}`}
                        >
                          {enrollMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : enrollMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                          {enrollMsg.text}
                        </motion.p>
                     )}
                   </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="mt-8 flex flex-col gap-4">
                  {!showSnap ? (
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                         onClick={toggleEnrollCam}
                         className={`h-14 rounded-2xl flex items-center justify-center font-bold transition-all active:scale-95 ${enrollActive ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                      >
                         {enrollActive ? 'Cancel Sensor' : 'Open Camera'}
                      </button>
                      <button 
                         onClick={captureFace}
                         disabled={!enrollActive}
                         className="h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold transition-all hover:bg-blue-700 disabled:opacity-30 disabled:grayscale shadow-xl shadow-blue-600/20 active:scale-95 gap-2"
                      >
                         <Camera className="w-5 h-5" /> Capture
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <button 
                         onClick={enrollStudent}
                         disabled={loading}
                         className="h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-lg transition-all hover:bg-blue-700 shadow-2xl shadow-blue-600/30 active:scale-95 gap-3"
                      >
                         {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                         {loading ? "Syncing Database..." : "Complete Registration"}
                      </button>
                      <button 
                         onClick={retakeFace}
                         className="h-12 text-slate-400 font-bold text-sm flex items-center justify-center gap-2 hover:text-slate-600 transition-colors"
                      >
                         <RefreshCcw className="w-4 h-4" /> Try Again
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Badge */}
              <div className="bg-slate-50/80 p-6 flex items-center justify-center gap-3 border-t border-slate-100">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Encrypted Biometric Handshake Active</span>
              </div>
            </div>

            {/* Help Link */}
            <div className="mt-8 text-center">
               <button className="text-slate-400 hover:text-blue-600 font-bold text-sm transition-colors flex items-center gap-2 mx-auto">
                 Need assistance? View guide <ArrowRight className="w-4 h-4" />
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
            className={`fixed bottom-8 left-1/2 -z-[100] px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border text-white font-bold backdrop-blur-xl ${toast.type === 'success' ? 'bg-emerald-600/90 border-emerald-400/20' : toast.type === 'error' ? 'bg-rose-600/90 border-rose-400/20' : 'bg-slate-900/90 border-slate-700/20'}`}
          >
             {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
             <span className="text-sm tracking-tight">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
