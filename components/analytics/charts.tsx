"use client"

import React from 'react'
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

// Example data - These would typically come from API calls
const barData = [
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

const lineData = [
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

const pieData = [
  { name: 'Computer Science', value: 540 },
  { name: 'Business', value: 620 },
  { name: 'Engineering', value: 480 },
  { name: 'Arts', value: 320 },
  { name: 'Medicine', value: 280 }
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export const BarChart = () => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsBarChart data={barData}>
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

export const LineChart = () => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsLineChart data={lineData}>
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

export const PieChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsPieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {pieData.map((entry, index) => (
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