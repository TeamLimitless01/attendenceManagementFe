"use client"
import RegisterFace from "@/components/face-rec/RegisterFace";
import { useParams } from "next/navigation";
import Header from "@/components/Header";

const RegisterPageWithName = () => {
    const params = useParams();
    const studentId = params.studentId as string;
    const name = decodeURIComponent(params.name as string || "");
    
    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center p-4">
              <RegisterFace studentId={studentId} name={name} />
            </main>
        </div>
    );
};

export default RegisterPageWithName;
