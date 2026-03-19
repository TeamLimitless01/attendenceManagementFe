"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Search, Calendar, BookOpen, Clock, Loader2, MapPin, PlayCircle, X, QrCode, StopCircle, UserCheck, Check } from 'lucide-react';
import Header from '@/components/Header';
import { useStrapi } from '@/lib/sdk/useStrapi';
import QRCode from "react-qr-code";
import { strapi } from '@/lib/sdk/sdk';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DAYS = [
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
  { id: 7, label: 'Sunday' },
];

async function generateAttendanceToken(lectureId: string) {
  const timestamp = Date.now();
  const raw = `${lectureId}:${timestamp}`;
  // Fallback to a default key if standard envs don't carry the crypto secret safely on the web UI layer
  const secretKey = process.env.NEXT_PUBLIC_SECRET || "default-attendance-secret-12345"; 
  
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", keyMaterial, encoder.encode(raw));
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${lectureId}.${timestamp}.${hashHex}`;
}

export default function TeacherAttendanceHub() {
  const { data: session } = useSession();
  //@ts-ignore
  const userId = session?.user?.id;
  const [currentTime, setCurrentTime] = useState(new Date());

  // Modal & QR State
  const [activeQrLectureId, setActiveQrLectureId] = useState<string | null>(null);
  const [activeLectureName, setActiveLectureName] = useState<string>('');
  const [qrToken, setQrToken] = useState<string>('');
  const [countdown, setCountdown] = useState(3);
  
  // Track which lectures currently have an ongoing session { [lectureId]: sessionDocumentId }
  const [activeSessionsMap, setActiveSessionsMap] = useState<Record<string, string>>({});
  
  // Manual Requests State
  const [activeRequestsLectureId, setActiveRequestsLectureId] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState<string | null>(null);

  const d = new Date();
  const todayDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Keep time updated every minute to reactively show active lectures
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { data: lecturesData, isLoading } = useStrapi('lectures', {
    filters: userId ? {
      teacher: {
        user: {
          id: {
            $eq: userId
          }
        }
      }
    } : undefined,
    populate: [
      'class',
      'subject',
      'classroom',
      'teacher',
      'teacher.user'
    ]
  });

  const lectures = lecturesData?.data || [];

  const checkIsActive = (lecture: any) => {
    let currentDay = currentTime.getDay(); 
    currentDay = currentDay === 0 ? 7 : currentDay;
    const timeString = currentTime.toTimeString().slice(0, 5); // HH:mm - local
    const dateString = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')}`; // YYYY-MM-DD - local
    
    if (lecture.day_of_week !== currentDay) return false;
    
    const startStr = lecture.start_time?.slice(0,5);
    const endStr = lecture.end_time?.slice(0,5);
    
    if (timeString < startStr || timeString > endStr) return false;
    
    if (lecture.start_date && dateString < lecture.start_date) return false;
    if (lecture.end_date && dateString > lecture.end_date) return false;
    
    return true;
  };

  const handleStartSession = async (lectureId: string) => {
    try {
      await strapi.update('lectures', lectureId, { isSessionActive: true });
      toast.success("Session started!");
      setActiveSessionsMap(prev => ({ ...prev, [lectureId]: lectureId }));
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to start session.");
    }
  };

  const handleEndSession = async (lectureId: string) => {
    try {
      await strapi.update('lectures', lectureId, { isSessionActive: false });
      toast.success("Session ended.");
      setActiveSessionsMap(prev => {
        const m = { ...prev };
        delete m[lectureId];
        return m;
      });
      if (activeQrLectureId === lectureId) {
        closeModal();
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not end the session.");
    }
  };

  const openQrModal = async (lectureId: string, name: string) => {
     setActiveLectureName(name);
     setActiveQrLectureId(lectureId);
     setCountdown(3);
     const token = await generateAttendanceToken(lectureId);
     setQrToken(token);
  };

  const closeModal = () => {
    setActiveQrLectureId(null);
    setActiveRequestsLectureId(null);
    setQrToken('');
  };

  const handleApproveRequest = async (attendanceId: string) => {
    setIsApproving(attendanceId);
    try {
      await strapi.update('attendences', attendanceId, { currentStatus: 'present' });
      toast.success("Attendance approved!");
      // The useStrapi hook will need to be refreshed if we have nested data, 
      // but if we use it inside the modal it will auto-update if we manage mutate.
    } catch (err) {
      toast.error("Failed to approve attendance.");
    } finally {
      setIsApproving(null);
    }
  };

  // QR Token Rotation logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeQrLectureId) {
       interval = setInterval(async () => {
          setCountdown((prev) => {
             if (prev <= 1) {
                // Generate next token cleanly on the client layer using Web Crypto API
                generateAttendanceToken(activeQrLectureId).then(token => setQrToken(token));
                return 3;
             }
             return prev - 1;
          });
       }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeQrLectureId]);

  return (
    <div className="flex flex-col min-h-screen bg-background relative">
       <Header />
       <main className="flex-1 py-28 px-4 sm:px-6 lg:px-8">
         <ToastContainer position="top-right" autoClose={3000} />
         <div className="max-w-7xl mx-auto">
           {/* Section Header */}
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
             <div>
               <h1 className="text-4xl font-extrabold text-foreground mb-2 flex items-center gap-3">
                 Session & Attendance Hub
               </h1>
               <p className="text-foreground/60 max-w-2xl text-lg">
                 Activate any ongoing scheduled lecture to immediately start accepting secure dynamic QR attendance natively.
               </p>
             </div>
           </div>

           {/* Lectures List */}
           <div className="space-y-6">
              {!userId || isLoading ? (
                <div className="bg-foreground/[0.02] border border-foreground/10 rounded-2xl p-16 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                  <p className="text-foreground/60 font-medium">Loading your scheduled lectures...</p>
                </div>
              ) : lectures.length === 0 ? (
                <div className="bg-foreground/[0.02] border border-foreground/10 rounded-2xl p-16 text-center">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                     <BookOpen className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">No Lectures Bound</h3>
                  <p className="text-foreground/60">You haven't been assigned to direct any lectures right now.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {lectures.map((lectureBase: any, idx: number) => {
                    const lecture = lectureBase.attributes || lectureBase;
                    const lId = lectureBase.documentId || lectureBase.id;

                    const clsName = lecture.class?.data?.attributes?.name || lecture.class?.name || 'No Class Setup';
                    const subName = lecture.subject?.data?.attributes?.name || lecture.subject?.name || 'Pending Subject';
                    const roomName = lecture.classroom?.data?.attributes?.name || lecture.classroom?.name || 'Pending Room';
                    const dayName = DAYS.find(d => d.id === lecture.day_of_week)?.label || 'Unknown';
                    
                    const lectureTitle = lecture.name || subName;
                    const isActive = checkIsActive(lecture);
                    
                    const isSessionRunningForThis = !!activeSessionsMap[lId];

                    return (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={lId}
                        className={`bg-background rounded-2xl shadow-lg overflow-hidden flex flex-col relative transition-all ${isActive ? 'border-2 border-blue-500/50 shadow-blue-500/10' : 'border border-foreground/10'}`}
                      >
                         {/* Active Status Badge */}
                         {isActive && (
                            <div className="absolute top-0 right-0 px-4 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-bl-xl shadow-sm flex items-center gap-1.5 animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-white animate-ping absolute opacity-75"></span>
                              <span className="w-1.5 h-1.5 rounded-full bg-white relative"></span>
                              TAPPED AS ACTIVE SESSION
                            </div>
                         )}

                         <div className={`p-6 border-b border-foreground/10 ${isActive ? 'bg-blue-500/5' : 'bg-foreground/[0.02]'}`}>
                            <div className="flex justify-between items-start gap-4 mb-4 mt-2">
                               <div>
                                 <h3 className="text-2xl font-bold text-foreground mb-2 pr-12">{lectureTitle}</h3>
                                 <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="px-2.5 py-1 bg-purple-500/10 text-purple-600 text-xs font-bold rounded uppercase tracking-wider">
                                      {subName}
                                    </span>
                                    <span className="px-2.5 py-1 bg-foreground/5 text-foreground/70 text-xs font-bold rounded uppercase tracking-wider">
                                      {clsName}
                                    </span>
                                 </div>
                               </div>
                               <div className="flex flex-col items-end gap-1.5 text-sm font-medium text-foreground/60 shrink-0">
                                  <div className={`flex items-center gap-1.5 ${isActive ? 'text-blue-600 font-bold' : ''}`}>
                                    <Calendar className="w-4 h-4" /> {dayName}
                                  </div>
                                  <div className={`flex items-center gap-1.5 ${isActive ? 'text-blue-600 font-bold' : ''}`}>
                                    <Clock className="w-4 h-4" /> {lecture.start_time?.slice(0,5)} - {lecture.end_time?.slice(0,5)}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-orange-600 mt-1">
                                    <MapPin className="w-4 h-4" /> {roomName}
                                  </div>
                               </div>
                            </div>
                         </div>
                          <div className="p-5 flex-1 flex flex-col items-center justify-center bg-background">
                            {isActive ? (
                               <div className="w-full space-y-3">
                                 {isSessionRunningForThis ? (
                                   <div className="grid grid-cols-2 gap-3 w-full">
                                      <button 
                                        onClick={() => openQrModal(lId, lectureTitle)}
                                        className="py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-lg hover:-translate-y-0.5 flex justify-center items-center gap-2 group"
                                      >
                                         <QrCode className="w-5 h-5 group-hover:scale-110 transition-transform" /> Show QR
                                      </button>
                                      <button 
                                        onClick={() => handleEndSession(lId)}
                                        className="py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg hover:-translate-y-0.5 flex justify-center items-center gap-2 group"
                                      >
                                         <StopCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /> End Session
                                      </button>
                                   </div>
                                 ) : (
                                   <button 
                                     onClick={() => handleStartSession(lId)}
                                     className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex justify-center items-center gap-2 group"
                                   >
                                      <PlayCircle className="w-6 h-6 group-hover:scale-110 transition-transform" /> Start Session
                                   </button>
                                 )}

                                 <button 
                                   onClick={() => setActiveRequestsLectureId(lId)}
                                   className="w-full py-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 font-bold rounded-xl transition-all border border-orange-500/20 flex justify-center items-center gap-2 group"
                                 >
                                    <UserCheck className="w-5 h-5 group-hover:scale-110 transition-transform" /> View Manual Requests
                                 </button>
                               </div>
                            ) : (
                               <div className="w-full py-4 bg-foreground/5 text-foreground/40 font-semibold rounded-xl flex justify-center items-center text-center px-4 cursor-not-allowed border border-foreground/5">
                                  Gatekeeping closed outside of active lecture hours
                               </div>
                            )}
                          </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
           </div>
         </div>

         {/* Fullscreen QR Modal */}
         <AnimatePresence>
            {activeQrLectureId && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="absolute inset-0 bg-background/90 backdrop-blur-xl"
                   onClick={closeModal}
                 />
                 
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9, y: 30 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.9, y: 30 }}
                   className="relative bg-background border border-foreground/10 rounded-[2.5rem] p-8 md:p-12 w-full max-w-xl shadow-[0_0_80px_rgba(0,0,0,0.1)] flex flex-col items-center text-center"
                 >
                   <button 
                     onClick={closeModal} 
                     className="absolute top-6 right-6 p-3 bg-foreground/5 text-foreground/50 hover:text-foreground hover:bg-foreground/10 rounded-full transition-all"
                   >
                     <X className="w-6 h-6" />
                   </button>

                   <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-6 mt-4">
                     <QrCode className="w-8 h-8 text-blue-600" />
                   </div>

                   <h2 className="text-3xl font-black text-foreground mb-2">Scan to Register</h2>
                   <p className="text-foreground/60 mb-8 max-w-sm">Direct your students to scan this rolling QR code using their devices to guarantee presence for <strong className="text-foreground">{activeLectureName}</strong>.</p>
                   
                   <div className="bg-white p-6 rounded-3xl shadow-lg border-4 border-foreground/5">
                      {qrToken ? (
                         <div style={{ background: 'white', padding: '16px' }}>
                           <QRCode value={qrToken} size={256} className="w-full h-auto max-w-[250px] mx-auto" />
                         </div>
                      ) : (
                         <div className="w-[250px] h-[250px] flex items-center justify-center bg-gray-50 rounded-2xl">
                           <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                         </div>
                      )}
                   </div>

                   <div className="mt-8 flex items-center gap-3 px-6 py-3 bg-foreground/5 rounded-full">
                     <Clock className="w-4 h-4 text-foreground/50" />
                     <span className="text-sm font-bold text-foreground/70">
                       Auto-refreshing mathematically in <span className="text-blue-600 text-lg w-6 inline-block text-center">{countdown}</span>s
                     </span>
                   </div>
                 </motion.div>
               </div>
            )}
          </AnimatePresence>

          {/* Manual Requests Modal */}
          <AnimatePresence>
            {activeRequestsLectureId && (
              <RequestListOverlay 
                lectureId={activeRequestsLectureId} 
                todayDate={todayDate} 
                onClose={closeModal}
                handleApprove={handleApproveRequest}
                isApproving={isApproving}
              />
            )}
          </AnimatePresence>
        </main>
     </div>
  );
}

