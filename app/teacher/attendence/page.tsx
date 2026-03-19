"use client"
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Search, Calendar, BookOpen, Clock, Loader2, MapPin, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useStrapi } from '@/lib/sdk/useStrapi';

const DAYS = [
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
  { id: 7, label: 'Sunday' },
];

export default function StudentMyLecturesPage() {
  const { data: session } = useSession();
  //@ts-ignore
  const userId =  session?.user?.id;
  const [currentTime, setCurrentTime] = useState(new Date());

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
    // Determine current day 1-7 mapping
    let currentDay = currentTime.getDay(); // 0 = Sunday, 1 = Monday
    currentDay = currentDay === 0 ? 7 : currentDay;
    
    // Time strings to HH:mm for easy comparison
    const timeString = currentTime.toTimeString().slice(0, 5); // HH:mm
    const dateString = currentTime.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (lecture.day_of_week !== currentDay) return false;
    
    const startStr = lecture.start_time?.slice(0,5);
    const endStr = lecture.end_time?.slice(0,5);
    
    if (timeString < startStr || timeString > endStr) return false;
    
    if (lecture.start_date && dateString < lecture.start_date) return false;
    if (lecture.end_date && dateString > lecture.end_date) return false;
    
    return true;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
       <Header />
       <main className="flex-1 py-28 px-4 sm:px-6 lg:px-8">
         <div className="max-w-7xl mx-auto">
           {/* Section Header */}
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
             <div>
               <h1 className="text-4xl font-extrabold text-foreground mb-2 flex items-center gap-3">
                 My Enrolled Lectures
               </h1>
               <p className="text-foreground/60 max-w-2xl text-lg">
                 View all the lectures you are currently enrolled in. You can submit your attendance when a lecture is active.
               </p>
             </div>
           </div>

           {/* Lectures List */}
           <div className="space-y-6">
              {!userId || isLoading ? (
                <div className="bg-foreground/[0.02] border border-foreground/10 rounded-2xl p-16 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                  <p className="text-foreground/60 font-medium">Loading your enrolled lectures...</p>
                </div>
              ) : lectures.length === 0 ? (
                <div className="bg-foreground/[0.02] border border-foreground/10 rounded-2xl p-16 text-center">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                     <BookOpen className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">No Enrolled Lectures</h3>
                  <p className="text-foreground/60">You haven't been added to any lectures yet. Please contact your teachers.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {lectures.map((lectureBase: any, idx: number) => {
                    const lecture = lectureBase.attributes || lectureBase;
                    const lId = lectureBase.documentId || lectureBase.id;

                    const clsName = lecture.class?.data?.attributes?.name || lecture.class?.name || 'No Class';
                    const subName = lecture.subject?.data?.attributes?.name || lecture.subject?.name || 'No Subject';
                    const roomName = lecture.classroom?.data?.attributes?.name || lecture.classroom?.name || 'TBD';
                    const teacherName = lecture.teacher?.data?.attributes?.name || lecture.teacher?.name || 'Assigned Teacher';
                    const dayName = DAYS.find(d => d.id === lecture.day_of_week)?.label || 'Unknown';
                    
                    const isActive = checkIsActive(lecture);

                    return (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={lId}
                        className={`bg-background rounded-2xl shadow-lg overflow-hidden flex flex-col relative transition-all ${isActive ? 'border-2 border-green-500/50 shadow-green-500/10' : 'border border-foreground/10'}`}
                      >
                         {/* Active Status Badge */}
                         {isActive && (
                            <div className="absolute top-0 right-0 px-4 py-1.5 bg-green-500 text-white text-xs font-bold rounded-bl-xl shadow-sm flex items-center gap-1.5 animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-white animate-ping absolute opacity-75"></span>
                              <span className="w-1.5 h-1.5 rounded-full bg-white relative"></span>
                              CLASS ACTIVE NOW
                            </div>
                         )}

                         <div className={`p-6 border-b border-foreground/10 ${isActive ? 'bg-green-500/5' : 'bg-foreground/[0.02]'}`}>
                            <div className="flex justify-between items-start gap-4 mb-4 mt-2">
                               <div>
                                 <h3 className="text-2xl font-bold text-foreground mb-2 pr-12">{lecture.name || subName}</h3>
                                 <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="px-2.5 py-1 bg-purple-500/10 text-purple-600 text-xs font-bold rounded uppercase tracking-wider">
                                      {subName}
                                    </span>
                                    <span className="px-2.5 py-1 bg-foreground/5 text-foreground/70 text-xs font-bold rounded uppercase tracking-wider">
                                      Prof. {teacherName}
                                    </span>
                                 </div>
                               </div>
                               <div className="flex flex-col items-end gap-1.5 text-sm font-medium text-foreground/60 shrink-0">
                                  <div className={`flex items-center gap-1.5 ${isActive ? 'text-green-600 font-bold' : ''}`}>
                                    <Calendar className="w-4 h-4" /> {dayName}
                                  </div>
                                  <div className={`flex items-center gap-1.5 ${isActive ? 'text-green-600 font-bold' : ''}`}>
                                    <Clock className="w-4 h-4" /> {lecture.start_time?.slice(0,5)} - {lecture.end_time?.slice(0,5)}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-blue-600 mt-1">
                                    <MapPin className="w-4 h-4" /> {roomName}
                                  </div>
                               </div>
                            </div>
                         </div>
                         <div className="p-5 flex-1 flex flex-col items-center justify-center bg-background">
                            {isActive ? (
                               <Link href={`/student/attendence/${lId}`} className="w-full">
                                  <button className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex justify-center items-center gap-2">
                                     <CheckCircle2 className="w-6 h-6" /> Submit Attendance Now
                                  </button>
                               </Link>
                            ) : (
                               <div className="w-full py-4 bg-foreground/5 text-foreground/40 font-semibold rounded-xl flex justify-center items-center text-center px-4 cursor-not-allowed border border-foreground/5">
                                  Attendance is closed outside of active lecture hours
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
       </main>
    </div>
  );
}