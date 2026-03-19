 "use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { strapi } from "@/lib/sdk/sdk";

export default function StudentProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user?.role !== "student") {
      router.push("/");
      return;
    }

    fetchStudentProfile();
  }, [session, router]);

  async function fetchStudentProfile() {
    try {
      setLoading(true);
      setError(null);

      const res =  await strapi.find('students', {
        filters: {
          user: {
            id: session?.user?.id,
          },
        },
        populate: {
          user: true,
        },
      });

   

      if (res.data && res.data.length > 0) {
        setStudent(res.data[0]);
      } else {
        setError("Student profile not found");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error || "Profile not found"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">Student Profile</h1>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-4xl font-bold">
                {student.user?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-xl font-semibold">{student.name}</div>
                <div className="text-gray-600">{student.email}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-500 text-sm">Roll Number</div>
                <div className="font-medium">{student.roll_number}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">Class</div>
                <div className="font-medium">
                  {student.classroom?.name || "N/A"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => router.push("/student/attendence")}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              View Attendance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}