function RequestListOverlay({ lectureId, todayDate, onClose, handleApprove, isApproving }: any) {
  const { data: requestData, isLoading, mutate } = useStrapi('attendences', {
    filters: {
      lecture: { 
        [lectureId.length > 15 ? 'documentId' : 'id']: { $eq: lectureId } 
      },
      date: { $eq: todayDate },
      type: { $eq: 'manual' },
      currentStatus: { $eq: 'absent' }
    },
    populate: ['student', 'student.user']
  });

  const requests = requestData?.data || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/90 backdrop-blur-xl"
        onClick={onClose}
      />
      
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="relative bg-background border border-foreground/10 rounded-[2.5rem] p-8 md:p-10 w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-foreground/5 text-foreground/50 hover:text-foreground hover:bg-foreground/10 rounded-full transition-all">
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-600">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Manual Requests</h2>
            <p className="text-foreground/50 text-sm">Students who couldn't scan today's QR code.</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2" />
              <p className="text-sm text-foreground/40 font-medium">Fetching requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-foreground/5 rounded-3xl">
              <Check className="w-10 h-10 text-green-500 mx-auto mb-3 opacity-20" />
              <p className="text-foreground/50 font-bold italic">All manual requests cleared!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((att: any) => {
                const student = att.attributes?.student?.data?.attributes || att.student;
                const user = student?.user?.data?.attributes || student?.user;
                const attId = att.documentId;

                return (
                  <motion.div key={attId} layout className="p-4 bg-foreground/[0.02] border border-foreground/5 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        {user?.username?.slice(0,1).toUpperCase() || 'S'}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{user?.username || 'Unknown Student'}</p>
                        <p className="text-xs text-foreground/40 font-medium">{student?.studentId || 'ID Pending'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        await handleApprove(attId);
                        mutate(); // Refresh list
                      }}
                      disabled={isApproving === attId}
                      className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                      {isApproving === attId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Approve
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}