"use client"

import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { DateRange } from 'react-day-picker'
import axios from 'axios'
import { Skeleton } from '@/components/ui/skeleton'

// Dữ liệu mẫu mặc định - sẽ được sử dụng nếu không có dữ liệu từ API
const defaultBarData = [
  { name: 'Jan', total: 92 },
  { name: 'Feb', total: 132 },
  { name: 'Mar', total: 147 },
  { name: 'Apr', total: 189 },
  { name: 'May', total: 212 },
  { name: 'Jun', total: 246 },
  { name: 'Jul', total: 252 },
  { name: 'Aug', total: 280 },
  { name: 'Sep', total: 345 },
  { name: 'Oct', total: 378 },
  { name: 'Nov', total: 352 },
  { name: 'Dec', total: 365 }
]

const defaultLineData = [
  { name: 'Week 1', completion: 45 },
  { name: 'Week 2', completion: 52 },
  { name: 'Week 3', completion: 49 },
  { name: 'Week 4', completion: 62 },
  { name: 'Week 5', completion: 57 },
  { name: 'Week 6', completion: 66 },
  { name: 'Week 7', completion: 73 },
  { name: 'Week 8', completion: 81 },
  { name: 'Week 9', completion: 79 },
  { name: 'Week 10', completion: 85 }
]

const defaultPieData = [
  { name: 'Computer Science', value: 540 },
  { name: 'Business', value: 620 },
  { name: 'Engineering', value: 480 },
  { name: 'Arts', value: 320 },
  { name: 'Medicine', value: 280 }
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

interface BarChartProps {
  customData?: { name: string; total: number }[];
  timeRange?: string;
  dateRange?: DateRange;
}

export const BarChart = ({ customData, timeRange, dateRange }: BarChartProps) => {
  const [data, setData] = useState<{ name: string; total: number }[]>(customData || defaultBarData);
  const [loading, setLoading] = useState<boolean>(customData ? false : true);

  useEffect(() => {
    // If customData is provided directly, use it
    if (customData) {
      setData(customData);
      setLoading(false);
      return;
    }

    // Otherwise, fetch data based on timeRange and dateRange
    const fetchData = async () => {
      setLoading(true);
      try {
        // Construct query params
        const params = new URLSearchParams();
        if (timeRange) params.append('timeRange', timeRange);
        if (dateRange?.from && dateRange?.to) {
          params.append('startDate', dateRange.from.toISOString());
          params.append('endDate', dateRange.to.toISOString());
        }
        params.append('chartType', 'bar');
        
        const response = await axios.get(`/api/analytics/charts?${params.toString()}`);
        if (response.data && response.data.barData) {
          setData(response.data.barData);
        }
      } catch (error) {
        console.error("Failed to fetch bar chart data:", error);
        setData(defaultBarData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customData, timeRange, dateRange]);
  
  if (loading) {
    return <Skeleton className="w-full h-[350px]" />;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsBarChart data={data}>
        <XAxis
          dataKey="name"
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
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            borderRadius: '8px',
            border: '1px solid #e2e8f0' 
          }} 
        />
        <Bar 
          dataKey="total" 
          fill="currentColor" 
          radius={[4, 4, 0, 0]} 
          className="fill-primary"
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

interface LineChartProps {
  customData?: { name: string; completion: number }[];
  timeRange?: string;
  dateRange?: DateRange;
}

export const LineChart = ({ customData, timeRange, dateRange }: LineChartProps) => {
  const [data, setData] = useState<{ name: string; completion: number }[]>(customData || defaultLineData);
  const [loading, setLoading] = useState<boolean>(customData ? false : true);

  useEffect(() => {
    // If customData is provided directly, use it
    if (customData) {
      setData(customData);
      setLoading(false);
      return;
    }

    // Otherwise, fetch data based on timeRange and dateRange
    const fetchData = async () => {
      setLoading(true);
      try {
        // Construct query params
        const params = new URLSearchParams();
        if (timeRange) params.append('timeRange', timeRange);
        if (dateRange?.from && dateRange?.to) {
          params.append('startDate', dateRange.from.toISOString());
          params.append('endDate', dateRange.to.toISOString());
        }
        params.append('chartType', 'line');
        
        const response = await axios.get(`/api/analytics/charts?${params.toString()}`);
        if (response.data && response.data.lineData) {
          setData(response.data.lineData);
        }
      } catch (error) {
        console.error("Failed to fetch line chart data:", error);
        setData(defaultLineData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customData, timeRange, dateRange]);

  if (loading) {
    return <Skeleton className="w-full h-[350px]" />;
  }
  
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="name" 
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
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            borderRadius: '8px',
            border: '1px solid #e2e8f0' 
          }}
        />
        <Line
          type="monotone"
          dataKey="completion"
          strokeWidth={2}
          activeDot={{ r: 8 }}
          className="stroke-primary"
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

interface PieChartProps {
  customData?: { name: string; value: number }[];
}

export const PieChart = ({ customData }: PieChartProps) => {
  const data = customData || defaultPieData;
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            borderRadius: '8px',
            border: '1px solid #e2e8f0' 
          }}
        />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
} 