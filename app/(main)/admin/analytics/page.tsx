import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, LineChart, PieChart } from '@/components/analytics/charts'
import EnrollmentStats from '@/components/analytics/enrollment-stats'
import CourseCompletionStats from '@/components/analytics/course-completion-stats'
import ExamPerformance from '@/components/analytics/exam-performance'
import UserGrowth from '@/components/analytics/user-growth'
import DepartmentStats from '@/components/analytics/department-stats'

export const metadata = {
  title: 'Phân tích dữ liệu',
}

const AnalyticsPage = () => {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Phân tích dữ liệu</h2>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="enrollments">Đăng ký khóa học</TabsTrigger>
          <TabsTrigger value="completions">Tỉ lệ hoàn thành</TabsTrigger>
          <TabsTrigger value="exams">Hiệu suất bài thi</TabsTrigger> 
          <TabsTrigger value="departments">Khoa</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng số sinh viên<nav></nav></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+2350</div>
                <p className="text-xs text-muted-foreground">+180 so với tháng trước</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Khóa học đang mở</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+73</div>
                <p className="text-xs text-muted-foreground">+12 so với tháng trước</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tỷ lệ hoàn thành trung bình</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">68%</div>
                <p className="text-xs text-muted-foreground">+4% so với tháng trước</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Điểm thi trung bình</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">76%</div>
                <p className="text-xs text-muted-foreground">+2% so với tháng trước</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Tỉ lệ người dùng hệ thống</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <UserGrowth />
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Tỉ lệ đăng ký khóa học</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <BarChart />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="enrollments" className="space-y-4">
          <EnrollmentStats />
        </TabsContent>
        
        <TabsContent value="completions" className="space-y-4">
          <CourseCompletionStats />
        </TabsContent>
        
        <TabsContent value="exams" className="space-y-4">
          <ExamPerformance />
        </TabsContent>
        
        <TabsContent value="departments" className="space-y-4">
          <DepartmentStats />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AnalyticsPage 