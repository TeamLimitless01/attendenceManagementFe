"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, MoreVertical, Trash2, Edit, X, User as UserIcon } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '@/components/Header';
import { strapi } from '@/lib/sdk/sdk';
import { useStrapi } from '@/lib/sdk/useStrapi';

// Fallbacks for localhost testing
const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.NEXT_PUBLIC_STRAPI_TOKEN || '';

export default function AdminUsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {data,isLoading,mutate} = useStrapi('teachers',{
    populate:'*'
  })

  const teachers = data?.data || []

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    employee_id: '',
    department: '',
  });

 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
     
      const userRes =await strapi.register({
          username: formData.username + "-" + Math.floor(Math.random() * 100000),
          email: formData.email,
          password: formData.password,
      })

      const jwtToUpdate = userRes?.jwt
      const userData = userRes?.user

    
      const updateUser = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/users/${userData?.id}`,{
        method:'PUT',
        headers:{
          Authorization:`Bearer ${jwtToUpdate} ` ,
          'Content-Type': 'application/json',
        },
        
        body:JSON.stringify({
          type:'teacher'
        })
        
      })

      const teacherRes = await strapi.create('teachers',{
        employee_id: "MIT-"+Math.floor(Math.random() * 100000) + '-'+userData?.id,
        department: formData.department,
        user: userData.id || userData.documentId,
        name:formData.username
      })
     
      toast.success("Teacher successfully created!");
      console.log(teacherRes,'tcr debug')

      setIsModalOpen(false);
      setFormData({ username: '', email: '', password: '', employee_id: '', department: '' });
      await mutate();
      
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: any | string, userId?: number | string) => {
    if (!confirm("Are you sure you want to delete this teacher?")) return;
    
    try {
     await strapi.delete('teachers',id)
      
      if (userId) {
         await fetch(`${API_URL}/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${API_TOKEN}`
            }
         });
      }
     await mutate()
      toast.success("Teacher deleted successfully.");
    } catch(err) {
      toast.error("Failed to delete teacher.");
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
               <h1 className="text-3xl font-bold text-foreground mb-2">Teacher Management</h1>
               <p className="text-foreground/60">View, add, and manage teaching staff and their system permissions.</p>
             </div>
             <button 
               onClick={() => setIsModalOpen(true)}
               className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95"
             >
               <Plus className="w-5 h-5" />
               Add New Teacher
             </button>
           </div>

           {/* Table Section */}
           <div className="bg-background rounded-2xl shadow-xl shadow-foreground/5 border border-foreground/10 overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse min-w-[700px]">
                 <thead>
                   <tr className="bg-foreground/[0.02] border-b border-foreground/10 text-sm uppercase tracking-wider text-foreground/50">
                     <th className="px-6 py-4 font-semibold">Teacher Info</th>
                     <th className="px-6 py-4 font-semibold">Department</th>
                     <th className="px-6 py-4 font-semibold">Employee ID</th>
                     <th className="px-6 py-4 font-semibold text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {isLoading ? (
                     <tr>
                       <td colSpan={4} className="px-6 py-12 text-center text-foreground/50">
                         <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                            Loading teachers...
                         </div>
                       </td>
                     </tr>
                   ) : teachers?.length === 0 ? (
                     <tr>
                       <td colSpan={4} className="px-6 py-12 text-center text-foreground/50">
                         No teachers found. Click "Add New Teacher" to create one.
                       </td>
                     </tr>
                   ) : (
                     teachers?.map((teacherBase: any, idx: number) => {
                       // Normalize Strapi Object standard
                       const teacher = teacherBase.attributes || teacherBase;
                       const targetId = teacherBase.documentId || teacherBase.id;
                       
                       // Normalize Users associated with Strapi Relation
                       const userRelation = teacher.user?.data?.attributes || teacher.user || {};
                       const userId = teacher.user?.data?.id || teacher.user?.id;
                       const userDocumentId =userId|| teacher.user?.data?.documentId || teacher.user?.documentId;

                       return (
                         <motion.tr 
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: idx * 0.05 }}
                           key={targetId} 
                           className="border-b border-foreground/5 hover:bg-foreground/[0.01] transition-colors"
                         >
                           <td className="px-6 py-6">
                             <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                 <UserIcon className="w-6 h-6" />
                               </div>
                               <div>
                                 <div className="font-semibold text-foreground text-lg">{userRelation?.username || 'Unknown User'}</div>
                                 <div className="text-sm text-foreground/60">{userRelation?.email || 'No email associated'}</div>
                               </div>
                             </div>
                           </td>
                           <td className="px-6 py-6 font-medium text-foreground/80">{teacher.department || '-'}</td>
                           <td className="px-6 py-6">
                             <span className="px-3 py-1.5 bg-foreground/5 rounded-md text-sm font-mono border border-foreground/10 text-foreground/70">
                               {teacher.employee_id || 'unassigned'}
                             </span>
                           </td>
                           <td className="px-6 py-6 text-right">
                              <button 
                                 onClick={() => handleDelete(targetId, userDocumentId)}
                                 className="p-2.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors inline-flex items-center justify-center"
                                 title="Delete Teacher"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                           </td>
                         </motion.tr>
                       );
                     })
                   )}
                 </tbody>
               </table>
             </div>
           </div>
         </div>

         {/* Add Teacher Modal */}
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
                   <h2 className="text-xl font-bold text-foreground">Create New Teacher</h2>
                   <button onClick={() => setIsModalOpen(false)} className="text-foreground/50 hover:text-foreground transition-colors bg-foreground/5 p-1.5 rounded-md hover:bg-foreground/10">
                     <X className="w-5 h-5" />
                   </button>
                 </div>
                 
                 <form onSubmit={handleCreateTeacher} className="p-6 space-y-5">
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
                         placeholder="e.g. John Doe"
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
                         placeholder="e.g. john@university.edu"
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
                     
                     {/* Teacher Specific Fields */}
                       <div>
                        
                       <div>
                         <label className="block text-sm font-medium text-foreground/80 mb-1.5">Department</label>
                         <input 
                           required
                           type="text" 
                           name="department"
                           value={formData.department}
                           onChange={handleChange}
                           className="w-full px-4 py-2.5 rounded-lg border border-foreground/20 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-foreground"
                           placeholder="e.g. Chemistry"
                         />
                       </div>
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
                       {isSubmitting ? 'Creating Profile...' : 'Create Teacher'}
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
