"use client"

import FaceAttendance from "@/components/face-rec/VerifyFace";
import { useStrapi } from "@/lib/sdk/useStrapi";

export default function VerifyFacePage() {
    // Fetch ALL students that have a faceEmbedding (for face recognition matching)
    const { data: studentData, isLoading } = useStrapi(
        'students',
        {
            filters: {
                faceEmbedding: {
                    $notNull: true,
                },
            },
            populate: ['user'],
            pagination: {
                pageSize: 500,
            },
        },
        { revalidateOnFocus: false }
    );

    const strapiStudents: any[] = studentData?.data || [];

    return (
        <FaceAttendance strapiStudents={strapiStudents} isLoadingStudents={isLoading} />
    );
}