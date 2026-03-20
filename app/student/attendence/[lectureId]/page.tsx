"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CheckCircle2, Loader2, MapPin, Clock, Calendar, ShieldCheck, ArrowLeft, QrCode, XCircle, RefreshCcw, ScanFace, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { strapi } from '@/lib/sdk/sdk';
import { useStrapi } from '@/lib/sdk/useStrapi';
import Header from '@/components/Header';
import Link from 'next/link';

// ── QR Token Verification ─────────────────────────────────────────────────────
const QR_WINDOW_MS = 5_000; // Tight window for fast 2s rotation demo
const SECRET_KEY = process.env.NEXT_PUBLIC_SECRET || "default-attendance-secret-12345";

async function verifyQrToken(token: string, expectedLectureId: string): Promise<{ valid: boolean; reason?: string }> {
  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false, reason: "Malformed QR code. Please rescan." };

  const [tokenLectureId, timestampStr, receivedHash] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return { valid: false, reason: "Invalid QR timestamp." };

  const age = Date.now() - timestamp;
  // If age is greater than window (too old) OR age is significantly negative (student clock is way behind teacher)
  if (age > QR_WINDOW_MS || age < -10000) {
    const errorMsg = age < -10000 ? "Clock sync error. Please check your phone's time." : `QR code expired (${Math.round(age / 1000)}s old).`;
    return { valid: false, reason: errorMsg + " Wait for teacher to refresh." };
  }

  if (tokenLectureId !== expectedLectureId) {
    return { valid: false, reason: "QR code is for a different lecture." };
  }

  const raw = `${tokenLectureId}:${timestamp}`;
  const encoder = new TextEncoder();
  try {
    const keyMaterial = await crypto.subtle.importKey(
      "raw", encoder.encode(SECRET_KEY),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", keyMaterial, encoder.encode(raw));
    const derivedHash = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (derivedHash !== receivedHash) {
      return { valid: false, reason: "QR signature mismatch. The code may be forged or tampered." };
    }
  } catch {
    return { valid: false, reason: "Could not verify QR cryptographic signature." };
  }

  return { valid: true };
}

// ── QR Scanner Component ──────────────────────────────────────────────────────
const SCANNER_ID = 'qr-reader-widget';

function QrScannerWidget({ onScanSuccess }: { onScanSuccess: (text: string) => void }) {
  const scannerRef = useRef<any>(null);
  const isProcessing = useRef(false);
  const [cameraError, setCameraError] = useState('');
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    let instance: any = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        instance = new Html5Qrcode(SCANNER_ID);
        scannerRef.current = instance;

        const onSuccess = async (decodedText: string) => {
          if (isProcessing.current) return;
          isProcessing.current = true;
          try {
            if (instance && instance.isScanning) await instance.stop();
            onScanSuccess(decodedText);
          } catch (err) {
            console.error("Failed to stop scanner after success:", err);
            onScanSuccess(decodedText);
          }
        };

        try {
          await instance.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 240, height: 240 } },
            onSuccess, () => {}
          );
        } catch {
          await instance.start(
            { facingMode: 'user' },
            { fps: 10, qrbox: { width: 240, height: 240 } },
            onSuccess, () => {}
          );
        }
        setIsStarting(false);
      } catch (err: any) {
        const msg = (err?.message || '').toLowerCase();
        if (msg.includes('permission') || msg.includes('denied') || msg.includes('notallowed')) {
          setCameraError('Camera permission denied. Please check your browser settings.');
        } else if (msg.includes('notfound') || msg.includes('no camera')) {
          setCameraError('No camera detected on this device.');
        } else {
          setCameraError('Could not start camera. Please refresh and try again.');
        }
        setIsStarting(false);
      }
    };

    startScanner();
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="w-full">
      <style>{`
        #${SCANNER_ID} > div[id$="__dashboard"] { display: none !important; }
        #${SCANNER_ID} > div[id$="__scan_region"] { border: none !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; }
        #${SCANNER_ID} video { width: 100% !important; height: auto !important; display: block !important; border-radius: 12px; }
        #${SCANNER_ID} canvas { border-radius: 0 !important; }
        #${SCANNER_ID} img { display: none !important; }
      `}</style>

      {isStarting && (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-sm text-white/60">Starting camera…</p>
        </div>
      )}

      {cameraError ? (
        <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
          <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 font-bold text-sm tracking-tight">{cameraError}</p>
        </div>
      ) : (
        <div id={SCANNER_ID} className="w-full overflow-hidden" style={{ display: isStarting ? 'none' : 'block' }} />
      )}
    </div>
  );
}

