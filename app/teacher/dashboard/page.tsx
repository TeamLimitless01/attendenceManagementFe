"use client"
import React, { useState, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  Download, 
  Search, 
  Calendar, 
  ArrowUpDown, 
  Filter, 
  MoreHorizontal, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  FileSpreadsheet,
  FileText,
  UserCheck,
  LayoutDashboard,
  TrendingUp,
  AlertTriangle,
  Mail,
  MoreVertical
} from 'lucide-react';
import { useStrapi } from '@/lib/sdk/useStrapi';
import Header from '@/components/Header';

export default function TeacherDashboard() {
  const { data: session } = useSession();
  //@ts-ignore
  const userId = session?.user?.id;

  const [selectedLectureId, setSelectedLectureId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch Teacher's Lectures
  const { data: lecturesData, isLoading: lecturesLoading } = useStrapi('lectures', {
    filters: userId ? { teacher: { user: { id: { $eq: userId } } } } : undefined,
    populate: ['class', 'subject', 'students', 'students.user']
  });

  const lectures: any[] = lecturesData?.data || [];
  
  // Set initial selection
  useEffect(() => {
    if (lectures.length > 0 && !selectedLectureId) {
      setSelectedLectureId(lectures[0].documentId || lectures[0].id);
    }
  }, [lectures, selectedLectureId]);

  const selectedLecture = useMemo(() => 
    lectures.find((l: any) => (l.documentId || l.id) === selectedLectureId)?.attributes || 
    lectures.find((l: any) => (l.documentId || l.id) === selectedLectureId),
  [lectures, selectedLectureId]);

  // 2. Fetch ALL Attendance for this Lecture's Students
  const { data: attendanceData, isLoading: attendanceLoading } = useStrapi('attendences', {
    filters: selectedLectureId ? {
      lecture: { [selectedLectureId.length > 15 ? 'documentId' : 'id']: { $eq: selectedLectureId } }
    } : undefined,
    populate: ['student', 'student.user'],
    pagination: { limit: 1000 } 
  });

  const students = useMemo(() => {
    const raw = selectedLecture?.students?.data || selectedLecture?.students || [];
    return raw.map((s: any) => s.attributes || s);
  }, [selectedLecture]);

  const attendances = attendanceData?.data || [];

  // Transform Data for Table
  const studentStats = useMemo(() => {
    return students.map((stu: any) => {
      const sId = stu.documentId || stu.id;
      const stuAttendances = attendances.filter((att: any) => {
        const attStu = (att.attributes?.student?.data || att.student);
        const attSId = attStu?.documentId || attStu?.id;
        return attSId === sId;
      });

      const presentCount = stuAttendances.filter((att: any) => (att.attributes?.currentStatus || att.currentStatus) === 'present').length;
      
      const uniqueDates = Array.from(new Set(attendances.map((att: any) => att.attributes?.date || att.date)));
      const actualSessionsCount = Math.max(uniqueDates.length, 1);
      
      const percentage = Math.round((presentCount / actualSessionsCount) * 100);

      const latestAtt = stuAttendances.length > 0 
        ? [...stuAttendances].sort((a: any, b: any) => {
            const dateA = new Date(a.attributes?.date || a.date).getTime();
            const dateB = new Date(b.attributes?.date || b.date).getTime();
            return dateB - dateA;
          })[0]
        : null;

      return {
        id: sId,
        name: stu.user?.data?.attributes?.username || stu.user?.username || 'Unknown Student',
        email: stu.user?.data?.attributes?.email || stu.user?.email || 'N/A',
        rollNumber: stu.roll_number || 'STU-001',
        present: presentCount,
        total: actualSessionsCount,
        percentage,
        lastSeen: latestAtt ? ((latestAtt as any).attributes?.date || (latestAtt as any).date) : 'Never'
      };
    }).filter((s:any) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [students, attendances, searchQuery]);

  // ── Native CSV Export (No Libraries) ──────────────────────────────────
  const exportToCSV = () => {
    const headers = ['Student Name', 'Email', 'Roll Number', 'Present Sessions', 'Total Sessions', 'Attendance Rate (%)', 'Last Attendance'];
    const rows = studentStats.map((s: any) => [
      `"${s.name}"`,
      `"${s.email}"`,
      `"${s.rollNumber}"`,
      s.present,
      s.total,
      `${s.percentage}%`,
      `"${s.lastSeen}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Report_${selectedLecture?.name || 'Class'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (lecturesLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center">
           <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
           <p className="text-foreground/40 font-black uppercase text-[10px] tracking-widest">Compiling Analytics Data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full no-print">
        
        {/* Modern Dashboard Header */}
        <section className="relative mb-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase text-foreground/40 tracking-widest">Instructor Workspace</span>
             </div>
             <h1 className="text-5xl font-black text-foreground tracking-tight mb-2">
               Class Performance <span className="text-blue-600">Hub.</span>
             </h1>
             <p className="text-foreground/50 font-medium max-w-md text-lg">
               Generate master reports, monitor attendance depth, and track student consistency.
             </p>
           </motion.div>

           <div className="flex flex-wrap gap-4">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={exportToCSV}
                className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-600/20 transition-all flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export CSV Report
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePrint}
                className="px-6 py-4 bg-foreground hover:bg-foreground/80 text-background rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> Export PDF (Print Ready)
              </motion.button>
           </div>
        </section>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
           <div className="lg:col-span-2 relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-foreground/20 group-focus-within:text-blue-600 transition-colors">
                 <BookOpen className="w-5 h-5" />
              </div>
              <select 
                value={selectedLectureId} 
                onChange={(e) => setSelectedLectureId(e.target.value)}
                className="w-full h-20 pl-16 pr-6 bg-background border border-foreground/10 rounded-[2.5rem] text-lg font-black text-foreground appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer shadow-sm"
              >
                 {lectures.map((l: any) => (
                   <option key={l.documentId || l.id} value={l.documentId || l.id}>
                      {l.attributes?.name || l.name || 'Academic Course'} 
                      {l.attributes?.class?.data?.attributes?.name ? ` - ${l.attributes.class.data.attributes.name}` : ''}
                   </option>
                 ))}
              </select>
           </div>

           <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-foreground/20 group-focus-within:text-blue-600 transition-colors">
                 <Search className="w-5 h-5" />
              </div>
              <input 
                 type="text" 
                 placeholder="Search student..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full h-20 pl-16 pr-6 bg-background border border-foreground/10 rounded-[2.5rem] font-bold text-foreground focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
              />
           </div>

           <div className="bg-blue-600/5 border border-blue-500/10 rounded-[2.5rem] p-4 flex flex-col justify-center px-8">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Enrolled Count</p>
              <h4 className="text-3xl font-black text-blue-600 leading-none">{students.length}</h4>
           </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatsOverviewCard icon={<TrendingUp />} label="Avg. Class Consistency" value={`${Math.round(studentStats.reduce((a: any, b: any) => a + b.percentage, 0) / Math.max(studentStats.length, 1))}%`} color="blue" />
            <StatsOverviewCard icon={<Users />} label="Sessions Registry" value={Array.from(new Set(attendances.map((att: any) => (att as any).attributes?.date || (att as any).date))).length} color="green" />
            <StatsOverviewCard icon={<AlertTriangle />} label="Attendance Alerts" value={studentStats.filter((s: any) => s.percentage < 75).length} color="red" />
            <StatsOverviewCard icon={<Calendar />} label="Lecture Window" value={selectedLecture?.start_time?.slice(0, 5) || 'N/A'} color="purple" />
        </div>

        {/* Master Student Data Table */}
        <div className="overflow-hidden bg-background border border-foreground/10 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.04)] backdrop-blur-sm">
           <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse">
                 <thead>
                    <tr className="border-b border-foreground/5 bg-foreground/[0.01]">
                       <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-foreground/30 tracking-widest">Student Profile</th>
                       <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-foreground/30 tracking-widest text-center">Identity</th>
                       <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-foreground/30 tracking-widest w-48">Consistency</th>
                       <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-foreground/30 tracking-widest text-center">Score</th>
                       <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-foreground/30 tracking-widest">Eligibility</th>
                       <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-foreground/30 tracking-widest text-right"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-foreground/5">
                    {attendanceLoading ? (
                      <tr>
                        <td colSpan={6} className="py-20 text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                          <p className="text-[10px] font-black text-foreground/30 uppercase">Aggregating Records</p>
                        </td>
                      </tr>
                    ) : studentStats.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-24 text-center">
                          <Users className="w-12 h-12 text-foreground/10 mx-auto mb-4" />
                          <p className="text-xl font-bold text-foreground/40 italic">Query returned zero results.</p>
                        </td>
                      </tr>
                    ) : (
                      studentStats.map((student: any) => (
                        <tr key={student.id} className="hover:bg-foreground/[0.01] transition-colors group">
                           <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-2xl bg-foreground/5 border border-foreground/5 flex items-center justify-center text-foreground/60 font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-all">
                                   {student.name.charAt(0).toUpperCase()}
                                 </div>
                                 <div className="max-w-[200px]">
                                   <p className="font-black text-foreground leading-tight">{student.name}</p>
                                   <p className="text-[10px] font-bold text-foreground/30 truncate">{student.email}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-5 text-center font-bold text-foreground/60 text-sm tracking-tight">{student.rollNumber}</td>
                           <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                 <div className="flex-1 h-2 bg-foreground/5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${student.percentage >= 75 ? 'bg-blue-600' : 'bg-red-500'}`} style={{ width: `${student.percentage}%` }} />
                                 </div>
                                 <span className={`text-xs font-black ${student.percentage >= 75 ? 'text-foreground' : 'text-red-600'}`}>{student.percentage}%</span>
                              </div>
                           </td>
                           <td className="px-8 py-5 text-center">
                              <span className="px-3 py-1.5 bg-foreground/5 rounded-xl text-[10px] font-black text-foreground/50 uppercase tracking-tighter">
                                {student.present} <span className="text-foreground/20 font-light mx-0.5">/</span> {student.total}
                              </span>
                           </td>
                           <td className="px-8 py-5">
                              {student.percentage >= 75 ? (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase border border-blue-600/10 px-3 py-1 rounded-full">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> High Consistency
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-red-600 uppercase border border-red-600/10 px-3 py-1 rounded-full animate-pulse">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Below Target
                                </span>
                              )}
                           </td>
                           <td className="px-8 py-5 text-right">
                              <button className="p-2.5 text-foreground/10 hover:text-foreground transition-all">
                                <MoreVertical className="w-5 h-5" />
                              </button>
                           </td>
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>

      </main>

      {/* ── Formal PDF Report (Print Layout) ────────────────────────────────── */}
      <div className="print-only hidden p-10 bg-white text-black font-serif">
        <div className="mb-12 flex justify-between items-start border-b-4 border-black pb-8">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight mb-1">Official Attendance Registry</h1>
            <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">{selectedLecture?.name || 'Academic Course'} Departmental Records</p>
            <div className="mt-4 text-sm font-medium">
               <p>Academic Year: 2025-2026</p>
               <p>Term: Spring Semester</p>
               <p>Class: {selectedLecture?.class?.data?.attributes?.name || 'General Batch'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-black text-lg">Nexus Education Hub</p>
            <p className="text-gray-500 text-sm mt-1">Generated: {new Date().toLocaleString()}</p>
            <p className="text-gray-500 text-sm">Instructor: {session?.user?.name || 'Internal Registrar'}</p>
          </div>
        </div>

        <table className="w-full border-collapse mb-12">
          <thead>
             <tr className="bg-gray-100 border-y-2 border-black">
                <th className="p-4 text-left border border-gray-300 font-black uppercase text-[10px] tracking-widest">Student Information</th>
                <th className="p-4 text-left border border-gray-300 font-black uppercase text-[10px] tracking-widest">Roll Number</th>
                <th className="p-4 text-center border border-gray-300 font-black uppercase text-[10px] tracking-widest">Attended</th>
                <th className="p-4 text-center border border-gray-300 font-black uppercase text-[10px] tracking-widest">Held</th>
                <th className="p-4 text-right border border-gray-300 font-black uppercase text-[10px] tracking-widest">Percentage %</th>
             </tr>
          </thead>
          <tbody>
             {studentStats.map((s:any) => (
                <tr key={s.id} className="border border-gray-200">
                   <td className="p-4 border border-gray-300 font-bold">{s.name} <span className="text-[10px] font-normal text-gray-500 ml-2">({s.email})</span></td>
                   <td className="p-4 border border-gray-300">{s.rollNumber}</td>
                   <td className="p-4 border border-gray-300 text-center">{s.present}</td>
                   <td className="p-4 border border-gray-300 text-center">{s.total}</td>
                   <td className="p-4 border border-gray-300 text-right font-black">{s.percentage}%</td>
                </tr>
             ))}
          </tbody>
        </table>

        <div className="mt-32 grid grid-cols-2 gap-40 px-10">
           <div className="flex flex-col items-center">
              <div className="w-full border-t border-black mb-2" />
              <p className="font-bold uppercase text-[9px] tracking-widest">Instructor Signature</p>
              <p className="text-[10px] text-gray-400 mt-1 italic italic">Digital Identity Verified</p>
           </div>
           <div className="flex flex-col items-center">
              <div className="w-full border-t border-black mb-2" />
              <p className="font-bold uppercase text-[9px] tracking-widest">Department Seal & Approval</p>
              <p className="text-[10px] text-gray-400 mt-1 italic italic">Official Repository Record</p>
           </div>
        </div>

        <style jsx global>{`
          @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            body { background: white !important; color: black !important; }
            @page { margin: 1.5cm; }
          }
        `}</style>
      </div>
    </div>
  );
}

function StatsOverviewCard({ icon, label, value, color }: any) {
  const themes: any = {
    blue: 'text-blue-600 bg-blue-500/10',
    green: 'text-green-600 bg-green-500/10',
    red: 'text-red-600 bg-red-500/10',
    purple: 'text-purple-600 bg-purple-500/10'
  };

  return (
    <div className="bg-background border border-foreground/10 rounded-[2.5rem] p-8 shadow-sm group hover:border-blue-500/20 transition-all duration-300">
       <div className={`w-14 h-14 ${themes[color]} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
          {React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6" })}
       </div>
       <p className="text-[10px] font-black text-foreground/30 uppercase tracking-widest leading-none mb-2">{label}</p>
       <h4 className="text-3xl font-black text-foreground tracking-tighter">{value}</h4>
    </div>
  );
}
