'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface JobRoleData {
  name: string;
  count: number;
}

interface TechStackData {
  name: string;
  count: number;
}

interface StatsChartData {
  jobRoles: JobRoleData[];
  techStacks: TechStackData[];
}

interface StatsChartProps {
  data: StatsChartData;
}

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const StatsChart: React.FC<StatsChartProps> = ({ data }) => {
  // Safely handle cases where data might be undefined
  const jobRoles = data?.jobRoles || [];
  const techStacks = data?.techStacks || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Job Roles Chart */}
      <div className="bg-[#0d0d1a] border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">Interview Distribution by Job Role</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={jobRoles}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#4c1d95" />
            <XAxis
              dataKey="name"
              stroke="#c084fc"
              tick={{ fill: '#e2e8f0' }}
            />
            <YAxis
              stroke="#c084fc"
              tick={{ fill: '#e2e8f0' }}
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
            <Legend />
            <Bar dataKey="count" fill="#ffffff" name="Interview Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tech Stacks Chart */}
      <div className="bg-[#0d0d1a] border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">Technology Stack Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={techStacks}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={80}
              fill="#8b5cf6"
              dataKey="count"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : '0'}%`}
            >
              {techStacks.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(30, 10, 40, 0.9)',
                borderColor: '#8b5cf6',
                borderRadius: '0.5rem',
                color: 'white'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsChart;