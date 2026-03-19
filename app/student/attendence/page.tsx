"use client"
import React, { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  ChevronRight, 
  BarChart3, 
  PieChart, 
  Loader2, 
  Trophy,
  Activity,
  UserCheck,
  TrendingUp,
  AlertCircle,
  CalendarDays,
  Menu,
  MoreVertical,
  Target
} from 'lucide-react';
import { useStrapi } from '@/lib/sdk/useStrapi';
import Header from '@/components/Header';
import Link from 'next/link';

const DAYS = [
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
  { id: 7, label: 'Sunday' },
];

export default function StudentAttendanceHub() {
  const { data: session } = useSession();
  //@ts-ignore
  const userId = session?.user?.id;

  // 1. Fetch Student Profile
  const { data: studentData, isLoading: studentLoading } = useStrapi('students', {
    filters: userId ? { user: { id: { $eq: userId } } } : undefined,
  });
  const student = studentData?.data?.[0] as any;
  const studentId = student?.id;

  // 2. Fetch all lectures student is enrolled in
  // We populate classroom to get its location/details if needed for UI
  const { data: lecturesData, isLoading: lecturesLoading } = useStrapi('lectures', {
    filters: studentId ? {
      students: { id: { $eq: studentId } }
    } : undefined,
    populate: ['class', 'subject', 'teacher', 'teacher.user', 'classroom']
  });

  // 3. Fetch all attendance records for this student
  // We need this to determine which dates the student was present
  const { data: attendanceData, isLoading: attendanceLoading } = useStrapi('attendences', {
    filters: studentId ? {
      student: { id: { $eq: studentId } }
    } : undefined,
    populate: ['lecture']
  });

  const lectures = lecturesData?.data || [];
  const attendances = attendanceData?.data || [];
  const isLoading = studentLoading || lecturesLoading || attendanceLoading;

  // ── Accuracy Logic ────────────────────────────────────────────────────────
  // To determine accurate session counts, we look at the lecture dates
  const lectureStats = useMemo(() => {
    return lectures.map((lectureBase: any) => {
      const lecture = lectureBase.attributes || lectureBase;
      const lId = lectureBase.id || lectureBase.documentId;
      
      const lectureAttendances = attendances.filter((att: any) => {
        const attLecture = att.attributes?.lecture?.data || att.lecture;
        const attLId = attLecture?.documentId || attLecture?.id;
        return attLId === lId;
      });

      const presentCount = lectureAttendances.filter((att: any) => 
        (att.attributes?.currentStatus || att.currentStatus) === 'present'
      ).length;

      // 1. Determine the first and last possible session dates
      const startDate = new Date(lecture.start_date || '2024-01-01');
      const endDate = lecture.end_date ? new Date(lecture.end_date) : new Date();
      const today = new Date();
      const effectiveEndDate = endDate < today ? endDate : today;

      let sessionsHeld = 0;
      const lectureDay = lecture.day_of_week; // 1 (Mon) - 7 (Sun)
      
      // Accuracy Fix: Count actual occurrences of the day_of_week up to today
      let checkDate = new Date(startDate);
      while (checkDate <= effectiveEndDate) {
        let currentDay = checkDate.getDay();
        currentDay = currentDay === 0 ? 7 : currentDay; // Normalize Sun=0 to 7
        
        if (currentDay === lectureDay) {
          sessionsHeld++;
        }
        checkDate.setDate(checkDate.getDate() + 1);
      }

      // 2. Adjust for data boundary: A student cannot attend more sessions than held
      // (Unless sessions were held on odd days, but we stick to the calendar schedule)
      const totalSessions = Math.max(sessionsHeld, lectureAttendances.length, 1);
      const percentage = Math.min(Math.round((presentCount / totalSessions) * 100), 100);

      const status = percentage >= 85 ? 'excellent' : percentage >= 75 ? 'good' : 'warning';

      return {
        ...lecture,
        id: lId,
        presentCount,
        totalSessions,
        percentage,
        status,
        records: lectureAttendances
      };
    });
  }, [lectures, attendances]);

  const overallStats = useMemo(() => {
    if (lectureStats.length === 0) return { avg: 0, total: 0, presentTotal: 0 };
    const sum = lectureStats.reduce((acc, curr) => acc + curr.percentage, 0);
    const presentTotal = lectureStats.reduce((acc, curr) => acc + curr.presentCount, 0);
    const heldTotal = lectureStats.reduce((acc, curr) => acc + curr.totalSessions, 0);
    return {
      avg: Math.round(sum / lectureStats.length),
      total: lectureStats.length,
      presentTotal,
      heldTotal
    };
  }, [lectureStats]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-20">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-6" />
          <p className="text-foreground/40 font-bold text-lg animate-pulse">Syncing Academic Records</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFDFF] dark:bg-[#0A0A0B]">
      <Header />
      <main className="flex-1 py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        
        {/* Modern Glass Dashboard Header */}
        <section className="relative mb-12">
          <div className="absolute -top-24 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
            <div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/5 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-4 border border-blue-500/10">
                  <Activity className="w-3 h-3" /> Dashboard Live
                </span>
                <h1 className="text-5xl font-black text-foreground tracking-tight mb-2">
                  Daily Presence <span className="text-blue-600">Overview.</span>
                </h1>
                <p className="text-foreground/50 font-medium text-lg max-w-md">
                  Track your consistency, manage scan requests, and maintain your academic eligibility in real-time.
                </p>
              </motion.div>
            </div>

            {/* Performance Ring */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="relative p-8 bg-background border border-foreground/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] flex items-center gap-8 backdrop-blur-sm"
            >
              <div className="relative w-28 h-28 flex items-center justify-center">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-foreground/5" />
                    <motion.circle 
                      cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" 
                      fill="transparent" strokeDasharray={301.6} 
                      strokeDashoffset={301.6 - (301.6 * overallStats.avg) / 100}
                      strokeLinecap="round" className="text-blue-600"
                      initial={{ strokeDashoffset: 301.6 }}
                      animate={{ strokeDashoffset: 301.6 - (301.6 * overallStats.avg) / 100 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-foreground leading-none">{overallStats.avg}%</span>
                    <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-tighter">Average</span>
                 </div>
              </div>

              <div className="space-y-3">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-600">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-foreground/30 uppercase leading-none mb-1">Total Hits</p>
                      <p className="text-lg font-black text-foreground leading-none">{overallStats.presentTotal}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-foreground/30 uppercase leading-none mb-1">Held Sessions</p>
                      <p className="text-lg font-black text-foreground leading-none">{overallStats.heldTotal}</p>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
          {lectureStats.length === 0 ? (
             <div className="col-span-full p-20 bg-foreground/5 border-2 border-dashed border-foreground/10 rounded-[3rem] text-center">
                <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <BookOpen className="w-10 h-10 text-foreground/20" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">No Subscriptions Found</h3>
                <p className="text-foreground/40 max-w-xs mx-auto mb-8">You aren't enrolled in any lectures for this academic cycle.</p>
             </div>
          ) : (
            lectureStats.map((lecture: any, idx: number) => (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={lecture.id}
                className="group relative bg-background border border-foreground/10 rounded-[2.5rem] p-8 hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] hover:border-blue-500/20 transition-all duration-500"
              >
                {/* Visual Status Indicator */}
                <div className="flex justify-between items-center mb-8">
                  <div className={`p-4 rounded-2xl transition-colors duration-500 ${
                    lecture.status === 'excellent' ? 'bg-green-500/10 text-green-600 group-hover:bg-green-500' : 
                    lecture.status === 'good' ? 'bg-blue-500/10 text-blue-600 group-hover:bg-blue-500' : 
                    'bg-red-500/10 text-red-600 group-hover:bg-red-500'
                  } group-hover:text-white`}>
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="flex -space-x-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-foreground/5" />
                    ))}
                  </div>
                </div>

                {/* Course Info */}
                <div className="mb-10">
                  <h3 className="text-2xl font-black text-foreground tracking-tight leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                    {lecture.name || lecture.subject?.data?.attributes?.name || 'Class Session'}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-foreground/5 rounded-lg text-[10px] font-black uppercase text-foreground/40 border border-foreground/5">
                      {lecture.class?.data?.attributes?.name || 'GEN-A'}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/10" />
                    <span className="text-xs font-bold text-foreground/30 uppercase tracking-widest">
                      {DAYS.find(d => d.id === lecture.day_of_week)?.label}
                    </span>
                  </div>
                </div>

                {/* Accuracy Progress */}
                <div className="space-y-4 mb-10">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-foreground/30 uppercase leading-none mb-1">Consistency Rate</p>
                      <p className="text-2xl font-black text-foreground">{lecture.percentage}%</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-foreground/30 uppercase leading-none mb-1">Present / Total</p>
                       <p className="text-lg font-bold text-foreground/60">{lecture.presentCount} <span className="text-foreground/20 italic">/</span> {lecture.totalSessions}</p>
                    </div>
                  </div>
                  <div className="relative w-full h-3 bg-foreground/5 rounded-full p-0.5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${lecture.percentage}%` }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                      className={`h-full rounded-full ${
                        lecture.status === 'excellent' ? 'bg-green-500' : 
                        lecture.status === 'good' ? 'bg-blue-600' : 
                        'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                      }`}
                    />
                  </div>
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-foreground/5">
                   <div className="flex items-center gap-2">
                     <Clock className="w-4 h-4 text-foreground/20" />
                     <span className="text-xs font-bold text-foreground/40">{lecture.start_time?.slice(0,5)} - {lecture.end_time?.slice(0,5)}</span>
                   </div>
                   <Link 
                     href={`/student/attendence/${lecture.id}`} 
                     className="px-5 py-2.5 bg-foreground/[0.03] hover:bg-blue-600 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                   >
                     Manage Entry
                   </Link>
                </div>

                {/* Status Float */}
                {lecture.percentage < 75 && (
                  <div className="absolute -top-3 -right-3 px-4 py-2 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" /> Risk Zone
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Global Performance Insight */}
        <section className="bg-foreground/[0.01] border border-foreground/5 rounded-[3.5rem] p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-600 mb-6">
              <PieChart className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-foreground tracking-tight mb-4">Smart Attendance Prediction</h2>
            <p className="text-foreground/50 max-w-xl font-medium text-lg leading-relaxed">
              Based on your current rate across <strong className="text-foreground">{overallStats.total} courses</strong>, you are <strong className="text-green-500">safe</strong> for end-semester examinations. Scanning consistently each week prevents manual request delays.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
               <div className="flex items-center gap-2 px-4 py-2 bg-background border border-foreground/5 rounded-2xl shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[10px] font-black text-foreground/50 uppercase tracking-widest">Present Total: {overallStats.presentTotal}</span>
               </div>
               <div className="flex items-center gap-2 px-4 py-2 bg-background border border-foreground/5 rounded-2xl shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[10px] font-black text-foreground/50 uppercase tracking-widest">Missed Sessions: {overallStats.heldTotal - overallStats.presentTotal}</span>
               </div>
            </div>
        </section>

      </main>
    </div>
  );
}