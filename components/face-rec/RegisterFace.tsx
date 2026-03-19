'use client';

import { loadConfig, loadLogs, loadStudents, saveLogs, saveStudents } from '@/lib/storage';
import type { Config, LogEntry, MatchResult, Student } from '@/lib/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import './gs.css';
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model/';
const MODAL_AUTO_CLOSE = 6;

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    faceapi: any;
  }
}

// ─── Modal State ───────────────────────────────────────────────
interface ModalState {
  open: boolean;
  type: 'authorized' | 'unauthorized' | null;
  student?: Student;
  dist?: number;
  faceSnap?: string;
  alreadyMarked?: boolean;
}

export default function RegisterFace({ studentId }: { studentId: string }) {
  // ── Data State ──
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [cfg, setCfg] = useState<Config>({ cls: 'Class 10-A', subject: 'Mathematics', teacher: '', date: '' });
  const [today, setToday] = useState('');

  // ── UI State ──
  const [modelsReady, setModelsReady] = useState(false);
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [loaderTxt, setLoaderTxt] = useState('Loading AI Models…');
  const [loaderPct, setLoaderPct] = useState(0);
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [modal, setModal] = useState<ModalState>({ open: false, type: null });
  const [countdown, setCountdown] = useState(MODAL_AUTO_CLOSE);



  // ── Enroll State ──
  const [enrollActive, setEnrollActive] = useState(false);
  const [enrollFaceMsg, setEnrollFaceMsg] = useState('');
  const [enrollFaceMsgOk, setEnrollFaceMsgOk] = useState(false);
  const [enrollMsg, setEnrollMsg] = useState('');
  const [capturedDesc, setCapturedDesc] = useState<number[] | null>(null);
  const [snapSrc, setSnapSrc] = useState('');
  const [showSnap, setShowSnap] = useState(false);



  // ── Refs ──
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const enrollVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const enrollStreamRef = useRef<MediaStream | null>(null);
  const detectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enrollDetTmrRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingFaceRef = useRef(false);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const studentsRef = useRef<Student[]>([]);
  const logsRef = useRef<LogEntry[]>([]);
  const todayRef = useRef('');

  // Keep refs in sync
  useEffect(() => { studentsRef.current = students; }, [students]);
  useEffect(() => { logsRef.current = logs; }, [logs]);
  useEffect(() => { todayRef.current = today; }, [today]);

  // ── Boot ──
  useEffect(() => {
    const storedCfg = loadConfig();
    const storedStudents = loadStudents();
    const storedLogs = loadLogs();
    const todayDate = storedCfg.date || new Date().toISOString().slice(0, 10);

    setCfg(storedCfg);
    setStudents(storedStudents);
    setLogs(storedLogs);
    setToday(todayDate);


    loadModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load Models ──
  async function loadModels() {
    const steps: [string, number, string][] = [
      ['tinyFaceDetector', 30, 'Loading face detector…'],
      ['faceLandmark68Net', 65, 'Loading landmarks…'],
      ['faceRecognitionNet', 95, 'Loading recognition model…'],
    ];
    try {
      // Load face-api.js from CDN
      await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector('script[data-faceapi]');
        if (existing) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.esm.js';
        script.setAttribute('data-faceapi', '1');
        // Use UMD build instead
        script.remove();

        // Use the CDN UMD build
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
      await new Promise(r => setTimeout(r, 350));
      setLoaderVisible(false);
      setModelsReady(true);
      showToast('✅ Models loaded. Ready!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setLoaderTxt('❌ Failed: ' + message);
    }
  }

  // ── Toast ──
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 3000);
  }, []);

  // ── Attendance Camera ──
  const startCam = useCallback(async () => {
    if (!modelsReady) { showToast('Models still loading…'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }


      startDetection();
      showToast('Attendance camera started');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast('Camera error: ' + msg);

    }
  }, [modelsReady, showToast]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopCam = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (detectTimerRef.current) { clearTimeout(detectTimerRef.current); detectTimerRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (overlayRef.current) {
      const ctx = overlayRef.current.getContext('2d');
      ctx?.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    }

  }, []);

  // ── Detection Loop ──
  function startDetection() {


    async function loop() {
      if (!mediaStreamRef.current) return;
      const video = videoRef.current;
      const overlay = overlayRef.current;
      if (!video || !overlay) { detectTimerRef.current = setTimeout(loop, 250); return; }

      if (video.videoWidth > 0) {
        overlay.width = video.videoWidth;
        overlay.height = video.videoHeight;
      }
      const ctx = overlay.getContext('2d')!;
      ctx.clearRect(0, 0, overlay.width, overlay.height);

      if (processingFaceRef.current) { detectTimerRef.current = setTimeout(loop, 400); return; }

      try {
        const dets = await window.faceapi
          .detectAllFaces(video, new window.faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.45 }))
          .withFaceLandmarks()
          .withFaceDescriptors();



        if (dets.length > 0 && !processingFaceRef.current) {
          const det = dets[0];
          const box = det.detection.box;
          const match = bestMatch(det.descriptor, studentsRef.current);
          const known = match && match.dist < 0.5;

          // Draw bounding box
          const color = known ? '#34a853' : '#ea4335';
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
          const lbl = known ? '✓ ' + match!.student.roll : '? Unknown';
          ctx.font = 'bold 13px Segoe UI, sans-serif';
          const tw = ctx.measureText(lbl).width + 14;
          ctx.fillStyle = color;
          ctx.fillRect(box.x, box.y - 24, tw, 22);
          ctx.fillStyle = '#fff';
          ctx.fillText(lbl, box.x + 6, box.y - 7);

          const faceSnap = captureFaceSnapshot(box, video);

          processingFaceRef.current = true;
          stopCam();

          const currentLogs = logsRef.current;
          const currentToday = todayRef.current;

          if (known && match) {
            const alreadyMarked = currentLogs.find(l => l.sid === match.student.id && l.date === currentToday);
            if (!alreadyMarked) {
              // mark present
              const updatedLogs = [
                ...currentLogs,
                {
                  sid: match.student.id,
                  name: match.student.roll,
                  roll: match.student.roll,
                  date: currentToday,
                  time: new Date().toLocaleTimeString(),
                  conf: Math.round((1 - match.dist) * 100),
                },
              ];
              setLogs(updatedLogs);
              logsRef.current = updatedLogs;
              saveLogs(updatedLogs);
            }
            setModal({ open: true, type: 'authorized', student: match.student, dist: match.dist, faceSnap, alreadyMarked: !!alreadyMarked });
          } else {
            setModal({ open: true, type: 'unauthorized', faceSnap });
          }
          setCountdown(MODAL_AUTO_CLOSE);
          return;
        }
      } catch { /* ignore */ }

      detectTimerRef.current = setTimeout(loop, 250);
    }
    loop();
  }

  // ── Best Match ──
  function bestMatch(descriptor: Float32Array, studentList: Student[]): MatchResult | null {
    if (!studentList.length) return null;
    let best: MatchResult | null = null;
    let bestDist = Infinity;
    studentList.forEach(s => {
      if (!s.descriptor) return;
      const d = window.faceapi.euclideanDistance(descriptor, new Float32Array(s.descriptor));
      if (d < bestDist) { bestDist = d; best = { student: s, dist: d }; }
    });
    return best;
  }

  // ── Face Snapshot ──
  function captureFaceSnapshot(box: { x: number; y: number; width: number; height: number }, video: HTMLVideoElement): string {
    try {
      const snap = document.createElement('canvas');
      const pad = 30;
      const sx = Math.max(0, box.x - pad);
      const sy = Math.max(0, box.y - pad);
      const sw = Math.min(video.videoWidth - sx, box.width + pad * 2);
      const sh = Math.min(video.videoHeight - sy, box.height + pad * 2);
      snap.width = 120; snap.height = 120;
      snap.getContext('2d')!.drawImage(video, sx, sy, sw, sh, 0, 0, 120, 120);
      return snap.toDataURL('image/jpeg', 0.85);
    } catch { return ''; }
  }

  // ── Modal ──
  const closeModal = useCallback((restartCamera: boolean) => {
    if (countdownTimerRef.current) { clearInterval(countdownTimerRef.current); countdownTimerRef.current = null; }
    setModal({ open: false, type: null });
    processingFaceRef.current = false;
    if (restartCamera) setTimeout(() => startCam(), 400);
  }, [startCam]);

  // Countdown when modal opens
  useEffect(() => {
    if (!modal.open) return;
    setCountdown(MODAL_AUTO_CLOSE);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          closeModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (countdownTimerRef.current) clearInterval(countdownTimerRef.current); };
  }, [modal.open, closeModal]);

  // ── Enroll Camera ──
  const toggleEnrollCam = useCallback(async () => {
    if (enrollStreamRef.current) {
      stopEnrollCam();
      return;
    }
    if (!modelsReady) { showToast('Models still loading…'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      enrollStreamRef.current = stream;
      if (enrollVideoRef.current) {
        enrollVideoRef.current.srcObject = stream;
        await enrollVideoRef.current.play();
        enrollVideoRef.current.style.display = 'block';
      }
      setEnrollActive(true);
      setEnrollFaceMsg('🔍 Looking for face…');
      setEnrollFaceMsgOk(false);
      setShowSnap(false);
      startEnrollDetection();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast('Camera error: ' + msg);
    }
  }, [modelsReady, showToast]); // eslint-disable-line react-hooks/exhaustive-deps

  function stopEnrollCam() {
    if (enrollStreamRef.current) {
      enrollStreamRef.current.getTracks().forEach(t => t.stop());
      enrollStreamRef.current = null;
    }
    if (enrollDetTmrRef.current) { clearTimeout(enrollDetTmrRef.current); enrollDetTmrRef.current = null; }
    if (enrollVideoRef.current) { enrollVideoRef.current.srcObject = null; enrollVideoRef.current.style.display = 'none'; }
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
        if (det) { setEnrollFaceMsgOk(true); setEnrollFaceMsg('✅ Face detected — click Capture'); }
        else { setEnrollFaceMsgOk(false); setEnrollFaceMsg('🔍 No face — look straight at camera'); }
      } catch { /* ignore */ }
      enrollDetTmrRef.current = setTimeout(loop, 400);
    }
    loop();
  }

  const captureFace = useCallback(async () => {
    if (!enrollStreamRef.current) { showToast('Open camera first'); return; }
    setEnrollMsg('🔍 Detecting face…');
    try {
      const det = await window.faceapi
        .detectSingleFace(enrollVideoRef.current, new window.faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.45 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!det) { setEnrollMsg('❌ No face detected. Look straight at camera.'); return; }
      setCapturedDesc(Array.from(det.descriptor));
      const snap = document.createElement('canvas');
      const v = enrollVideoRef.current!;
      snap.width = v.videoWidth; snap.height = v.videoHeight;
      snap.getContext('2d')!.drawImage(v, 0, 0);
      setSnapSrc(snap.toDataURL('image/jpeg', 0.8));
      setShowSnap(true);
      stopEnrollCam();
      setEnrollMsg('✅ Face captured! Enter name & roll, then Enroll.');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setEnrollMsg('❌ Error: ' + msg);
    }
  }, [showToast]);

  function retakeFace() {
    setCapturedDesc(null);
    setSnapSrc('');
    setShowSnap(false);
    setEnrollMsg('');
  }
  const [loading, setLoading] = useState(false)
  async function enrollStudent() {
    try {
      setLoading(true)
      // const name = iName.trim();
      const roll = studentId.trim();
      //  if (!name) { setEnrollMsg('❌ Enter student name.'); return; }
      if (!roll) { setEnrollMsg('❌ Enter roll number.'); return; }
      if (!capturedDesc) { setEnrollMsg('❌ Capture face first.'); return; }
      if (students.find(s => s.roll === roll)) { setEnrollMsg('❌ Roll number already enrolled.'); return; }

      const updated = [...students, { id: Date.now().toString(), roll, descriptor: capturedDesc, photo: snapSrc }];
      setStudents(updated);
      await saveStudents(updated);
      //setIName(''); setIRoll(''); 
      retakeFace();
      setEnrollMsg('✅ ' + name + ' enrolled!');
      showToast(name + ' enrolled');
    } catch (error) {
      showToast("Something went wrong")
      console.log(error)
    }
    finally {
      setLoading(false)
    }
  }





  // ── Computed ──
  const todayLogs = logs.filter(l => l.date === today);
  const present = students.filter(s => todayLogs.find(l => l.sid === s.id)).length;
  const absent = students.length - present;
  const pct = students.length > 0 ? Math.round(present / students.length * 100) + '%' : '0%';

  // Countdown ring
  const CIRC = 150.8;
  const ringOffset = CIRC * (1 - countdown / MODAL_AUTO_CLOSE);

  // ─────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────
  return (
    <>
      {/* Loader */}
      {loaderVisible && (
        <div id="loader">
          <div className="spinner" />
          <div id="loader-txt">{loaderTxt}</div>
          <div className="loader-bar"><div className="loader-fill" style={{ width: loaderPct + '%' }} /></div>
          <small style={{ color: '#aaa', fontSize: '0.75rem' }}>First load may take 15–30 seconds</small>
        </div>
      )}

      {/* Main Layout */}
      <div className="container">

        {/* RIGHT COLUMN */}
        <div>
          {/* Enroll Student */}
          <div className="card">
            <div className="card-header">Register Your Face</div>
            <div className="enroll-form">
              {/*    <div className="fg"><label>Full Name</label><input value={iName} onChange={e => setIName(e.target.value)} placeholder="e.g. Rahul Sharma" /></div>
              <div className="fg"><label>Roll Number</label><input value={iRoll} onChange={e => setIRoll(e.target.value)} placeholder="e.g. 2024001" /></div> */}

              <div className="enroll-cam-box">
                <video ref={enrollVideoRef} autoPlay muted playsInline style={{ display: 'none', width: '100%', height: '100%', objectFit: 'cover' }} />
                {showSnap && snapSrc && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={snapSrc} alt="captured face" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                )}
                {!enrollActive && !showSnap && (
                  <div className="enroll-cam-ph">
                    <span className="icon2">🎥</span>
                    Click &quot;Open Camera&quot; to capture face
                  </div>
                )}
                {enrollActive && (
                  <div className={`enroll-face-msg ${enrollFaceMsgOk ? 'ok' : ''}`}>{enrollFaceMsg}</div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-gray" onClick={toggleEnrollCam} style={{ flex: 1 }}>
                  {enrollActive ? '⏹ Close Camera' : '📷 Open Camera'}
                </button>
                <button className="btn-blue" onClick={captureFace} disabled={!enrollActive} style={{ flex: 1 }}>📸 Capture</button>
              </div>

              {showSnap && (
                <button className="btn-gray" onClick={retakeFace} style={{ width: '100%' }}>↺ Retake Photo</button>
              )}

              <button className="btn-green" style={{ width: '100%', marginTop: '2px' }} onClick={enrollStudent}>{loading ? "Enrolling..." : "✔ Enroll Student"}</button>
              <div className="enroll-status">{enrollMsg}</div>
            </div>
          </div>
        </div>
      </div>
      {/* Toast */}
      <div id="toast" className={toastVisible ? 'show' : ''}>{toast}</div>
    </>
  );
}
