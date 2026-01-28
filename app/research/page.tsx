"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import PerformanceChart from "@/components/charts/PerformanceChart";
import StatsChart from "@/components/charts/StatsChart";
import AdvancedAnalytics from "@/components/charts/AdvancedAnalytics";
import { generateDashboardData } from "@/lib/chartData";

interface Interview {
  _id: string;
  jobRole: string;
  techStack: string[];
  yearsOfExperience: number;
  status: string;
  overallScore: number;
  createdAt: string;
}

const ResearchDashboard = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>({});

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

          // Generate chart data
          const dashboardData = generateDashboardData(fetchedInterviews);
          setPerformanceData(dashboardData.performanceData);
          setStatsData(dashboardData.statsData);
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

  return (
    <div className="p-10 mx-auto max-w-7xl">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-black dark:text-white mb-4">
          Research Dashboard
        </h1>
        <p className="text-xl text-purple-600 dark:text-purple-300 max-w-3xl mx-auto">
          Comprehensive Analytics and Insights in Interview Simulations
        </p>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-[#1a1a2e] border border-purple-500/30 rounded-2xl p-6 text-center">
          <div className="text-3xl font-bold text-white mb-2">
            {interviews.length}
          </div>
          <p className="text-purple-200 font-medium">Total Interviews</p>
        </div>

        <div className="bg-[#1a1a2e] border border-blue-500/30 rounded-2xl p-6 text-center">
          <div className="text-3xl font-bold text-white mb-2">
            {interviews.length > 0
              ? Math.round(interviews.reduce((sum, interview) => sum + (interview.overallScore || 0), 0) / interviews.length)
              : 0}
          </div>
          <p className="text-blue-200 font-medium">Avg. Score</p>
        </div>

        <div className="bg-[#1a1a2e] border border-green-500/30 rounded-2xl p-6 text-center">
          <div className="text-3xl font-bold text-white mb-2">
            {interviews.filter(i => i.status === 'completed').length}
          </div>
          <p className="text-green-200 font-medium">Completed</p>
        </div>

        <div className="bg-[#1a1a2e] border border-yellow-500/30 rounded-2xl p-6 text-center">
          <div className="text-3xl font-bold text-white mb-2">
            {Array.from(new Set(interviews.flatMap(i => i.techStack))).length}
          </div>
          <p className="text-yellow-200 font-medium">Technologies</p>
        </div>
      </div>

      {/* Performance Analytics */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black dark:text-white">Performance Analytics</h2>
          <p className="text-black dark:text-gray-400">Tracking improvement over time</p>
        </div>
        <PerformanceChart data={performanceData} />
      </div>

      {/* Interview Statistics */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black dark:text-white">Interview Statistics</h2>
          <p className="text-black dark:text-gray-400">Distribution of roles and technologies</p>
        </div>
        <StatsChart data={statsData} />
      </div>

      {/* Advanced Analytics */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black dark:text-white">Advanced Analytics</h2>
          <p className="text-black dark:text-gray-400">Deep insights into performance patterns</p>
        </div>
        <AdvancedAnalytics performanceData={performanceData} statsData={statsData} />
      </div>

    </div>
  );
};

export default ResearchDashboard;