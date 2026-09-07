"use client"
import React, { useState, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useStrapi } from '@/lib/sdk/useStrapi';
import Header from '@/components/Header';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentDashboard() {
  const { data: session } = useSession();
  //@ts-ignore
  const userId = session?.user?.id;

  const [selectedLectureId, setSelectedLectureId] = useState<string>('');

  // 1. Fetch Enrolled Lectures
  const { data: lecturesData, isLoading: lecturesLoading } = useStrapi('lectures', {
    filters: userId ? { students: { user: { id: { $eq: userId } } } } : undefined,
    populate: ['subject', 'teacher']
  });

  const lectures: any[] = lecturesData?.data || [];

  useEffect(() => {
    if (lectures.length > 0 && !selectedLectureId) {
      setSelectedLectureId(lectures[0].documentId || lectures[0].id);
    }
  }, [lectures, selectedLectureId]);

  const selectedLecture = useMemo(() =>
    lectures.find((l: any) => (l.documentId || l.id) === selectedLectureId)?.attributes ||
    lectures.find((l: any) => (l.documentId || l.id) === selectedLectureId),
    [lectures, selectedLectureId]);

  // 2. Fetch ALL Attendance for this Lecture (we will filter by this student)
  const { data: attendanceData, isLoading: attendanceLoading } = useStrapi('attendences', {
    filters: selectedLectureId && userId ? {
      lecture: { [selectedLectureId.length > 15 ? 'documentId' : 'id']: { $eq: selectedLectureId } },
      student: { user: { id: { $eq: userId } } }
    } : undefined,
    populate: ['student', 'student.user'],
    pagination: { limit: 1000 }
  });

  const attendances = attendanceData?.data || [];

  // Transform Data
  const uniqueDatesArray = Array.from(new Set(attendances.map((att: any) => att.attributes?.date || att.date))).sort() as string[];
  const actualSessionsCount = Math.max(uniqueDatesArray.length, 1);
  const presentCount = attendances.filter((att: any) => (att.attributes?.currentStatus || att.currentStatus) === 'present').length;
  const percentage = Math.round((presentCount / actualSessionsCount) * 100);

  const chartData = useMemo(() => {
    let runningTotal = 0;
    return uniqueDatesArray.map((date, index) => {
      const attForDate = attendances.find((a: any) => (a.attributes?.date || a.date) === date);
      //@ts-ignore
      const isPresent = (attForDate?.attributes?.currentStatus || attForDate?.currentStatus) === 'present';
      if (isPresent) runningTotal++;

      const cumulativeRate = Math.round((runningTotal / (index + 1)) * 100);
      return {
        name: new Date(date as string).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        rate: cumulativeRate
      };
    });
  }, [uniqueDatesArray, attendances]);

  const sortedAttendances = useMemo(() => {
    return [...attendances].sort((a: any, b: any) => {
      const dateA = new Date(a.attributes?.date || a.date).getTime();
      const dateB = new Date(b.attributes?.date || b.date).getTime();
      return dateB - dateA;
    });
  }, [attendances]);

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

      <main className="flex-1 pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

        <section className="relative mb-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase text-foreground/40 tracking-widest">Student Workspace</span>
            </div>
            <h1 className="text-5xl font-black text-foreground tracking-tight mb-2">
              My Analytics <span className="text-blue-600">Hub.</span>
            </h1>
            <p className="text-foreground/50 font-medium max-w-md text-lg">
              Track your day-by-day attendance history and ensure you meet eligibility requirements.
            </p>
          </motion.div>
        </section>

        {/* Filters */}
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
              {lectures.length === 0 && <option value="">No Lectures Enrolled</option>}
              {lectures.map((l: any) => (
                <option key={l.documentId || l.id} value={l.documentId || l.id}>
                  {l.attributes?.name || l.name || 'Academic Course'}
                </option>
              ))}
            </select>
          </div>

          <div className={`col-span-2 border rounded-[2.5rem] p-4 flex items-center justify-between px-8 shadow-sm transition-all ${percentage >= 75 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${percentage >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>Cumulative Consistency</p>
              <h4 className={`text-4xl font-black leading-none ${percentage >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>{percentage}%</h4>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1">Present / Total</p>
              <h4 className="text-xl font-black text-foreground">{presentCount} <span className="text-foreground/30 font-light mx-1">/</span> {actualSessionsCount}</h4>
            </div>
          </div>
        </div>

        {/* Analytics Chart */}
        {chartData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 bg-background border border-foreground/10 rounded-[3rem] p-8 shadow-sm">
            <h3 className="text-xl font-black text-foreground mb-6 pl-2">Cumulative Consistency Trend</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                  <Tooltip
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [`${value}% Cumulative`, 'Consistency']}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={4} dot={{ strokeWidth: 4, r: 4 }} activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Day-by-Day Table */}
        <div className="overflow-hidden bg-background border border-foreground/10 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.04)] backdrop-blur-sm mb-20">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-foreground/5 bg-foreground/[0.01]">
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-foreground/30 tracking-widest">Date</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-foreground/30 tracking-widest">Time</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-foreground/30 tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {attendanceLoading ? (
                  <tr>
                    <td colSpan={3} className="py-20 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                      <p className="text-[10px] font-black text-foreground/30 uppercase">Fetching History</p>
                    </td>
                  </tr>
                ) : sortedAttendances.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-24 text-center">
                      <Calendar className="w-12 h-12 text-foreground/10 mx-auto mb-4" />
                      <p className="text-xl font-bold text-foreground/40 italic">No attendance records found.</p>
                    </td>
                  </tr>
                ) : (
                  sortedAttendances.map((att: any) => {
                    const isPresent = (att.attributes?.currentStatus || att.currentStatus) === 'present';
                    const dateRaw = att.attributes?.date || att.date;
                    const timeRaw = att.attributes?.time || att.time;

                    return (
                      <tr key={att.documentId || att.id} className="hover:bg-foreground/[0.01] transition-colors">
                        <td className="px-8 py-6 font-bold text-foreground">
                          {new Date(dateRaw).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-8 py-6 text-foreground/60 font-medium">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" /> {timeRaw || 'N/A'}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          {isPresent ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 uppercase border border-emerald-600/20 bg-emerald-500/10 px-4 py-2 rounded-full">
                              <CheckCircle2 className="w-4 h-4" /> Present
                              {(att.attributes?.type || att.type) === 'manual' && <span className="text-[9px] opacity-60 ml-1">(Manual)</span>}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-black text-red-600 uppercase border border-red-600/20 bg-red-500/10 px-4 py-2 rounded-full">
                              <XCircle className="w-4 h-4" /> Absent
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
