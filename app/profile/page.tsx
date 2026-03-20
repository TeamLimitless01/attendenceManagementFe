"use client"
import React from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Shield, 
  IdCard, 
  School, 
  Building2, 
  BookOpen, 
  Calendar, 
  Clock, 
  Loader2, 
  Camera,
  Edit2,
  CheckCircle2,
  Award,
  Hash
} from 'lucide-react';
import { useStrapi } from '@/lib/sdk/useStrapi';
import Header from '@/components/Header';

export default function Page() {
  const { data: session, status } = useSession();
  
  const userId = (session?.user as any)?.id;
  const roleName = (session?.user as any)?.role?.name?.toLowerCase() || 
                   (session?.user as any)?.role?.toLowerCase() || 
                   'student'; // Fallback

  // Fetch relevant profile based on role
  const isStudent = roleName.includes('student');
  const isTeacher = roleName.includes('teacher');
  const isAdmin = roleName.includes('admin');

  const { data: profileData, isLoading: profileLoading } = useStrapi(
    isStudent ? 'students' : isTeacher ? 'teachers' : 'admins',
    {
      filters: userId ? { user: { id: { $eq: userId } } } : undefined,
      populate: isStudent ? ['class', 'user'] : isTeacher ? ['user'] : ['user']
    }
  );
//@ts-ignore
  const profile:any = profileData?.data?.[0]?.attributes  || profileData?.data?.[0];
  const userDetails = profile?.name as any || (session?.user as any) || profile?.username as any;

  console.log(userDetails,'profile')
  if (status === 'loading' || profileLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
          <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">Authenticating Identity</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col min-h-screen bg-background pt-32 px-10">
        <Header />
        <h1 className="text-2xl font-bold">Please log in to view your profile.</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFDFF] dark:bg-[#0A0A0B]">
      <Header />
      
      <main className="flex-1 pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        
        {/* Profile Backdrop / Header */}
        <section className="relative mb-12">
          <div className="h-48 md:h-64 rounded-[3rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 overflow-hidden relative shadow-2xl">
             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
             <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          </div>

          <div className="px-8 -mt-20 md:-mt-24 relative flex flex-col md:flex-row items-end gap-6">
             <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               className="relative group shrink-0"
             >
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-[2.5rem] bg-background border-4 border-background shadow-2xl overflow-hidden p-2">
                   <div className="w-full h-full rounded-[2.1rem] bg-foreground/5 flex items-center justify-center overflow-hidden">
                      {userDetails?.image ? (
                        <img src={userDetails.image} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-20 h-20 text-foreground/10" />
                      )}
                   </div>
                </div>
                <button className="absolute bottom-4 right-4 p-3 bg-blue-600 text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100">
                   <Camera className="w-5 h-5" />
                </button>
             </motion.div>

             <div className="pb-4 flex-1">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                   <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                         {userDetails?.username || userDetails || 'Authenticated User'}
                      </h1>
                      <span className="px-3 py-1 bg-white dark:bg-foreground/10 text-foreground/60 rounded-xl text-[10px] font-black uppercase tracking-widest border border-foreground/5 shadow-sm">
                        {roleName}
                      </span>
                   </div>
                   <p className="text-foreground/40 font-bold flex items-center gap-2">
                      <Mail className="w-4 h-4" /> {userDetails?.email}
                   </p>
                </motion.div>
             </div>

             <motion.button 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               className="px-6 py-3 bg-background border border-foreground/10 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-sm hover:shadow-lg transition-all mb-4"
             >
                <Edit2 className="w-4 h-4" /> Edit Profile
             </motion.button>
          </div>
        </section>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           
           {/* Primary Account Details */}
           <div className="md:col-span-2 space-y-8">
              <section className="bg-background border border-foreground/10 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
                 <h3 className="text-xl font-black text-foreground mb-8 flex items-center gap-3">
                    <Shield className="w-6 h-6 text-blue-600" /> Administrative Identity
                 </h3>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <DetailItem icon={<IdCard />} label="Employee/Roll ID" value={profile?.roll_number || profile?.employee_id || 'Pending Setup'} />
                    <DetailItem icon={<Shield />} label="Privileges" value={`${roleName} permissions active`} />
                 </div>
              </section>

              {isStudent && (
                 <section className="bg-background border border-foreground/10 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
                    <h3 className="text-xl font-black text-foreground mb-8 flex items-center gap-3">
                       <Award className="w-6 h-6 text-purple-600" /> Academic Standing
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                       <DetailItem icon={<Hash />} label="Roll Number" value={profile?.roll_number || 'STU-0012'} />
                       <DetailItem icon={<Building2 />} label="Class / Section" value={profile?.class?.data?.attributes?.name || profile?.class?.name || 'Assigned General'} />
                       <DetailItem icon={<CheckCircle2 />} label="Facial Sync" value={profile?.isFaceRegistered ? 'Authenticated' : 'Required'} color={profile?.isFaceRegistered ? 'text-green-600' : 'text-red-600'} />
                       <DetailItem icon={<Clock />} label="Current Term" value="Spring 2026" />
                    </div>
                 </section>
              )}

              {isTeacher && (
                 <section className="bg-background border border-foreground/10 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
                    <h3 className="text-xl font-black text-foreground mb-8 flex items-center gap-3">
                       <BookOpen className="w-6 h-6 text-orange-600" /> Teaching Directory
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                       <DetailItem icon={<Building2 />} label="Department" value={profile?.department || 'Faculty of Engineering'} />
                       <DetailItem icon={<Clock />} label="Office Hours" value="Mon-Fri, 9AM-5PM" />
                       <DetailItem icon={<CheckCircle2 />} label="Verification" value="Senior Faculty" />
                       <DetailItem icon={<Shield />} label="Access Level" value="Level 2 Administrator" />
                    </div>
                 </section>
              )}
           </div>

           {/* Sidebar Stats / Extras */}
           <div className="space-y-8">
              <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-blue-500/20">
                 <p className="text-blue-200 text-xs font-black uppercase tracking-widest mb-2">Connectivity Status</p>
                 <h2 className="text-3xl font-black mb-6 leading-tight">Secure Session Active</h2>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm py-3 border-b border-white/10">
                       <span className="opacity-60">Last Login</span>
                       <span className="font-bold">Today, 02:45 AM</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-3 border-b border-white/10">
                       <span className="opacity-60">Platform</span>
                       <span className="font-bold">Web Native</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-3">
                       <span className="opacity-60">Security Level</span>
                       <span className="font-bold text-green-300 flex items-center gap-1.5"><Shield className="w-3 h-3" /> High</span>
                    </div>
                 </div>
              </div>

              <div className="bg-background border border-foreground/10 rounded-[2.5rem] p-8 text-center">
                 <div className="w-16 h-16 bg-foreground/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-foreground/40">
                   <Clock className="w-8 h-8" />
                 </div>
                 <h4 className="font-black text-foreground mb-1 uppercase tracking-tighter">History</h4>
                 <p className="text-xs text-foreground/40 font-medium px-4 leading-relaxed">Account tracking and activity logs are stored securely for 365 days.</p>
              </div>
           </div>

        </div>
      </main>
    </div>
  );
}

function DetailItem({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color?: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-foreground/[0.03] rounded-xl flex items-center justify-center text-foreground/20 mt-1 shrink-0">
        {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
      </div>
      <div>
        <p className="text-[10px] font-black text-foreground/30 uppercase tracking-widest leading-none mb-2">{label}</p>
        <p className={`text-lg font-bold ${color || 'text-foreground'} leading-tight tracking-tight`}>{value}</p>
      </div>
    </div>
  );
}
