"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, BarChart } from './charts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Example top courses data
const topCourses = [
  { id: 1, name: "Introduction to Computer Science", enrollments: 450, department: "Computer Science", growth: "+12%" },
  { id: 2, name: "Business Analytics", enrollments: 378, department: "Business", growth: "+8%" },
  { id: 3, name: "Digital Marketing Fundamentals", enrollments: 356, department: "Business", growth: "+15%" },
  { id: 4, name: "Data Structures and Algorithms", enrollments: 312, department: "Computer Science", growth: "+5%" },
  { id: 5, name: "Machine Learning Basics", enrollments: 298, department: "Computer Science", growth: "+23%" },
]

const EnrollmentStats = () => {
  const [timeRange, setTimeRange] = useState("month")
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <h3 className="text-2xl font-bold">Phân tích đăng ký học</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <DateRangePicker />
          <Select defaultValue="month" onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Tuần trước</SelectItem>
              <SelectItem value="month">Tháng trước</SelectItem>
              <SelectItem value="quarter">Quý trước</SelectItem>
              <SelectItem value="year">Năm trước</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lượt đăng ký mới</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+648</div>
            <p className="text-xs text-muted-foreground">+12.5% so với {timeRange} trước</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỉ lệ đăng ký</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32%</div>
            <p className="text-xs text-muted-foreground">+2.1% so với {timeRange} trước</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Số lượt đăng ký trên mỗi sinh viên</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.7</div>
            <p className="text-xs text-muted-foreground">+0.3 so với {timeRange} trước</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrollment Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">76%</div>
            <p className="text-xs text-muted-foreground">+4% so với {timeRange} trước</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Xu hướng đăng ký học tập</CardTitle>
            <CardDescription>
            Tổng số lượt đăng ký khóa học theo thời gian
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart />
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Số lượng đăng ký theo khoa</CardTitle>
            <CardDescription>
            Phân bố số lượng đăng ký giữa các khoa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Các khóa học hàng đầu theo số lượng đăng ký học</CardTitle>
          <CardDescription>
          Các khóa học có số lượt đăng ký cao nhất
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên khóa học</TableHead>
                <TableHead>Khoa</TableHead>
                <TableHead>Số lượt đăng ký</TableHead>
                <TableHead className="text-right">Tăng trưởng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.name}</TableCell>
                  <TableCell>{course.department}</TableCell>
                  <TableCell>{course.enrollments}</TableCell>
                  <TableCell className="text-right text-green-600">{course.growth}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default EnrollmentStats 