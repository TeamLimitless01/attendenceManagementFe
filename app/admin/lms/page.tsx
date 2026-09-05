"use client"
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Trash2, Edit, X, Calendar, 
  Users, BookOpen, MapPin, Loader2, ArrowRight,
  Clock, CalendarDays, Key,
  Edit3
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '@/components/Header';
import { strapi } from '@/lib/sdk/sdk';
import { useStrapi } from '@/lib/sdk/useStrapi';

const TABS = [
  { id: 'lectures', label: 'Lectures & Schedule', icon: Calendar },
  { id: 'classes', label: 'Classes & Batches', icon: Users },
  { id: 'subjects', label: 'Subjects Base', icon: BookOpen },
  { id: 'classrooms', label: 'Classrooms', icon: MapPin },
] as const;

const DAYS = [
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
  { id: 7, label: 'Sunday' },
];

export default function LMSManagerPage() {
  const [activeTab, setActiveTab] = useState('lectures');

  // Fetch all collections
  const { data: lecturesData, mutate: mutateLectures, isLoading: loadingLectures } = useStrapi('lectures', { populate: '*' });
  const { data: classesData, mutate: mutateClasses, isLoading: loadingClasses } = useStrapi('classes', { populate: '*' });
  const { data: subjectsData, mutate: mutateSubjects, isLoading: loadingSubjects } = useStrapi('subjects', { populate: '*' });
  const { data: classroomsData, mutate: mutateClassrooms, isLoading: loadingClassrooms } = useStrapi('classrooms', { populate: '*' });
  const { data: teachersData } = useStrapi('teachers', { populate: '*' });

  const lectures = lecturesData?.data || [];
  const classes = classesData?.data || [];
  const subjects = subjectsData?.data || [];
  const classrooms = classroomsData?.data || [];
  const teachers = teachersData?.data || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');

  const normalize = (item: any) => item?.attributes || item || {};
  const getId = (item: any) => item?.documentId || item?.id;

  const handleOpenCreate = () => {
    setFormData({});
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    const attr = normalize(item);
    const draft = { ...attr };

    if (activeTab === 'lectures') {
      draft.class = getId(attr.class?.data || attr.class) || '';
      draft.subject = getId(attr.subject?.data || attr.subject) || '';
      draft.teacher = getId(attr.teacher?.data || attr.teacher) || '';
      draft.classroom = getId(attr.classroom?.data || attr.classroom) || '';
      if (draft.start_time) draft.start_time = draft.start_time.slice(0, 5);
      if (draft.end_time) draft.end_time = draft.end_time.slice(0, 5);
      if (draft.start_date) draft.start_date = draft.start_date.split('T')[0];
      if (draft.end_date) draft.end_date = draft.end_date.split('T')[0];
    }

    setFormData(draft);
    setEditingId(getId(item));
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: string | number = value;
    if (type === 'number') {
      finalValue = value ? Number(value) : '';
    }
    if (name === 'day_of_week') {
      finalValue = Number(value);
    }
    setFormData((prev: any) => ({ ...prev, [name]: finalValue }));
  };

  const handleMutate = () => {
    if (activeTab === 'lectures') mutateLectures();
    if (activeTab === 'classes') mutateClasses();
    if (activeTab === 'subjects') mutateSubjects();
    if (activeTab === 'classrooms') mutateClassrooms();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formData };

      // Generate arbitrary slug dynamically for new entries to prevent constraint errors
      if (!editingId && payload.name) {
        payload.slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 100000);
      }

      if (activeTab === 'lectures') {
        if (payload.start_time && payload.start_time.length <= 5) payload.start_time += ':00.000';
        if (payload.end_time && payload.end_time.length <= 5) payload.end_time += ':00.000';
        if (!payload.day_of_week) payload.day_of_week = 1; 
      }

      if (editingId) {
        delete payload['id'];
        delete payload['documentId'];
        delete payload['createdAt'];
        delete payload['updatedAt'];
        delete payload['classId'];
        delete payload['subjectId'];
        delete payload['teacherId'];
        delete payload['classroomId'];
        delete payload['students'];
        delete payload['attendences'];
        await strapi.update(activeTab as any, editingId, payload);
        toast.success(`${activeTab} entry updated successfully!`);
      } else {
        await strapi.create(activeTab as any, payload);
        toast.success(`New ${activeTab} entry created successfully!`);
      }
      
      await handleMutate();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error?.message || "Failed to save entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${activeTab} entry?`)) return;
    try {
      await strapi.delete(activeTab as any, id);
      toast.success("Entry deleted successfully!");
      handleMutate();
    } catch (err) {
      toast.error("Failed to delete entry.");
    }
  };

  const renderTableHead = () => {
    if (activeTab === 'classrooms') return (
      <tr><th className="px-6 py-4">Classroom Name</th><th className="px-6 py-4">Location Data</th><th className="px-6 py-4">Radius</th><th className="px-6 py-4 text-right">Actions</th></tr>
    );
    if (activeTab === 'subjects') return (
      <tr><th className="px-6 py-4">Subject details</th><th className="px-6 py-4">Short Code</th><th className="px-6 py-4 text-right">Actions</th></tr>
    );
    if (activeTab === 'classes') return (
      <tr><th className="px-6 py-4">Class Target</th><th className="px-6 py-4">Department</th><th className="px-6 py-4">Batch Info</th><th className="px-6 py-4 text-right">Actions</th></tr>
    );
    if (activeTab === 'lectures') return (
      <tr><th className="px-6 py-4">Schedule Details</th><th className="px-6 py-4">Subject & Cohort</th><th className="px-6 py-4">Assigned Room</th><th className="px-6 py-4">Teacher</th><th className="px-6 py-4 text-right">Actions</th></tr>
    );
  };

  const renderTableRow = (itemBase: any, idx: number) => {
    const item = normalize(itemBase);
    const id = getId(itemBase);
    
    // Filter by search
    if (searchQuery) {
        const searchStr = Object.values(item).join(' ').toLowerCase();
        if (!searchStr.includes(searchQuery.toLowerCase())) return null;
    }

    let cols = <></>;

    if (activeTab === 'classrooms') {
      cols = (
        <>
          <td className="px-6 py-4 font-medium text-foreground/90">{item.name}</td>
          <td className="px-6 py-4">
             {item.latitude && item.longitude ? (
                 <div className="text-xs text-foreground/60 flex flex-col gap-0.5">
                   <span>Lat: {item.latitude}</span>
                   <span>Lon: {item.longitude}</span>
                 </div>
             ) : <span className="text-xs text-foreground/40">Not set</span>}
          </td>
          <td className="px-6 py-4">
             <span className="px-3 py-1 bg-green-500/10 text-green-600 rounded-md text-xs font-bold">{item.radius ? `${item.radius}m` : 'N/A'}</span>
          </td>
        </>
      );
    } else if (activeTab === 'subjects') {
      cols = (
        <>
          <td className="px-6 py-4 font-medium text-foreground/90">{item.name}</td>
          <td className="px-6 py-4">
            <span className="px-3 py-1 bg-blue-500/10 text-blue-600 rounded-md text-sm font-semibold">{item.code || '--'}</span>
          </td>
        </>
      );
    } else if (activeTab === 'classes') {
      cols = (
        <>
          <td className="px-6 py-4 font-medium text-foreground/90">{item.name}</td>
          <td className="px-6 py-4 text-foreground/70">{item.department || '--'}</td>
          <td className="px-6 py-4">
             <div className="flex gap-2">
                {item.semester && <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-600 rounded">Sem {item.semester}</span>}
                {item.batch_year && <span className="text-xs px-2 py-1 bg-orange-500/10 text-orange-600 rounded">Batch {item.batch_year}</span>}
             </div>
          </td>
        </>
      );
    } else if (activeTab === 'lectures') {
      const clsName = normalize(item.class?.data || item.class).name || 'No Class';
      const subName = normalize(item.subject?.data || item.subject).name || 'No Subject';
      const roomName = normalize(item.classroom?.data || item.classroom).name || 'TBD';
      const tchr = normalize(item.teacher?.data || item.teacher);
      const dayName = DAYS.find(d => d.id === item.day_of_week)?.label || 'Unknown';
      
      const teacherName = tchr.name || tchr.employee_id || 'Unassigned';

      cols = (
        <>
          <td className="px-6 py-4">
            <div className="font-semibold text-foreground/90 mb-1">{item.name}</div>
            <div className="text-sm text-foreground/60 flex items-center gap-1.5 mt-1">
               <Clock className="w-3.5 h-3.5" />
               {item.start_time?.slice(0,5)} - {item.end_time?.slice(0,5)} • {dayName}
            </div>
            {(item.start_date || item.end_date) && (
              <div className="text-xs text-foreground/50 mt-1">
                {item.start_date} to {item.end_date}
              </div>
            )}
          </td>
          <td className="px-6 py-4">
            <div className="flex flex-col gap-1">
               <span className="text-sm font-medium text-foreground/80">{subName}</span>
               <span className="text-xs px-2 py-1 bg-foreground/5 rounded-md w-max border border-foreground/10">{clsName}</span>
            </div>
          </td>
          <td className="px-6 py-4">
             <span className="flex items-center gap-1.5 text-sm font-medium text-blue-600">
               <MapPin className="w-4 h-4" /> {roomName}
             </span>
          </td>
          <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
                   <Users className="w-4 h-4 text-foreground/60" />
                 </div>
                 <span className="text-sm font-medium">{teacherName}</span>
              </div>
          </td>
        </>
      );
    }

    return (
      <motion.tr 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: idx * 0.05 }}
        key={id} 
        className="border-b border-foreground/5 hover:bg-foreground/[0.02] transition-colors group"
      >
        {cols}
        <td className="px-6 py-4 text-right">
          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={() => handleOpenEdit(itemBase)}
                className="p-2 text-foreground/50 hover:bg-foreground/5 hover:text-foreground rounded-lg transition-colors"
                title="Edit entry"
            >
                <Edit3 className="w-4 h-4" />
            </button>
            <button 
                onClick={() => handleDelete(id)}
                className="p-2 text-red-500/70 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                title="Delete entry"
            >
                <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </motion.tr>
    );
  };

  const currentData = activeTab === 'lectures' ? lectures : activeTab === 'classes' ? classes : activeTab === 'subjects' ? subjects : classrooms;
  const isLoading = (activeTab === 'lectures' && loadingLectures) || (activeTab === 'classes' && loadingClasses) || (activeTab === 'subjects' && loadingSubjects) || (activeTab === 'classrooms' && loadingClassrooms);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-28 px-4 sm:px-6 lg:px-8">
        <ToastContainer position="top-right" autoClose={3000} />
        
        <div className="max-w-7xl mx-auto">
          {/* Header Area */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-foreground mb-2 flex items-center gap-3">
                Subject & Class Management <span className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">Admin</span>
              </h1>
              <p className="text-foreground/60 max-w-2xl text-lg">
                Orchestrate your institution's backbone. Manage classes, subjects, classrooms, and securely assign schedules to teachers.
              </p>
            </div>
            <button 
              onClick={handleOpenCreate}
              className="px-6 py-3 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New
            </button>
          </div>

          <div className="bg-foreground/[0.02] p-1.5 rounded-2xl border border-foreground/10 mb-8 inline-flex overflow-x-auto max-w-full">
            {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                        className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                            isActive 
                            ? 'bg-background shadow-md border border-foreground/5 text-foreground' 
                            : 'text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5 border border-transparent'
                        }`}
                    >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : ''}`} />
                        {tab.label}
                    </button>
                )
            })}
          </div>

          <div className="mb-6 relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
            <input 
              type="text" 
              placeholder={`Search in ${TABS.find(t=>t.id === activeTab)?.label}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-background border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>

          <div className="bg-background rounded-2xl shadow-xl shadow-foreground/5 border border-foreground/10 overflow-hidden">
             <div className="overflow-x-auto min-h-[400px]">
               <table className="w-full text-left border-collapse min-w-[800px]">
                 <thead>
                   <tr className="bg-foreground/[0.03] border-b border-foreground/10 text-xs font-bold uppercase tracking-widest text-foreground/50">
                     {renderTableHead()}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-foreground/5">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-4" />
                          <p className="text-foreground/50 font-medium">Loading records...</p>
                        </td>
                      </tr>
                    ) : currentData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-24 text-center">
                          <div className="max-w-xs mx-auto">
                            <div className="w-16 h-16 bg-foreground/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-foreground/10">
                              <Search className="w-8 h-8 text-foreground/40" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1">No Entries Found</h3>
                            <p className="text-sm text-foreground/50 mb-6">Looks like there are no records for this section yet.</p>
                            <button onClick={handleOpenCreate} className="text-blue-600 font-semibold hover:underline">
                               Create first entry
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentData.map((item: any, idx: number) => renderTableRow(item, idx))
                    )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>

        {/* Universal Creation/Edit Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               {/* Backdrop */}
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="absolute inset-0 bg-background/80 backdrop-blur-md"
                 onClick={() => !isSubmitting && setIsModalOpen(false)}
               />
               
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 className="relative bg-background rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-foreground/10 flex flex-col max-h-[90vh]"
               >
                 <div className="flex justify-between items-center px-8 py-6 border-b border-foreground/10 bg-foreground/[0.02]">
                   <div>
                     <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                       {editingId ? <Edit className="w-5 h-5 text-blue-500" /> : <Plus className="w-5 h-5 text-green-500" />}
                       {editingId ? `Edit ${activeTab.replace(/s$/,'')}` : `Create New ${activeTab.replace(/s$/,'')}`}
                     </h2>

                     <p className="text-sm text-foreground/50 mt-1 capitalize">Fill out the form details below</p>
                   </div>
                   <button 
                     disabled={isSubmitting}
                     onClick={() => setIsModalOpen(false)} 
                     className="text-foreground/40 hover:text-foreground transition-all hover:rotate-90 bg-foreground/5 p-2 rounded-xl"
                   >
                     <X className="w-5 h-5" />
                   </button>
                 </div>
                 
                 <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                    {/* Common Required field for all (except user handles name globally) */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground/80 mb-2">Primary Name / Title</label>
                      <input 
                        required
                        type="text" 
                        name="name"
                        value={formData.name || ''}
                        onChange={handleChange}
                        className="w-full px-5 py-3 rounded-xl border border-foreground/10 bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium text-lg placeholder:text-foreground/30 shadow-sm"
                        placeholder="e.g. Introduction to Physics (CS201)"
                      />
                    </div>

                    {/* Classrooms Form Fields */}
                    {activeTab === 'classrooms' && (
                       <div className="space-y-6 pt-4 border-t border-foreground/5">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                               <label className="block text-sm font-semibold text-foreground/80 mb-2">Latitude</label>
                               <input type="number" step="any" name="latitude" value={formData.latitude || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-foreground/10 focus:ring-2 focus:ring-blue-500 bg-transparent" placeholder="e.g. 40.7128" />
                            </div>
                            <div>
                               <label className="block text-sm font-semibold text-foreground/80 mb-2">Longitude</label>
                               <input type="number" step="any" name="longitude" value={formData.longitude || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-foreground/10 focus:ring-2 focus:ring-blue-500 bg-transparent" placeholder="e.g. -74.0060" />
                            </div>
                            <div className="col-span-2 flex items-center gap-4">
                               <button 
                                 type="button" 
                                 onClick={() => {
                                   if (navigator.geolocation) {
                                     navigator.geolocation.getCurrentPosition((pos) => {
                                        setFormData((prev: any) => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
                                        toast.success("Location acquired successfully!");
                                     }, (err) => {
                                        toast.error("Failed to get location. Please allow location permissions.");
                                     });
                                   } else {
                                     toast.error("Geolocation is not supported by this browser.");
                                   }
                                 }}
                                 className="px-4 py-2 bg-blue-500/10 text-blue-600 font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-sm flex items-center gap-2"
                               >
                                 <MapPin className="w-4 h-4" /> Use My Current Location
                               </button>
                            </div>
                            <div className="col-span-2">
                               <label className="block text-sm font-semibold text-foreground/80 mb-2">Radius (meters)</label>
                               <input type="number" name="radius" value={formData.radius || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-foreground/10 focus:ring-2 focus:ring-blue-500 bg-transparent" placeholder="e.g. 5" />
                               <p className="text-xs text-foreground/50 mt-1">Defines the geofence boundary range where attendance can be submitted.</p>
                            </div>
                          </div>
                       </div>
                    )}

                    {/* Class Form Fields */}
                    {activeTab === 'classes' && (
                       <div className="grid grid-cols-2 gap-6">
                         <div>
                            <label className="block text-sm font-semibold text-foreground/80 mb-2">Department</label>
                            <input type="text" name="department" value={formData.department || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-foreground/10 focus:ring-2 focus:ring-blue-500 bg-transparent" placeholder="Computer Science" />
                         </div>
                         <div>
                            <label className="block text-sm font-semibold text-foreground/80 mb-2">Semester (Num)</label>
                            <input type="number" name="semester" value={formData.semester || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-foreground/10 focus:ring-2 focus:ring-blue-500 bg-transparent" placeholder="3" />
                         </div>
                         <div className="col-span-2">
                            <label className="block text-sm font-semibold text-foreground/80 mb-2">Batch Year (Num)</label>
                            <input type="number" name="batch_year" value={formData.batch_year || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-foreground/10 focus:ring-2 focus:ring-blue-500 bg-transparent" placeholder="2024" />
                         </div>
                       </div>
                    )}

                    {/* Subject Form Fields */}
                    {activeTab === 'subjects' && (
                       <div>
                          <label className="block text-sm font-semibold text-foreground/80 mb-2">Subject Code / Identifier</label>
                          <input required type="text" name="code" value={formData.code || ''} onChange={handleChange} className="w-full px-4 py-3 font-mono rounded-xl border border-foreground/10 focus:ring-2 focus:ring-blue-500 bg-transparent" placeholder="e.g. CS201" />
                       </div>
                    )}

                    {/* Lecture specific massive form */}
                    {activeTab === 'lectures' && (
                       <div className="space-y-6 pt-4 border-t border-foreground/5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-semibold text-foreground/80 mb-2">Assign Class</label>
                              <select name="class" value={formData.class || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-foreground/10 bg-background focus:ring-2 focus:ring-blue-500 text-foreground/90">
                                 <option value="">Select a Class...</option>
                                 {classes.map((c: any) => <option key={getId(c)} value={getId(c)}>{normalize(c).name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-foreground/80 mb-2">Assign Subject</label>
                              <select name="subject" value={formData.subject || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-foreground/10 bg-background focus:ring-2 focus:ring-blue-500 text-foreground/90">
                                 <option value="">Select a Subject...</option>
                                 {subjects.map((c: any) => <option key={getId(c)} value={getId(c)}>{normalize(c).name} ({normalize(c).code})</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-foreground/80 mb-2">Assign Teacher</label>
                              <select name="teacher" value={formData.teacher || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-foreground/10 bg-background focus:ring-2 focus:ring-blue-500 text-foreground/90">
                                 <option value="">Assign a Teacher...</option>
                                 {teachers.map((c: any) => <option key={getId(c)} value={getId(c)}>{normalize(c).name || 'Unnamed Teacher'}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-foreground/80 mb-2">Assign Classroom</label>
                              <select name="classroom" value={formData.classroom || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-foreground/10 bg-background focus:ring-2 focus:ring-blue-500 text-foreground/90">
                                 <option value="">Select Room...</option>
                                 {classrooms.map((c: any) => <option key={getId(c)} value={getId(c)}>{normalize(c).name}</option>)}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-6 bg-blue-500/5 p-6 rounded-2xl border border-blue-500/10">
                            <div className="col-span-2">
                               <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700/70 mb-4 flex items-center gap-2">
                                 <Clock className="w-4 h-4" /> Schedule Configuration
                               </h3>
                            </div>
                            <div>
                               <label className="block text-sm font-medium text-foreground/80 mb-2">Start Time</label>
                               <input type="time" name="start_time" value={formData.start_time || ''} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-foreground/10 bg-background" />
                            </div>
                            <div>
                               <label className="block text-sm font-medium text-foreground/80 mb-2">End Time</label>
                               <input type="time" name="end_time" value={formData.end_time || ''} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-foreground/10 bg-background" />
                            </div>
                            <div>
                               <label className="block text-sm font-medium text-foreground/80 mb-2">Valid From</label>
                               <input type="date" name="start_date" value={formData.start_date || ''} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-foreground/10 bg-background text-sm" />
                            </div>
                            <div>
                               <label className="block text-sm font-medium text-foreground/80 mb-2">Valid Until</label>
                               <input type="date" name="end_date" value={formData.end_date || ''} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-foreground/10 bg-background text-sm" />
                            </div>
                            <div className="col-span-2">
                               <label className="block text-sm font-medium text-foreground/80 mb-2">Day of the Week</label>
                               <div className="flex flex-wrap gap-2">
                                 {DAYS.map(day => (
                                   <label key={day.id} className={`cursor-pointer px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${Number(formData.day_of_week) === day.id ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-background border-foreground/10 text-foreground/70 hover:border-blue-500/50'}`}>
                                      <input type="radio" name="day_of_week" value={day.id} checked={Number(formData.day_of_week) === day.id} onChange={handleChange} className="hidden" />
                                      {day.label}
                                   </label>
                                 ))}
                               </div>
                            </div>
                          </div>
                       </div>
                    )}
                 </form>

                 <div className="px-8 py-5 border-t border-foreground/10 bg-foreground/[0.02] flex justify-end items-center gap-4">
                    <button 
                       type="button" 
                       onClick={() => setIsModalOpen(false)}
                       className="px-6 py-3 text-sm font-semibold text-foreground/60 hover:text-foreground transition-colors hover:bg-foreground/5 rounded-xl"
                    >
                       Cancel
                    </button>
                    <button 
                       type="submit" 
                       onClick={handleSubmit}
                       disabled={isSubmitting}
                       className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg flex items-center gap-2"
                    >
                       {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                          </>
                       ) : (
                          <>
                            Confirm & Save <ArrowRight className="w-4 h-4 ml-1" />
                          </>
                       )}
                    </button>
                 </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}