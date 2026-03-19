"use client"
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Plus, Search, Users as UsersIcon, X, Calendar, BookOpen, Clock, Loader2, MapPin } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '@/components/Header';
import { strapi } from '@/lib/sdk/sdk';
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

export default function MyLecturesPage() {
  const { data: session } = useSession();
  const userId:any = session?.user?.id;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState<any>(null);
  const [addingStudentId, setAddingStudentId] = useState<string | null>(null);

  const { data: lecturesData, isLoading, mutate } = useStrapi('lectures', {
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
      'class.students', 
      'class.students.user', 
      'students', 
      'students.user', 
      'subject', 
      'classroom'
    ]
  });

  const lectures = lecturesData?.data || [];

  const handleOpenAddStudent = (lecture: any) => {
    setSelectedLecture(lecture);
    setIsModalOpen(true);
  };

  const handleAddStudentToLecture = async (studentDocId: string) => {
    if (!selectedLecture) return;
    
    setAddingStudentId(studentDocId);
    try {
      const lectureAttr = selectedLecture.attributes || selectedLecture;
      const lectureDocId = selectedLecture.documentId || selectedLecture.id;
      
      const currentStudentIds = (lectureAttr.students?.data || lectureAttr.students || []).map((s: any) => s.documentId || s.id);
      
      const uniqueNewStudents = Array.from(new Set([...currentStudentIds, studentDocId]));

      await strapi.update('lectures', lectureDocId, {
        students: uniqueNewStudents
      });
      
      await mutate();


      toast.success("Student added to your lecture!");
    } catch (err: any) {
      toast.error(err.message || "Failed to add student to lecture.");
    } finally {
      setAddingStudentId(null);
    }
  };

  // derived data for modal
  const availableStudentsForCurrentLecture = useMemo(() => {
    if (!selectedLecture) return [];
    
    // Always use the freshest version of the lecture from the updated lectures list
    const selectedId = selectedLecture.documentId || selectedLecture.id;
    const latestLecture = lectures.find((l: any) => (l.documentId || l.id) === selectedId) || selectedLecture;

    const attr = latestLecture.attributes || latestLecture;
    const classData = attr.class?.data?.attributes || attr.class || {};
    
    const allClassStudents = classData.students?.data || classData.students || [];
    const currentLectureStudents = attr.students?.data || attr.students || [];
    
    const mappedCurrentIds = currentLectureStudents.map((s: any) => s.documentId || s.id);

    return allClassStudents.filter((stuBase: any) => {
       const sid = stuBase.documentId || stuBase.id;
       return !mappedCurrentIds.includes(sid);
    });
  }, [selectedLecture, lectures]); // recompute when lecture or fetched data updates

  return (
    <div className="flex flex-col min-h-screen bg-background">
       <Header />
       <main className="flex-1 py-28 px-4 sm:px-6 lg:px-8">
         <ToastContainer position="top-right" autoClose={3000} />
         
         <div className="max-w-7xl mx-auto">
           {/* Section Header */}
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
             <div>
               <h1 className="text-4xl font-extrabold text-foreground mb-2 flex items-center gap-3">
                 My Lectures
               </h1>
               <p className="text-foreground/60 max-w-2xl text-lg">
                 Manage your assigned lectures, view current attendees, and add students from your assigned class.
               </p>
             </div>
           </div>

           {/* Lectures List */}
           <div className="space-y-6">
              {!userId || isLoading ? (
                <div className="bg-foreground/[0.02] border border-foreground/10 rounded-2xl p-16 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                  <p className="text-foreground/60 font-medium">Loading your lectures...</p>
                </div>
              ) : lectures.length === 0 ? (
                <div className="bg-foreground/[0.02] border border-foreground/10 rounded-2xl p-16 text-center">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                     <BookOpen className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">No Lectures Found</h3>
                  <p className="text-foreground/60">You haven't been assigned to any lectures yet. Please contact the administrator.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {lectures.map((lectureBase: any, idx: number) => {
                    const lecture = lectureBase.attributes || lectureBase;
                    const lId = lectureBase.documentId || lectureBase.id;

                    const clsName = lecture.class?.data?.attributes?.name || lecture.class?.name || 'No Class';
                    const subName = lecture.subject?.data?.attributes?.name || lecture.subject?.name || 'No Subject';
                    const roomName = lecture.classroom?.data?.attributes?.name || lecture.classroom?.name || 'TBD';
                    const dayName = DAYS.find(d => d.id === lecture.day_of_week)?.label || 'Unknown';
                    const enrolledStudents = lecture.students?.data || lecture.students || [];

                    return (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={lId}
                        className="bg-background rounded-2xl shadow-lg border border-foreground/10 overflow-hidden flex flex-col"
                      >
                         <div className="p-6 border-b border-foreground/10 bg-foreground/[0.02]">
                            <div className="flex justify-between items-start gap-4 mb-4">
                               <div>
                                 <h3 className="text-2xl font-bold text-foreground mb-1">{lecture.name || subName}</h3>
                                 <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="px-2.5 py-1 bg-purple-500/10 text-purple-600 text-xs font-bold rounded uppercase tracking-wider">
                                      {subName}
                                    </span>
                                    <span className="px-2.5 py-1 bg-foreground/5 text-foreground/70 text-xs font-bold rounded uppercase tracking-wider">
                                      {clsName}
                                    </span>
                                 </div>
                               </div>
                               <div className="flex flex-col items-end gap-1.5 text-sm font-medium text-foreground/60">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" /> {dayName}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" /> {lecture.start_time?.slice(0,5)} - {lecture.end_time?.slice(0,5)}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-blue-600">
                                    <MapPin className="w-4 h-4" /> {roomName}
                                  </div>
                               </div>
                            </div>
                         </div>
                         <div className="p-6 flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                               <h4 className="font-bold text-foreground flex items-center gap-2">
                                 <UsersIcon className="w-5 h-5 text-foreground/40" /> 
                                 Admitted Students <span className="text-sm font-medium text-foreground/50 px-2 py-0.5 bg-foreground/5 rounded-full">{enrolledStudents.length}</span>
                               </h4>
                               <button 
                                 onClick={() => handleOpenAddStudent(lectureBase)}
                                 className="text-sm px-4 py-2 bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                               >
                                 <Plus className="w-4 h-4" /> Add Student
                               </button>
                            </div>
                            
                            <div className="mt-2 flex-1">
                               {enrolledStudents.length === 0 ? (
                                  <div className="h-full flex items-center justify-center p-6 border-2 border-dashed border-foreground/10 rounded-xl">
                                     <p className="text-foreground/40 text-sm font-medium">No students added to this lecture yet.</p>
                                  </div>
                               ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                                    {enrolledStudents.map((stuBase: any) => {
                                      const stu = stuBase.attributes || stuBase;
                                      const sid = stuBase.documentId || stuBase.id;
                                      const userRelation = stu.user?.data?.attributes || stu.user || {};
                                      return (
                                        <div key={sid} className="flex items-center gap-3 p-3 border border-foreground/5 rounded-xl bg-foreground/[0.02]">
                                           <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                                             <UsersIcon className="w-4 h-4" />
                                           </div>
                                           <div className="min-w-0 flex-1">
                                              <p className="text-sm font-bold text-foreground truncate">{userRelation.username || 'Unnamed'}</p>
                                              <p className="text-xs text-foreground/50 truncate">Roll: {stu.roll_number || 'N/A'}</p>
                                           </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                               )}
                            </div>
                         </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
           </div>
         </div>

         {/* Add Student Modal */}
         <AnimatePresence>
           {isModalOpen && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="absolute inset-0 bg-background/80 backdrop-blur-md"
                 onClick={() => setIsModalOpen(false)}
               />
               
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 className="relative bg-background rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-foreground/10 flex flex-col max-h-[85vh]"
               >
                 <div className="flex justify-between items-center p-6 border-b border-foreground/10 bg-foreground/[0.02]">
                   <div>
                     <h2 className="text-2xl font-bold text-foreground">Add Students</h2>
                     <p className="text-sm text-foreground/60 mt-1">Available students from {selectedLecture?.attributes?.class?.data?.attributes?.name || selectedLecture?.class?.name || 'Class'}</p>
                   </div>
                   <button onClick={() => setIsModalOpen(false)} className="text-foreground/40 hover:text-foreground hover:bg-foreground/5 p-2 rounded-xl transition-colors">
                     <X className="w-5 h-5" />
                   </button>
                 </div>
                 
                 <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-foreground/[0.01]">
                    {availableStudentsForCurrentLecture.length === 0 ? (
                       <div className="py-12 text-center text-foreground/50">
                         All students in this class have already been added to your lecture, or the class has no students.
                       </div>
                    ) : (
                       <div className="space-y-3">
                         {availableStudentsForCurrentLecture.map((stuBase: any) => {
                           const stu = stuBase.attributes || stuBase;
                           const sid = stuBase.documentId || stuBase.id;
                           const userRelation = stu.user?.data?.attributes || stu.user || {};
                           const isAdding = addingStudentId === sid;

                           return (
                             <div key={sid} className="flex items-center justify-between p-4 bg-background border border-foreground/10 rounded-2xl shadow-sm hover:border-blue-500/30 transition-colors group">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/60 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                      <UsersIcon className="w-5 h-5" />
                                   </div>
                                   <div>
                                      <p className="font-bold text-foreground text-sm">{userRelation.username || 'Unnamed'}</p>
                                      <p className="text-xs font-medium text-foreground/50 mt-0.5">Roll: {stu.roll_number || 'N/A'}</p>
                                   </div>
                                </div>
                                <button 
                                  onClick={() => handleAddStudentToLecture(sid)}
                                  disabled={addingStudentId !== null}
                                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-blue-500/20"
                                >
                                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                  Add
                                </button>
                             </div>
                           )
                         })}
                       </div>
                    )}
                 </div>
               </motion.div>
             </div>
           )}
         </AnimatePresence>
       </main>
    </div>
  );
}