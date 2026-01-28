"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "../Loader";
import ContinueBtn from "./ContinueBtn";

interface Interview {
  _id: string;
  jobRole: string;
  techStack: string[];
  yearsOfExperience: number;
  status: string;
  overallScore: number;
  createdAt: string;
}

export default function InterviewList() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        // get token from local storage
        const token = localStorage.getItem("auth_token");

        if (!token) {
          // No token: redirect to login and stop further fetching
          router.push("/login");
          setLoading(false);
          return;
        }

        const response = await fetch("/api/interview/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch interviews");
        }

        const data = await response.json();
        // console.log(data);
        setInterviews(data.interviews || []);
      } catch (error) {
        console.error("error fetching interviews: ", error);
        setError("Failed to load interviews, Please try again later!");
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-3 py-1 text-xs font-bold border rounded-full bg-emerald-900/30 border-emerald-700/30 text-emerald-400">
            Completed
          </span>
        );
      case "in-progress":
        return (
          <span className="px-3 max-sm:text-[10px] py-1 text-xs font-bold rounded-full bg-blue-900/30 border border-blue-700/30 text-blue-400">
            In Progress
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-bold text-gray-500 rounded-full bg-gray-900/30">
            Pending
          </span>
        );
    }
  };

  const handleContinueInterview = (id: string) => {
    router.push(`/interview/${id}`);
  };

  const handleViewResults = (id: string) => {
    router.push(`/interview/${id}/results`);
  };

  const handleViewAnalysis = (id: string) => {
    router.push(`/interview/${id}/analysis`);
  };

  const handleDeleteInterview = async (id: string) => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
      return;
    }
    const ok = window.confirm("Delete this interview? This cannot be undone.");
    if (!ok) return;
    try {
      const res = await fetch(`/api/interview/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to delete interview");
      }
      setInterviews((prev) => prev.filter((i) => i._id !== id));
    } catch (e) {
      setError("Failed to delete interview. Please try again.");
    }
  };

  const handleMentorReview = async (id: string) => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const res = await fetch(`/api/interview/${id}/mentor`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to trigger mentor review");
      }
      const data = await res.json();
      if (data.success) {
        alert("Mentor review triggered successfully!");
      } else {
        alert(`Mentor review failed: ${data.reason || 'Unknown error'}`);
      }
    } catch (e) {
      setError("Failed to trigger mentor review. Please try again.");
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6 text-gray-900 dark:text-white">
      {error && (
        <div className="px-4 py-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded">
          {error}
        </div>
      )}

      {!error && interviews.length === 0 ? (
        <div className="w-full h-[40vh] flex items-center justify-center">
          <div className="text-center py-8 w-[40vw]  bg-[var(--input-bg)] rounded-lg">
            <p className="mb-4 text-gray-400">
              No interviews found. Start a new interview to practice!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-1 xl:grid-cols-2">
          {interviews.map((interview) => (
            <div
              key={interview._id}
              className="bg-[#171415] border border-[#352a31] max-w-[800px] max-sm:w-full rounded-xl shadow-md px-6 py-8"
            >
              {/* // job role, status */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold uppercase max-sm:text-base text-white">
                  {interview.jobRole}
                </h3>
                {getStatusBadge(interview.status)}
              </div>

              {/* // experience, progress and score */}
              <div className="flex flex-col gap-2 mb-4 font-medium text-gray-400 text-md">
                <div className="flex gap-20 max-sm:gap-10">
                  <div className="">
                    <p>Experience</p>
                    <p className="text-gray-200">
                      {interview.yearsOfExperience}{" "}
                      {interview.yearsOfExperience <= 1 ? "Year" : "Years"}
                    </p>
                  </div>
                  <div>
                    <p>Date</p>
                    <p className="text-gray-200">
                      {new Date(interview.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    {interview.status === "in-progress" && (
                      <div>
                        <p>Score</p>
                        <p className="text-2xl font-bold">
                          {" "}
                          <span
                            className={
                              interview.overallScore >= 70
                                ? "text-green-500"
                                : interview.overallScore >= 50
                                  ? "text-yellow-500"
                                  : "text-red-500"
                            }
                          >
                            {interview.overallScore}
                          </span>{" "}
                        </p>
                      </div>
                    )}

                    {interview.status === "completed" && (
                      <div>
                        <p>Score</p>
                        <p className="text-2xl font-bold">
                          {" "}
                          <span
                            className={
                              interview.overallScore >= 70
                                ? "text-green-500"
                                : interview.overallScore >= 50
                                  ? "text-yellow-500"
                                  : "text-red-500"
                            }
                          >
                            {interview.overallScore}
                          </span>{" "}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* // buttons for continue, view results, view analysis, and start new interview */}

              <div className="relative flex flex-wrap gap-4 mt-4">
                {interview.status === "in-progress" && (
                  <>
                    {/* continue btn */}
                    <ContinueBtn
                      color="blue"
                      text="Continue"
                      path_1="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      path_2="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      onClick={() => handleContinueInterview(interview._id)}
                    />
                    {/* analysis btn */}
                    <ContinueBtn
                      color="indigo"
                      path_2=""
                      text="Analysis"
                      path_1="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      onClick={() => handleViewAnalysis(interview._id)}
                    />
                    <ContinueBtn
                      color="indigo"
                      text="Delete"
                      path_1="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      path_2=""
                      onClick={() => handleDeleteInterview(interview._id)}
                    />
                  </>
                )}

                {interview.status === "completed" && (
                  <>
                    {/* result btn */}
                    <ContinueBtn
                      color="green"
                      text="Results"
                      path_1="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      path_2=""
                      onClick={() => handleViewResults(interview._id)}
                    />
                    {/* analysis btn */}
                    <ContinueBtn
                      color="indigo"
                      path_2=""
                      text="Analysis"
                      path_1="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      onClick={() => handleViewAnalysis(interview._id)}
                    />
                    {/* mentor review btn */}
                    <ContinueBtn
                      color="yellow"
                      text="Mentor Review"
                      path_1="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      path_2=""
                      onClick={() => handleMentorReview(interview._id)}
                    />
                    {/* delete btn */}
                    <ContinueBtn
                      color="indigo"
                      text="Delete"
                      path_1="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      path_2=""
                      onClick={() => handleDeleteInterview(interview._id)}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
