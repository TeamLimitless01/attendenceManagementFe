"use client"
import React, { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserRound, 
  School, 
  CalendarCheck, 
  TrendingUp, 
  AlertCircle, 
  ArrowUpRight, 
  ShieldCheck, 
  UserPlus, 
  Settings,
  MoreVertical,
  Loader2,
  BookOpen,
  PieChart,
  Database,
  Fingerprint,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Briefcase,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { useStrapi } from '@/lib/sdk/useStrapi';
import Header from '@/components/Header';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: session } = useSession();

  // 1. Fetch Real Data from Strapi
  const { data: studentsData, isLoading: sLoading } = useStrapi('students', { pagination: { limit: 1000 } });
  const { data: teachersData, isLoading: tLoading } = useStrapi('teachers', { pagination: { limit: 1000 } });
  const { data: lecturesData, isLoading: lLoading } = useStrapi('lectures', { populate: ['class', 'subject', 'teacher'], pagination: { limit: 1000 } });
  const { data: classesData, isLoading: cLoading } = useStrapi('classes', { populate: ['students'], pagination: { limit: 1000 } });
  const { data: attendancesData, isLoading: aLoading } = useStrapi('attendences', { pagination: { limit: 1000 } });
  const { data: subjectsData, isLoading: subLoading } = useStrapi('subjects', { pagination: { limit: 1000 } });

  // 2. Derive Metrics from DB States (NO MOCKS)
  const metrics = useMemo(() => {
    const studentsArr = studentsData?.data || [];
    const teachersArr = teachersData?.data || [];
    const lecturesArr = lecturesData?.data || [];
    const classesArr = classesData?.data || [];
    const attendancesArr = attendancesData?.data || [];
    const subjectsArr = subjectsData?.data || [];

    const totalStudents = studentsArr.length;
    const totalTeachers = teachersArr.length;
    const totalClasses = classesArr.length;
    const totalSubjects = subjectsArr.length;
    const totalAttendanceRecords = attendancesArr.length;

    // Real Attendance % Calculation
    const presentCount = attendancesArr.filter((a:any) => {
        const status = a.attributes?.currentStatus || a.currentStatus;
        return status === 'present';
    }).length;
    const systemAttendancePct = totalAttendanceRecords > 0 ? Math.round((presentCount / totalAttendanceRecords) * 100) : 0;

    // Real Facial Registration Count
    const facialSyncedCount = studentsArr.filter((s:any) => {
        const reg = s.attributes?.isFaceRegistered || s.isFaceRegistered;
        return reg === true;
    }).length;

    // Departmental Statistics (By Class)
    const classPerformance = classesArr.map((cls: any) => {
        const clsStudents = cls.attributes?.students?.data || cls.students || [];
        const sIds = clsStudents.map((s:any) => s.documentId || s.id);
        const clsAtt = attendancesArr.filter((att: any) => {
            const attS = att.attributes?.student?.data || att.student;
            const attSId = attS?.documentId || attS?.id;
            return sIds.includes(attSId);
        });
        const clsPresent = clsAtt.filter((a:any) => (a.attributes?.currentStatus || a.currentStatus) === 'present').length;
        const clsPct = clsAtt.length > 0 ? Math.round((clsPresent / clsAtt.length) * 100) : 0;
        return {
            name: cls.attributes?.name || cls.name,
            count: sIds.length,
            percentage: clsPct
        };
    }).sort((a,b) => b.percentage - a.percentage);

    return {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        totalAttendanceRecords,
        systemAttendancePct,
        facialSyncedCount,
        topPerformingClasses: classPerformance.slice(0, 5),
        recentLectures: lecturesArr.slice(0, 5)
    };
  }, [studentsData, teachersData, lecturesData, classesData, attendancesData, subjectsData]);

  const isLoading = sLoading || tLoading || lLoading || cLoading || aLoading || subLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex-1 flex flex-row items-center justify-center gap-3">
           <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
           <span className="text-sm font-bold text-foreground/40 uppercase tracking-widest">Accessing Institutional Database</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFDFF] dark:bg-[#0A0A0B]">
      <Header />
      
      <main className="flex-1 pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        
        {/* Real Data Header */}
        <section className="mb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600">
                  <Database className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase text-foreground/40 tracking-widest">Institutional Data Audit</span>
             </div>
             <h1 className="text-5xl font-black text-foreground tracking-tight mb-2">
               Admin <span className="text-blue-600">Dashboard.</span>
             </h1>
             <p className="text-foreground/50 font-medium max-w-lg text-lg">
               Direct synchronization with the campus repository. Real-time metrics overview of active academic entities.
             </p>
           </motion.div>

           <div className="flex flex-wrap gap-4">
              <Link href="/admin/users" className="px-6 py-4 bg-foreground text-background rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-foreground/10">
                 <Users className="w-4 h-4" /> Faculty & Students
              </Link>
           </div>
        </section>

        {/* Core Database Metrics (Actual Counts) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <MetricCard 
                icon={<GraduationCap />} 
                label="Student Body" 
                value={metrics.totalStudents} 
                sub="Registered Students" 
                color="blue" 
            />
            <MetricCard 
                icon={<Briefcase />} 
                label="Teaching Faculty" 
                value={metrics.totalTeachers} 
                sub="Faculty Members" 
                color="indigo" 
            />
            <MetricCard 
                icon={<CalendarCheck />} 
                label="Total Sessions" 
                value={metrics.totalAttendanceRecords} 
                sub="Attendance Records" 
                color="emerald" 
            />
            <MetricCard 
                icon={<Fingerprint />} 
                label="Biometric IDs" 
                value={metrics.facialSyncedCount} 
                sub="Face Enrolled" 
                color="purple" 
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            
            {/* System Performance Overview */}
            <section className="lg:col-span-2 bg-background border border-foreground/10 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-xl font-black text-foreground">Global Attendance Score</h3>
                    <p className="text-[10px] font-black text-foreground/30 uppercase tracking-widest mt-1">Calculated presence across all sessions</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 font-black">
                     {metrics.systemAttendancePct}%
                  </div>
               </div>
               
               {/* Progress Bar with Real Data */}
               <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-[10px] font-black text-foreground/40 uppercase tracking-widest">
                     <span>Campus-Wide Consistency</span>
                     <span>{metrics.systemAttendancePct}%</span>
                  </div>
                  <div className="h-4 bg-foreground/5 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${metrics.systemAttendancePct}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                     />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-foreground/[0.02] rounded-[1.5rem] border border-foreground/5">
                     <p className="text-[10px] font-black text-foreground/30 uppercase mb-1">Academic Modules</p>
                     <p className="text-2xl font-black text-foreground">{metrics.totalSubjects} Subjects</p>
                  </div>
                  <div className="p-6 bg-foreground/[0.02] rounded-[1.5rem] border border-foreground/5">
                     <p className="text-[10px] font-black text-foreground/30 uppercase mb-1">Departments</p>
                     <p className="text-2xl font-black text-foreground">{metrics.totalClasses} Classes</p>
                  </div>
               </div>
            </section>

            {/* Quick Record Navigation */}
            <section className="bg-foreground text-background rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden flex flex-col justify-between">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
               <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-8 leading-tight tracking-tight">Institutional <br />Inventory.</h3>
                  <div className="space-y-4">
                     <QuickStat label="LMS Modules" value={metrics.totalSubjects} icon={<Layers />} />
                     <QuickStat label="Class Batches" value={metrics.totalClasses} icon={<School />} />
                     <QuickStat label="Faculty Points" value={metrics.totalTeachers} icon={<UserRound />} />
                  </div>
               </div>
               <Link href="/admin/lms" className="relative z-10 mt-10 py-5 bg-white/10 hover:bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest text-center transition-all">
                  Navigate To LMS Control <ArrowUpRight className="inline ml-1 w-4 h-4" />
               </Link>
            </section>
        </div>

        {/* Actionable Data Lists (REAL STRAPI RECORDS) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Class Consistency Leaderboard */}
            <section className="bg-background border border-foreground/10 rounded-[2.5rem] p-10 shadow-sm relative group overflow-hidden">
               <div className="flex items-center justify-between mb-8">
                  <h4 className="text-xl font-black text-foreground tracking-tight">Departmental Performance</h4>
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
               </div>
               <div className="space-y-4">
                  {metrics.topPerformingClasses.length === 0 ? (
                    <p className="text-sm font-bold text-foreground/20 italic text-center py-20">No departmental data available yet.</p>
                  ) : (
                    metrics.topPerformingClasses.map((cls, i) => (
                      <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-foreground/[0.01] hover:bg-foreground/[0.03] transition-all group/item border border-foreground/5">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white border border-foreground/5 rounded-xl flex items-center justify-center text-foreground font-black text-xs group-hover/item:text-blue-600 shadow-sm">
                              {i+1}
                            </div>
                            <div>
                               <p className="font-black text-foreground text-sm uppercase">{cls.name}</p>
                               <p className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest">{cls.count} Enrolled</p>
                            </div>
                         </div>
                         <div className="text-right">
                           <p className="text-sm font-black text-foreground">{cls.percentage}%</p>
                           <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Consistency Score</p>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </section>

            {/* Recent Institutional Audits */}
            <section className="bg-background border border-foreground/10 rounded-[2.5rem] p-10 shadow-sm overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-8">
                   <h4 className="text-xl font-black text-foreground tracking-tight">Registry Activity</h4>
                   <ClipboardList className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="space-y-4 flex-1">
                   {metrics.recentLectures.length === 0 ? (
                    <p className="text-sm font-bold text-foreground/20 italic text-center py-20">No registry entries found.</p>
                   ) : (
                    metrics.recentLectures.map((lec: any) => (
                      <div key={lec.id} className="p-5 border border-foreground/5 rounded-2xl flex items-center justify-between group hover:bg-foreground/[0.02] transition-colors">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                               <Layers className="w-6 h-6" />
                            </div>
                            <div>
                               <p className="font-black text-foreground text-sm uppercase leading-none mb-1.5">{lec.attributes?.name || lec.name}</p>
                               <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">{lec.attributes?.subject?.data?.attributes?.name || 'Faculty Unit'}</p>
                            </div>
                         </div>
                         <Link href={`/admin/lms`} className="w-10 h-10 rounded-full flex items-center justify-center text-foreground/20 hover:text-blue-600 hover:bg-blue-600/10 transition-all">
                            <ChevronRight className="w-5 h-5" />
                         </Link>
                      </div>
                    ))
                   )}
                </div>
            </section>

        </div>

      </main>
    </div>
  );
}

function MetricCard({ icon, label, value, sub, color }: any) {
  const themes: any = {
    blue: "text-blue-600 bg-blue-500/10",
    indigo: "text-indigo-600 bg-indigo-500/10",
    emerald: "text-emerald-600 bg-emerald-500/10",
    purple: "text-purple-600 bg-purple-500/10"
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-background border border-foreground/10 rounded-[2.5rem] p-8 shadow-sm group hover:border-blue-500/10 transition-all duration-300"
    >
       <div className={`w-14 h-14 ${themes[color]} rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform`}>
          {React.cloneElement(icon, { className: "w-6 h-6" })}
       </div>
       <p className="text-[10px] font-black text-foreground/30 uppercase tracking-widest mb-1">{label}</p>
       <h4 className="text-4xl font-black text-foreground tracking-tighter">{value}</h4>
       <p className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest mt-2">{sub}</p>
    </motion.div>
  );
}

function QuickStat({ label, value, icon }: any) {
    return (
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
            <div className="flex items-center gap-3">
                <span className="opacity-40">{icon}</span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</span>
            </div>
            <span className="font-black text-lg tracking-tighter">{value}</span>
        </div>
    );
}
