"use client";

import React, { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import { DateRange } from "react-day-picker";

type UserGrowthData = {
  month: string;
  students: number;
  teachers: number;
};

// Fallback data nếu API lỗi hoặc không có dữ liệu
const fallbackData = [
  { month: "Jan", students: 120, teachers: 8 },
  { month: "Feb", students: 155, teachers: 10 },
  { month: "Mar", students: 180, teachers: 12 },
  { month: "Apr", students: 210, teachers: 14 },
  { month: "May", students: 245, teachers: 15 },
  { month: "Jun", students: 270, teachers: 17 },
  { month: "Jul", students: 290, teachers: 18 },
  { month: "Aug", students: 310, teachers: 20 },
  { month: "Sep", students: 350, teachers: 22 },
  { month: "Oct", students: 385, teachers: 24 },
  { month: "Nov", students: 420, teachers: 26 },
  { month: "Dec", students: 450, teachers: 28 },
];

interface UserGrowthProps {
  timeRange?: string;
  dateRange?: DateRange;
}

const UserGrowth = ({ timeRange, dateRange }: UserGrowthProps) => {
  const [growthData, setGrowthData] = useState<UserGrowthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserGrowthData() {
      setLoading(true);
      try {
        // Construct query params
        const params = new URLSearchParams();
        if (timeRange) params.append('timeRange', timeRange);
        if (dateRange?.from && dateRange?.to) {
          params.append('startDate', dateRange.from.toISOString());
          params.append('endDate', dateRange.to.toISOString());
        }

        const response = await axios.get(`/api/analytics/user-growth?${params.toString()}`);
        if (response.data) {
          setGrowthData(response.data);
        } else {
          setGrowthData(fallbackData);
        }
      } catch (error) {
        console.error("Error fetching user growth data:", error);
        setGrowthData(fallbackData);
      } finally {
        setLoading(false);
      }
    }

    fetchUserGrowthData();
  }, [timeRange, dateRange]);

  if (loading) {
    return <Skeleton className="w-full h-[350px]" />;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart
        data={growthData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="colorTeachers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="month"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          yAxisId="left"
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          yAxisId="right"
          orientation="right"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="students"
          stroke="#8884d8"
          fillOpacity={1}
          fill="url(#colorStudents)"
          yAxisId="left"
        />
        <Area
          type="monotone"
          dataKey="teachers"
          stroke="#82ca9d"
          fillOpacity={1}
          fill="url(#colorTeachers)"
          yAxisId="right"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default UserGrowth;
