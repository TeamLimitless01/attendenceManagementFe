"use client"
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Users as UsersIcon, GraduationCap, X } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '@/components/Header';
import { strapi } from '@/lib/sdk/sdk';
import { useStrapi } from '@/lib/sdk/useStrapi';

// Fallbacks for localhost testing
const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? '';
const API_TOKEN = process.env.NEXT_PUBLIC_STRAPI_TOKEN || '';


export default function AdminStudentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  // Fetch all classes and deeply populate students + user
  const { data: classesData, isLoading, mutate } = useStrapi('classes', {
    populate: ['students', 'students.user']
  });

  const classes = classesData?.data || [];

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    roll_number: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenAddStudent = (classId: string) => {
    setSelectedClassId(classId);
    setFormData({ username: '', email: '', password: '', roll_number: '' });
    setIsModalOpen(true);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;

    setIsSubmitting(true);
    
    try {
      const userRes = await strapi.register({
          username: formData.username + "-" + Math.floor(Math.random() * 100000),
          email: formData.email,
          password: formData.password,
      });

      const jwtToUpdate = userRes?.jwt;
      const userData = userRes?.user;

      await fetch(`${API_URL}/api/users/${userData?.id}`, {

        method: 'PUT',
        headers: {
          Authorization: `Bearer ${jwtToUpdate} `,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'student'
        })
      });

      await strapi.create('students', {
        roll_number: formData.roll_number,
        user: userData.id || userData.documentId,
        class: selectedClassId,
        name: formData.username,
      });
     
      toast.success("Student successfully added to class!");
      setIsModalOpen(false);
      setFormData({ username: '', email: '', password: '', roll_number: '' });
      await mutate();
      
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
       <Header />
       <main className="flex-1 bg-foreground/[0.02] py-28 px-4 sm:px-6 lg:px-8">
         <ToastContainer position="top-right" autoClose={3000} />
         
         <div className="max-w-7xl mx-auto">
           {/* Section Header */}
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
             <div>
               <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                 Student Management 
               </h1>
               <p className="text-foreground/60">View all classes and add students to them to manage class enrollments.</p>
             </div>
           </div>

           {/* Classes List */}
           <div className="space-y-6">
              {isLoading ? (
                <div className="bg-background rounded-2xl shadow-xl shadow-foreground/5 border border-foreground/10 p-12 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-4" />
                  <span className="text-foreground/50">Loading classes...</span>
                </div>
              ) : classes?.length === 0 ? (
                <div className="bg-background rounded-2xl shadow-xl shadow-foreground/5 border border-foreground/10 p-12 text-center text-foreground/50">
                   No classes found. Please create a class first.
                </div>
              ) : (
                classes?.map((classBase: any, idx: number) => {
                  const classItem = classBase.attributes || classBase;
                  const targetId = classBase.documentId || classBase.id;
                  const classStudents = classItem.students?.data || classItem.students || [];
                  const isExpanded = expandedClassId === targetId;
                  
                  return (
                    <motion.div 
                      key={targetId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-background rounded-2xl shadow-lg border border-foreground/10 overflow-hidden"
                    >
                      <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                         <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                               <GraduationCap className="w-6 h-6" />
                            </div>
                            <div>
                               <h3 className="text-xl font-bold text-foreground">{classItem.name}</h3>
                               <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-foreground/60 font-medium">
                                 <span>Dept: {classItem.department || 'N/A'}</span>
                                 <span>•</span>
                                 <span>Semester {classItem.semester || 'N/A'}</span>
                                 <span>•</span>
                                 <span>Batch {classItem.batch_year || 'N/A'}</span>
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-3 self-start md:self-auto">
                           <button
                             onClick={() => setExpandedClassId(isExpanded ? null : targetId)}
                             className="px-4 py-2 text-sm font-semibold text-foreground/70 bg-foreground/5 hover:bg-foreground/10 rounded-lg transition-colors border border-foreground/10"
                           >
                             {isExpanded ? 'Hide Students' : `View Students (${classStudents.length})`}
                           </button>
                           <button 
                             onClick={() => handleOpenAddStudent(targetId)}
                             className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                           >
                             <Plus className="w-4 h-4" /> Add Student
                           </button>
                         </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                             initial={{ height: 0, opacity: 0 }}
                             animate={{ height: 'auto', opacity: 1 }}
                             exit={{ height: 0, opacity: 0 }}
                             className="border-t border-foreground/5 bg-foreground/[0.01]"
                          >
                             <div className="p-6">
                               {classStudents.length === 0 ? (
                                  <div className="text-center py-6 text-foreground/50 text-sm">
                                    No students enrolled in this class yet.
                                  </div>
                               ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                     {classStudents.map((stuBase: any) => {
                                        const stu = stuBase.attributes || stuBase;
                                        const userRelation = stu.user?.data?.attributes || stu.user || {};
                                        return (
                                           <div key={stuBase.id || stuBase.documentId || Math.random()} className="flex items-center gap-3 p-3 bg-background border border-foreground/10 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 shrink-0">
                                                 <UsersIcon className="w-5 h-5" />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                 <div className="text-sm font-bold text-foreground truncate">{userRelation.username || 'Unnamed Student'}</div>
                                                 <div className="text-xs text-foreground/50 truncate">Roll: {stu.roll_number || 'N/A'}</div>
                                              </div>
                                           </div>
                                        )
                                     })}
                                  </div>
                               )}
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
           </div>
         </div>

         {/* Add Student Modal */}
         <AnimatePresence>
           {isModalOpen && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               {/* Backdrop */}
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                 onClick={() => setIsModalOpen(false)}
               />
               
               {/* Modal Content */}
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 className="relative bg-background rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-foreground/10"
               >
                 <div className="flex justify-between items-center p-6 border-b border-foreground/10">
                   <h2 className="text-xl font-bold text-foreground">Add Student to Class</h2>
                   <button onClick={() => setIsModalOpen(false)} className="text-foreground/50 hover:text-foreground transition-colors bg-foreground/5 p-1.5 rounded-md hover:bg-foreground/10">
                     <X className="w-5 h-5" />
                   </button>
                 </div>
                 
                 <form onSubmit={handleCreateStudent} className="p-6 space-y-5">
                   <div className="space-y-4">
                     {/* User Fields */}
                     <div>
                       <label className="block text-sm font-medium text-foreground/80 mb-1.5">Full Name (Username)</label>
                       <input 
                         required
                         type="text" 
                         name="username"
                         value={formData.username}
                         onChange={handleChange}
                         className="w-full px-4 py-2.5 rounded-lg border border-foreground/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-foreground"
                         placeholder="e.g. Jane Doe"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-foreground/80 mb-1.5">Email Address</label>
                       <input 
                         required
                         type="email" 
                         name="email"
                         value={formData.email}
                         onChange={handleChange}
                         className="w-full px-4 py-2.5 rounded-lg border border-foreground/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-foreground"
                         placeholder="e.g. jane@university.edu"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-foreground/80 mb-1.5">Temporary Password</label>
                       <input 
                         required
                         type="password" 
                         name="password"
                         value={formData.password}
                         onChange={handleChange}
                         className="w-full px-4 py-2.5 rounded-lg border border-foreground/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-foreground"
                         placeholder="••••••••"
                       />
                     </div>
                     
                     <div className="h-px bg-foreground/10 my-6" />
                     
                     {/* Student Specific Fields */}
                     <div>
                       <label className="block text-sm font-medium text-foreground/80 mb-1.5">Roll Number</label>
                       <input 
                         required
                         type="text" 
                         name="roll_number"
                         value={formData.roll_number}
                         onChange={handleChange}
                         className="w-full px-4 py-2.5 rounded-lg border border-foreground/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-foreground"
                         placeholder="e.g. CS2024-001"
                       />
                     </div>
                   </div>

                   <div className="pt-4 flex justify-end gap-3 border-t border-foreground/10 mt-8 -mx-6 px-6 -mb-6 bg-foreground/[0.02] py-5">
                     <button 
                       type="button"
                       onClick={() => setIsModalOpen(false)}
                       className="px-5 py-2.5 text-foreground/70 font-medium hover:bg-foreground/5 hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-foreground/10"
                     >
                       Cancel
                     </button>
                     <button 
                       type="submit"
                       disabled={isSubmitting}
                       className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                     >
                       {isSubmitting ? 'Adding Student...' : 'Add Student'}
                     </button>
                   </div>
                 </form>
               </motion.div>
             </div>
           )}
         </AnimatePresence>
       </main>
    </div>
  );
}
