"use client"
import RegisterFace from "@/components/face-rec/RegisterFace";
import { useParams } from "next/navigation";

const Page = () => {
    const params = useParams();
    const studentId = params.studentId as string;
    return (
        <div>
            <RegisterFace studentId={studentId} />
        </div>
    );
};

export default Page;