// ── Inline Face Verification Step ─────────────────────────────────────────────
const FACE_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model/';

declare global {
  interface Window { faceapi: any; }
}

function FaceVerifyStep({
  studentDescriptor,
  onSuccess,
  onFailure,
}: {
  studentDescriptor: number[];
  onSuccess: () => void;
  onFailure: (reason: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneRef = useRef(false);

  const [status, setStatus] = useState<'loading-models' | 'ready' | 'scanning' | 'matched' | 'failed'>('loading-models');
  const [statusMsg, setStatusMsg] = useState('Loading AI models…');
  const [camActive, setCamActive] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;

  // Load models + auto-start camera
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Load face-api.js if not already functional on window
        if (!window.faceapi || !window.faceapi.nets) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector('script[data-faceapi]') as HTMLScriptElement;
            
            const onReady = () => {
              // Wait for the global to actually be attached
              const check = () => {
                if (window.faceapi && window.faceapi.nets) resolve();
                else setTimeout(check, 100);
              };
              check();
            };

            if (existing) {
              if (window.faceapi && window.faceapi.nets) { resolve(); return; }
              existing.addEventListener('load', onReady);
              existing.addEventListener('error', () => reject(new Error("Script found but failed to load")));
              return;
            }

            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
            s.setAttribute('data-faceapi', '1');
            s.onload = onReady;
            s.onerror = () => reject(new Error("Failed to load face-api script"));
            document.head.appendChild(s);
          });
        }

        if (cancelled) return;
        setStatusMsg('Initializing neural nets…');
        // Final safety check
        if (!window.faceapi || !window.faceapi.nets) throw new Error("FaceAPI not ready");

        await window.faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_URL);
        await window.faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODEL_URL);
        await window.faceapi.nets.faceRecognitionNet.loadFromUri(FACE_MODEL_URL);

        if (cancelled) return;
        setStatus('ready');
        setStatusMsg('AI Sensor Ready');
        startCamera();
      } catch (err: any) {
        if (!cancelled) {
          console.error("FaceVerifyStep Init Error:", err);
          setStatus('failed');
          setStatusMsg('Face Recognition Error: ' + (err?.message || 'Check connection'));
        }
      }
    }

    init();
    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopCamera() {
    if (detectTimerRef.current) { clearTimeout(detectTimerRef.current); detectTimerRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamActive(false);
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamActive(true);
      setStatus('scanning');
      setStatusMsg('Look straight at the camera…');
      runDetectionLoop();
    } catch (e: any) {
      setStatus('failed');
      setStatusMsg('Camera error: ' + e?.message);
    }
  }

  function runDetectionLoop() {
    async function loop() {
      if (doneRef.current) return;
      const video = videoRef.current;
      const overlay = overlayRef.current;
      if (!video || !overlay || !streamRef.current) return;

      if (video.videoWidth > 0) {
        overlay.width = video.videoWidth;
        overlay.height = video.videoHeight;
      }
      const ctx = overlay.getContext('2d')!;
      ctx.clearRect(0, 0, overlay.width, overlay.height);

      try {
        const det = await window.faceapi
          .detectSingleFace(video, new window.faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.45 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (det) {
          const dist = window.faceapi.euclideanDistance(det.descriptor, new Float32Array(studentDescriptor));
          const box = det.detection.box;

          const matched = dist < 0.5;
          const color = matched ? '#34a853' : '#ea4335';

          // Draw box
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          const lbl = matched ? `✓ Verified (${Math.round((1 - dist) * 100)}%)` : `✗ No match`;
          ctx.font = 'bold 13px sans-serif';
          const tw = ctx.measureText(lbl).width + 14;
          ctx.fillStyle = color;
          ctx.fillRect(box.x, box.y - 24, tw, 22);
          ctx.fillStyle = '#fff';
          ctx.fillText(lbl, box.x + 6, box.y - 7);

          if (matched) {
            doneRef.current = true;
            setStatus('matched');
            setStatusMsg('Face verified! ✓');
            stopCamera();
            setTimeout(() => onSuccess(), 800);
            return;
          } else {
            // Count failed attempts
            setAttempts(prev => {
              const next = prev + 1;
              if (next >= MAX_ATTEMPTS) {
                doneRef.current = true;
                setStatus('failed');
                setStatusMsg('Face did not match after multiple attempts.');
                stopCamera();
                setTimeout(() => onFailure('Face did not match. Attendance not recorded.'), 800);
              } else {
                setStatusMsg(`Face did not match. Attempt ${next}/${MAX_ATTEMPTS}…`);
              }
              return next;
            });
          }
        } else {
          setStatusMsg('No face detected — look straight at the camera…');
        }
      } catch { /* ignore detection errors */ }

      detectTimerRef.current = setTimeout(loop, 600);
    }
    loop();
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Status badge */}
      <div className={`w-full px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold
        ${status === 'matched' ? 'bg-green-500/10 text-green-600 border border-green-500/20' :
          status === 'failed' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
          'bg-blue-500/10 text-blue-600 border border-blue-500/20'}`}>
        {status === 'loading-models' && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {status === 'scanning' && <ScanFace className="w-4 h-4 shrink-0 animate-pulse" />}
        {status === 'matched' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
        {status === 'failed' && <AlertTriangle className="w-4 h-4 shrink-0" />}
        {status === 'ready' && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        <span>{statusMsg}</span>
      </div>

      {/* Attempt indicator */}
      {status === 'scanning' && (
        <div className="flex gap-1.5 self-start">
          {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i < attempts ? 'bg-red-500' : 'bg-foreground/20'}`} />
          ))}
        </div>
      )}

      {/* Camera view */}
      <div className={`relative w-full rounded-2xl overflow-hidden bg-black aspect-video
        ${status === 'matched' ? 'ring-2 ring-green-500' :
          status === 'failed' ? 'ring-2 ring-red-500' :
          camActive ? 'ring-2 ring-blue-500/50' : ''}`}>
        {!camActive && status !== 'failed' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/40">
            <ScanFace className="w-12 h-12" />
            <p className="text-sm">{status === 'loading-models' ? 'Loading models…' : 'Starting camera…'}</p>
          </div>
        )}
        <video ref={videoRef} autoPlay muted playsInline
          className="w-full h-full object-cover"
          style={{ display: camActive ? 'block' : 'none' }} />
        <canvas ref={overlayRef}
          className="absolute inset-0 w-full h-full"
          style={{ display: camActive ? 'block' : 'none' }} />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SubmitAttendancePage() {
  const { data: session } = useSession();
  //@ts-ignore
  const userId = session?.user?.id;
  const router = useRouter();
  const params = useParams();
  const lectureId = params.lectureId as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'verifying' | 'face-verify' | 'face-failed' | 'error'>('idle');
  const [scanError, setScanError] = useState('');

  const d = new Date();
  const todayDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Fetch current student (with faceEmbedding)
  const { data: studentsData, isLoading: isLoadingStudent } = useStrapi('students', {
    filters: userId ? { user: { id: { $eq: userId } } } : undefined,
    populate: ['user'],
  });
  const student = studentsData?.data?.[0] as any;
  const faceEmbedding: number[] | null = Array.isArray(student?.faceEmbedding) ? student.faceEmbedding : null;

  const { data: lectureData, isLoading: isLoadingLecture } = useStrapi(`lectures/${lectureId}`, { populate: '*' });
  const lectureAttr = (lectureData as any)?.data?.attributes || (lectureData as any)?.data;
  const classroomAttr = lectureAttr?.classroom?.data?.attributes || lectureAttr?.classroom;

  const { data: existingAttendanceData, isLoading: isLoadingExisting, mutate: mutateAttendance } = useStrapi('attendences', {
    filters: student?.id && lectureId ? {
      student: { [student?.documentId ? 'documentId' : 'id']: { $eq: student.documentId || student.id } },
      lecture: { [lectureId.length > 15 ? 'documentId' : 'id']: { $eq: lectureId } },
      date: { $eq: todayDate }
    } : undefined
  });

  const attendanceRecord = (existingAttendanceData?.data as any)?.[0]?.attributes || (existingAttendanceData?.data as any)?.[0];
  const alreadySubmitted = !!attendanceRecord;
  const isPresent = attendanceRecord?.currentStatus === 'present';
  const isLoading = isLoadingStudent || isLoadingLecture || isLoadingExisting;

  // Silent background GPS log
  useEffect(() => {
    if (!classroomAttr?.latitude || !classroomAttr?.longitude) return;
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const dist = getDistance(pos.coords.latitude, pos.coords.longitude, classroomAttr.latitude, classroomAttr.longitude);
        console.log(`[Attendance] GPS distance: ${Math.round(dist)}m (allowed: ${classroomAttr.radius}m)`);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [classroomAttr]);

  // ── Step 1: QR Scanned ─────────────────────────────────────────────────────
  const handleQrScanned = async (rawToken: string) => {
    setScanState('verifying');
    setScanError('');

    const result = await verifyQrToken(rawToken, lectureId);
    if (!result.valid) {
      setScanState('error');
      setScanError(result.reason || 'Invalid QR code.');
      return;
    }

    if (!student) {
      setScanState('error');
      setScanError("Could not verify your student profile.");
      return;
    }

    // QR valid → move to face verification
    setScanState('face-verify');
  };

  // ── Step 2: Face Verified ──────────────────────────────────────────────────
  const handleFaceSuccess = async () => {
    if (!student) return;
    setIsSubmitting(true);
    try {
      const studentId = student.documentId || student.id;
      if (!studentId) throw new Error("Student ID missing");

      await strapi.create('attendences', {
        student: studentId,
        lecture: lectureId,
        date: todayDate,
        type: 'auto',
        currentStatus: 'present',
      });
      toast.success("Attendance verified and saved! ✓");
      await mutateAttendance();
      setScanState('idle');
      setTimeout(() => router.push('/student/mylectures'), 1800);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to save attendance.");
      setScanState('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFaceFailure = (reason: string) => {
    setScanState('face-failed');
    setScanError(reason);
  };

  const handleManualRequest = async () => {
    if (!student) return;
    setIsSubmitting(true);
    try {
      const studentId = student.documentId || student.id;
      await strapi.create('attendences', {
        student: studentId,
        lecture: lectureId,
        date: todayDate,
        type: 'manual',
        currentStatus: 'absent',
      });
      toast.info("Request sent to teacher!");
      await mutateAttendance();
      setTimeout(() => router.push('/student/mylectures'), 1500);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to send request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        </main>
      </div>
    );
  }

  if (!lectureAttr) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
          <h2 className="text-2xl font-bold mb-2">Lecture Not Found</h2>
          <p className="text-foreground/50 mb-6">We could not locate the details for this session.</p>
          <Link href="/student/mylectures" className="text-blue-600 hover:underline">Return to My Lectures</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-foreground/[0.02]">
      <Header />
      <main className="flex-1 py-28 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <ToastContainer position="top-right" autoClose={3000} />

        <div className="w-full max-w-lg">
          <Link href="/student/mylectures" className="inline-flex items-center gap-2 text-foreground/50 hover:text-foreground font-medium mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to lectures
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-background rounded-3xl shadow-2xl border border-foreground/10 overflow-hidden">

            {/* Header */}
            <div className="px-8 py-10 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="w-20 h-20 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                {scanState === 'face-verify' ? (
                  <ScanFace className="w-10 h-10 text-blue-500" />
                ) : (
                  <ShieldCheck className="w-10 h-10 text-green-500" />
                )}
                {alreadySubmitted && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-background text-white">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-extrabold text-foreground mb-2">
                {alreadySubmitted
                  ? 'Attendance Registered'
                  : scanState === 'face-verify'
                  ? 'Face Verification'
                  : 'Scan QR to Attend'}
              </h1>
              <p className="text-foreground/60 text-sm">
                {alreadySubmitted
                  ? "Your attendance for today's lecture has been successfully recorded."
                  : scanState === 'face-verify'
                  ? "QR code verified ✓ — Now verify your face to complete attendance."
                  : "Ask your teacher to show the QR code, then scan it to verify your live presence."}
              </p>

              {/* Step indicator */}
              {!alreadySubmitted && (
                <div className="flex items-center justify-center gap-2 mt-5">
                  <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full 
                    ${scanState === 'face-verify' || scanState === 'face-failed'
                      ? 'bg-green-500/10 text-green-600'
                      : 'bg-blue-500/10 text-blue-600'}`}>
                    <QrCode className="w-3.5 h-3.5" />
                    QR Scan
                  </div>
                  <div className={`w-6 h-px ${scanState === 'face-verify' || scanState === 'face-failed' ? 'bg-green-500' : 'bg-foreground/20'}`} />
                  <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full
                    ${scanState === 'face-verify'
                      ? 'bg-blue-500/10 text-blue-600'
                      : 'bg-foreground/5 text-foreground/40'}`}>
                    <ScanFace className="w-3.5 h-3.5" />
                    Face ID
                  </div>
                </div>
              )}
            </div>

            {/* Lecture Details */}
            <div className="px-8 py-6 border-t border-foreground/10 bg-foreground/[0.02]">
              <div className="bg-background border border-foreground/10 rounded-2xl p-5 space-y-4">
                <div>
                  <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1">Lecture</p>
                  <p className="font-bold text-foreground text-lg">
                    {lectureAttr.name || lectureAttr.subject?.data?.attributes?.name || lectureAttr.subject?.name || 'Ongoing Session'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-foreground/40 uppercase">Date</p>
                      <p className="text-sm font-semibold text-foreground/80">{todayDate}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-foreground/40 uppercase">Duration</p>
                      <p className="text-sm font-semibold text-foreground/80">
                        {lectureAttr.start_time?.slice(0,5)} – {lectureAttr.end_time?.slice(0,5)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 col-span-2">
                    <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-foreground/40 uppercase">Room</p>
                      <p className="text-sm font-semibold text-foreground/80">{classroomAttr?.name || 'Standard Room'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Area */}
            <div className="p-8 bg-background border-t border-foreground/10">
              <AnimatePresence mode="wait">

                {/* Already submitted */}
                {alreadySubmitted && isPresent && (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="w-full py-4 bg-green-500/10 text-green-600 font-bold rounded-2xl flex justify-center items-center gap-2 border border-green-500/20">
                    <CheckCircle2 className="w-5 h-5" /> Verified for Today
                  </motion.div>
                )}
                {alreadySubmitted && !isPresent && (
                  <motion.div key="pending" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="w-full py-4 bg-orange-500/10 text-orange-600 font-bold rounded-2xl flex justify-center items-center gap-2 border border-orange-500/20">
                    <Clock className="w-5 h-5" /> Request Pending Approval
                  </motion.div>
                )}

                {/* Idle — show action buttons */}
                {!alreadySubmitted && scanState === 'idle' && (
                  <motion.div key="idle" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3 w-full">
                    <button
                      onClick={() => setScanState('scanning')}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:-translate-y-0.5 flex justify-center items-center gap-2">
                      <QrCode className="w-5 h-5" /> Scan Attendance QR
                    </button>
                    <button
                      onClick={handleManualRequest}
                      disabled={isSubmitting}
                      className="w-full py-4 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 font-bold rounded-2xl transition-all border border-orange-500/20 flex justify-center items-center gap-2 disabled:opacity-50">
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                      Request to Teacher
                    </button>
                  </motion.div>
                )}

                {/* Verifying QR */}
                {!alreadySubmitted && scanState === 'verifying' && (
                  <motion.div key="verifying" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="w-full py-4 bg-blue-500/10 text-blue-600 font-bold rounded-2xl flex justify-center items-center gap-2 border border-blue-500/20">
                    <Loader2 className="w-5 h-5 animate-spin" /> Verifying QR…
                  </motion.div>
                )}

                {/* Face Verification Step */}
                {!alreadySubmitted && scanState === 'face-verify' && (
                  <motion.div key="face-verify" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full space-y-4">
                    {faceEmbedding ? (
                      <FaceVerifyStep
                        studentDescriptor={faceEmbedding}
                        onSuccess={handleFaceSuccess}
                        onFailure={handleFaceFailure}
                      />
                    ) : (
                      // Student has no face embedding — skip face check and submit directly
                      <div className="w-full space-y-4">
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-amber-600 text-sm font-medium">
                            Face not registered. Submitting attendance without face verification.
                          </p>
                        </div>
                        <button
                          onClick={handleFaceSuccess}
                          disabled={isSubmitting}
                          className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50">
                          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                          Submit Attendance
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Face Failed */}
                {!alreadySubmitted && scanState === 'face-failed' && (
                  <motion.div key="face-failed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3 w-full">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                      <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-red-600 font-bold text-sm">{scanError}</p>
                    </div>
                    <button onClick={() => { setScanError(''); setScanState('face-verify'); }}
                      className="w-full py-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 font-bold rounded-2xl transition-all border border-blue-500/20 flex justify-center items-center gap-2">
                      <RefreshCcw className="w-5 h-5" /> Retry Face Scan
                    </button>
                    <button onClick={() => { setScanError(''); setScanState('idle'); }}
                      className="w-full py-3 bg-foreground/5 hover:bg-foreground/10 text-foreground/60 font-semibold rounded-2xl transition-all flex justify-center items-center gap-2">
                      <ArrowLeft className="w-4 h-4" /> Start Over
                    </button>
                  </motion.div>
                )}

                {/* QR Error */}
                {!alreadySubmitted && scanState === 'error' && (
                  <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3 w-full">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                      <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-red-600 font-bold text-sm">{scanError}</p>
                    </div>
                    <button onClick={() => { setScanError(''); setScanState('scanning'); }}
                      className="w-full py-4 bg-foreground/5 hover:bg-foreground/10 text-foreground font-bold rounded-2xl transition-all flex justify-center items-center gap-2 border border-foreground/10">
                      <RefreshCcw className="w-5 h-5" /> Rescan QR Code
                    </button>
                  </motion.div>
                )}

                {/* Submitting */}
                {isSubmitting && (
                  <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="w-full py-4 bg-green-500/10 text-green-600 font-bold rounded-2xl flex justify-center items-center gap-2 border border-green-500/20 mt-3">
                    <Loader2 className="w-5 h-5 animate-spin" /> Saving attendance…
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* ── Fullscreen QR Scanner Overlay ───────────────────────────────── */}
        <AnimatePresence>
          {scanState === 'scanning' && (
            <motion.div key="scan-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black flex flex-col">

              {/* Top bar */}
              <div className="flex items-center justify-between px-6 pt-12 pb-4 shrink-0">
                <div>
                  <p className="text-white font-black text-xl">Scan QR Code</p>
                  <p className="text-white/50 text-sm">Point at the code shown by your teacher</p>
                </div>
                <button onClick={() => setScanState('idle')}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all">
                  <XCircle className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Camera area */}
              <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 min-h-0">
                <div className="relative w-full max-w-sm">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg z-10 pointer-events-none" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg z-10 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg z-10 pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg z-10 pointer-events-none" />
                  <motion.div
                    className="absolute left-2 right-2 h-0.5 bg-blue-400/80 z-10 rounded-full pointer-events-none"
                    style={{ boxShadow: '0 0 8px 2px rgba(96,165,250,0.6)' }}
                    animate={{ top: ['8%', '92%', '8%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <QrScannerWidget onScanSuccess={handleQrScanned} />
                </div>
                <p className="text-white/40 text-xs text-center max-w-xs">
                  The QR code refreshes every 2 seconds — scan quickly!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// Haversine (silent background GPS)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const dLat = (Number(lat2) - Number(lat1)) * (Math.PI / 180);
  const dLon = (Number(lon2) - Number(lon1)) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(Number(lat1) * Math.PI / 180) * Math.cos(Number(lat2) * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}