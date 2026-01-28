"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InterviewList from "@/components/interview/InterviewList";
import Loader from "@/components/Loader";
import InterviewBtn from "@/components/interview/InterviewBtn";

interface Interview {
  _id: string;
  jobRole: string;
  techStack: string[];
  yearsOfExperience: number;
  status: string;
  overallScore: number;
  createdAt: string;
}

const Dashboard = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [interviews, setInterviews] = useState<Interview[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("auth_token");

        if (!token) {
          router.push("/login");
          return;
        }

        // Fetch interviews
        const response = await fetch("/api/interview/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const fetchedInterviews = data.interviews || [];
          setInterviews(fetchedInterviews);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // loader
  if (isLoading) {
    return <Loader />;
  }

  const handleCreateInterview = () => {
    router.push(`/interview/new`);
  };

  const completedInterviews = interviews.filter(i => i.status === 'completed').length;
  const averageScore = interviews.length > 0
    ? Math.round(interviews.reduce((sum, interview) => sum + (interview.overallScore || 0), 0) / interviews.length)
    : 0;

  return (
    <div className="p-10 mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center justify-between w-full max-sm:flex-col max-sm:text-center">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white sm:mb-2">
              Your Interviews
            </h1>
            <p className="text-black dark:text-gray-500 max-sm:text-sm">
              Practice your Interview Skills with AI Agents
            </p>
          </div>

          <div className="max-sm:mt-4">
            <InterviewBtn
              onClick={handleCreateInterview}
              text="Create new Interview"
            />
          </div>
        </div>
      </div>


      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6"></h2>
        <InterviewList />
      </div>
    </div>
  );
};

export default Dashboard;
