"use client"
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CheckCircle2, Loader2, MapPin, Clock, Calendar, ShieldCheck, ArrowLeft, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { strapi } from '@/lib/sdk/sdk';
import { useStrapi } from '@/lib/sdk/useStrapi';
import Header from '@/components/Header';
import Link from 'next/link';

function getDistanceFromLatLonInMeters(lat1: any, lon1: any, lat2: any, lon2: any) {
  const l1 = Number(lat1);
  const lo1 = Number(lon1);
  const l2 = Number(lat2);
  const lo2 = Number(lon2);

  const R = 6371e3; // Radius of the earth in m
  const dLat = (l2 - l1) * (Math.PI / 180);
  const dLon = (lo2 - lo1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(l1 * (Math.PI / 180)) * Math.cos(l2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in m
}

export default function SubmitAttendancePage() {
  const { data: session } = useSession();
  //@ts-ignore
  const userId = session?.user?.id;
  const router = useRouter();
  const params = useParams();
  const lectureId = params.lectureId as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'failed' | 'no_geofence'>('idle');
  const [locationError, setLocationError] = useState('');

  const todayDate = new Date().toISOString().split('T')[0];

  // Fetch Student Profile mapping to this User
  const { data: studentsData, isLoading: isLoadingStudent } = useStrapi('students', {
    filters: userId ? { user: { id: { $eq: userId } } } : undefined,
  });

  const student = studentsData?.data?.[0] as any;

  // Fetch Lecture Details for UI
  const { data: lectureData, isLoading: isLoadingLecture } = useStrapi(`lectures/${lectureId}`, {
    populate: '*'
  });

  const lectureAttr = (lectureData as any)?.data?.attributes || (lectureData as any)?.data;
  const classroomAttr = lectureAttr?.classroom?.data?.attributes || lectureAttr?.classroom;

  useEffect(() => {
    if (classroomAttr) {
      if (!classroomAttr.latitude || !classroomAttr.longitude || !classroomAttr.radius) {
        setVerificationStatus('no_geofence');
      }
    }
  }, [classroomAttr]);

  // Check for any existing attendance for today
  const { data: existingAttendanceData, isLoading: isLoadingExisting, mutate: mutateAttendance } = useStrapi('attendences', {
    filters: (student?.documentId || student?.id) && lectureId ? {
      student: {
        id: { $eq: student?.id }
      },
      lecture: {
        id: { $eq: (lectureData as any)?.data?.id }
      },
      date: {
        $eq: todayDate
      }
    } : undefined
  });

  const alreadyEvaluated = (existingAttendanceData?.data || []).length > 0;
  const isLoading = isLoadingStudent || isLoadingLecture || isLoadingExisting;

  const handleVerifyLocation = () => {
    setVerificationStatus('verifying');
    setLocationError('');
    
    if (!navigator.geolocation) {
      setVerificationStatus('failed');
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition((pos) => {
      const userLat = pos.coords.latitude;
      const userLon = pos.coords.longitude;
      
      const targetLat = classroomAttr.latitude;
      const targetLon = classroomAttr.longitude;
      const radius = Number(classroomAttr.radius);

      const distance = getDistanceFromLatLonInMeters(userLat, userLon, targetLat, targetLon);
      const hardwareAccuracyMargin = pos.coords.accuracy; // GPS inaccuracy in meters

      console.log("Device Lat/Lon:", userLat, userLon, "| Target Lat/Lon:", targetLat, targetLon, "| Distance:", distance, "m | Base Radius:", radius, "m | Hardware Error Margin:", hardwareAccuracyMargin, "m")
      
      // We must offset the geofence radius by the hardware's inherent inaccuracy bounds
      const dynamicallyAdjustedRadius = radius + (hardwareAccuracyMargin || 0);

      if (distance <= dynamicallyAdjustedRadius) {
        setVerificationStatus('verified');
        toast.success("Location verified successfully!");
      } else {
        setVerificationStatus('failed');
        setLocationError(`You are ~${Math.round(distance)}m away. You must be strictly within ${Math.round(dynamicallyAdjustedRadius)}m limits (including GPS error margins) of the assigned classroom locus.`);
      }
    }, (err) => {
      setVerificationStatus('failed');
      setLocationError(err.message || "Failed to get location. Please allow location permissions.");
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  };

  const handleSaveAttendance = async () => {
    if (!student) {
      toast.error("Could not verify your student profile.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create the Attendance Record
      const res = await strapi.create('attendences', {
        student: student.documentId || student.id,
        lecture: lectureId,
        date: todayDate,
      });

      toast.success("Attendance verified and saved!");
      await mutateAttendance();
      
      setTimeout(() => {
         router.push('/student/mylectures');
      }, 1500);

    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error?.message || "Failed to submit attendance.");
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

            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-background rounded-3xl shadow-2xl border border-foreground/10 overflow-hidden"
            >
               <div className="px-8 py-10 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  
                  <div className="w-20 h-20 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                     <ShieldCheck className="w-10 h-10 text-green-500" />
                     {alreadyEvaluated && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-background text-white">
                           <CheckCircle2 className="w-4 h-4" />
                        </div>
                     )}
                  </div>
                  
                  <h1 className="text-2xl font-extrabold text-foreground mb-2">
                    {alreadyEvaluated ? 'Attendance Registered' : 'Verify Attendance'}
                  </h1>
                  
                  <p className="text-foreground/60 text-sm">
                    {alreadyEvaluated 
                      ? "Your attendance for this active lecture has already been successfully recorded for today."
                      : "Confirm your presence for the active lecture session below."}
                  </p>

                  {/* Geofence Alert Notice */}
                  {!alreadyEvaluated && verificationStatus !== 'no_geofence' && verificationStatus !== 'verified' && (
                     <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-600 text-xs font-bold rounded-lg border border-orange-500/20">
                       <MapPin className="w-4 h-4" /> GPS Location Verification Required
                     </div>
                  )}
               </div>

               <div className="px-8 py-6 border-t border-foreground/10 bg-foreground/[0.02]">
                  <div className="bg-background border border-foreground/10 rounded-2xl p-5 space-y-4">
                     <div>
                        <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1">Lecture Context</p>
                        <p className="font-bold text-foreground text-lg">{lectureAttr.name || lectureAttr.subject?.data?.attributes?.name || lectureAttr.subject?.name || 'Ongoing Session'}</p>
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
                              <p className="text-sm font-semibold text-foreground/80">{lectureAttr.start_time?.slice(0,5)} - {lectureAttr.end_time?.slice(0,5)}</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-2.5 col-span-2">
                           <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                           <div>
                              <p className="text-xs font-bold text-foreground/40 uppercase">Assigned Location</p>
                              <p className="text-sm font-semibold text-foreground/80">
                                 {classroomAttr?.name || 'Standard Room'}
                                 {classroomAttr?.radius && ` (Geofence: ${classroomAttr.radius}m)`}
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="p-8 bg-background border-t border-foreground/10">
                  <AnimatePresence mode="wait">
                     {alreadyEvaluated ? (
                        <motion.div 
                          key="done"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="w-full py-4 bg-green-500/10 text-green-600 font-bold rounded-2xl flex justify-center items-center gap-2 border border-green-500/20"
                        >
                           <CheckCircle2 className="w-5 h-5" /> Verified for Today
                        </motion.div>
                     ) : (
                        <motion.div key="action_area" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                           {locationError && (
                              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-sm font-medium text-center">
                                 {locationError}
                              </div>
                           )}

                           {(verificationStatus === 'idle' || verificationStatus === 'verifying' || verificationStatus === 'failed') && (
                              <button 
                                onClick={handleVerifyLocation}
                                disabled={verificationStatus === 'verifying'}
                                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex justify-center items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
                              >
                                {verificationStatus === 'verifying' ? (
                                   <><Loader2 className="w-5 h-5 animate-spin" /> Verifying Accuracy...</>
                                ) : (
                                   <><Navigation className="w-5 h-5" /> Verify My Location</>
                                )}
                              </button>
                           )}

                           {(verificationStatus === 'verified' || verificationStatus === 'no_geofence') && (
                              <button 
                                onClick={handleSaveAttendance}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex justify-center items-center gap-2"
                              >
                                 {isSubmitting ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Recording...</>
                                 ) : (
                                    <><ShieldCheck className="w-5 h-5" /> Guarantee Presence</>
                                 )}
                              </button>
                           )}
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            </motion.div>
         </div>
       </main>
    </div>
  );
}