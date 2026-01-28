'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface AdvancedAnalyticsProps {
  performanceData: any[];
  statsData: any;
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ performanceData, statsData }) => {
  // Prepare data for area chart (cumulative performance)
  const cumulativeData = performanceData.map((item, index) => ({
    ...item,
    cumulativeScore: performanceData.slice(0, index + 1).reduce((sum, curr) => sum + curr.score, 0) / (index + 1)
  }));

  // Prepare data for radar chart (skills assessment)
  const skillData = [
    { subject: 'Technical', A: 85, fullMark: 100 },
    { subject: 'Communication', A: 78, fullMark: 100 },
    { subject: 'Problem Solving', A: 82, fullMark: 100 },
    { subject: 'System Design', A: 75, fullMark: 100 },
    { subject: 'Behavioral', A: 80, fullMark: 100 },
    { subject: 'Coding', A: 88, fullMark: 100 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Cumulative Performance Chart */}
      <div className="bg-[#0d0d1a] border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">Cumulative Performance Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={cumulativeData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#4c1d95" />
            <XAxis
              dataKey="date"
              stroke="#c084fc"
              tick={{ fill: '#e2e8f0' }}
            />
            <YAxis
              stroke="#c084fc"
              tick={{ fill: '#e2e8f0' }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(30, 10, 40, 0.9)',
                borderColor: '#8b5cf6',
                borderRadius: '0.5rem',
                color: 'white'
              }}
              itemStyle={{ color: 'white' }}
              labelStyle={{ color: '#c084fc', fontWeight: 'bold' }}
            />
            <Area
              type="monotone"
              dataKey="cumulativeScore"
              stroke="#ffffff"
              fill="url(#colorUv)"
              fillOpacity={0.3}
              name="Average Score"
            />
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffffff" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ffffff" stopOpacity={0.1} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Skills Assessment Radar Chart */}
      <div className="bg-[#0d0d1a] border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">Skills Assessment Radar</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
            <PolarGrid stroke="#4c1d95" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#e2e8f0' }} />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: '#e2e8f0' }}
            />
            <Radar
              name="User Skills"
              dataKey="A"
              stroke="#ffffff"
              fill="#ffffff"
              fillOpacity={0.3}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(30, 10, 40, 0.9)',
                borderColor: '#8b5cf6',
                borderRadius: '0.5rem',
                color: 'white'
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Experience vs Score Correlation */}
      <div className="bg-[#0d0d1a] border border-purple-500/30 rounded-2xl p-6 shadow-2xl lg:col-span-2">
        <h3 className="text-xl font-bold text-white mb-4">Experience vs Performance Correlation</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={performanceData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#4c1d95" />
            <XAxis
              dataKey="jobRole"
              stroke="#c084fc"
              tick={{ fill: '#e2e8f0' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="#c084fc"
              tick={{ fill: '#e2e8f0' }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(30, 10, 40, 0.9)',
                borderColor: '#8b5cf6',
                borderRadius: '0.5rem',
                color: 'white'
              }}
              itemStyle={{ color: 'white' }}
              labelStyle={{ color: '#c084fc', fontWeight: 'bold' }}
            />
            <Bar dataKey="score" fill="#ffffff" name="Score" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;