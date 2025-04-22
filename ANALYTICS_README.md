# Tính năng Phân tích dữ liệu (Analytics)

Tài liệu này mô tả cách thiết lập và sử dụng tính năng phân tích dữ liệu trong ứng dụng E-learning.

## Cấu trúc

Tính năng phân tích dữ liệu bao gồm:

1. **API Endpoints**:
   - `/api/analytics/overview` - Dữ liệu tổng quan
   - `/api/analytics/user-growth` - Dữ liệu tăng trưởng người dùng
   - `/api/analytics/exams` - Dữ liệu hiệu suất bài thi
   - `/api/analytics` - API phân tích chung (đã có sẵn)

2. **Components**:
   - `UserGrowth` - Biểu đồ tăng trưởng người dùng
   - `ExamPerformance` - Phân tích hiệu suất bài thi
   - `Charts` - Các component biểu đồ cơ bản (BarChart, LineChart, PieChart)

3. **Utilities**:
   - `lib/analytics/overview.ts` - Hàm lấy dữ liệu tổng quan cho dashboard

4. **Seeding Data**:
   - `prisma/seed.ts` - Script tạo dữ liệu mẫu cho phân tích

## Cài đặt và Chạy

### 1. Cài đặt dependencies

```bash
npm install
# hoặc
yarn
# hoặc
pnpm install
```

### 2. Tạo dữ liệu mẫu

```bash
npx prisma db push  # Đảm bảo schema được áp dụng
npm run seed        # Chạy script seeding
# hoặc
yarn seed
# hoặc
pnpm seed
```

### 3. Chạy ứng dụng

```bash
npm run dev
# hoặc
yarn dev
# hoặc
pnpm dev
```

## Sử dụng

1. Đăng nhập vào hệ thống với tài khoản admin:
   - Username: `admin`
   - Password: `admin123`

2. Truy cập vào trang phân tích dữ liệu tại `/admin/analytics`

3. Khám phá các tab khác nhau:
   - **Tổng quan**: Thống kê chung về hệ thống
   - **Đăng ký khóa học**: Phân tích về đăng ký khóa học
   - **Tỉ lệ hoàn thành**: Biểu đồ và số liệu hoàn thành khóa học
   - **Hiệu suất bài thi**: Phân tích chi tiết về kết quả thi
   - **Khoa**: Thống kê theo phòng ban

## Tùy chỉnh và Mở rộng

### Thêm API Endpoint mới

1. Tạo file trong `app/api/analytics/[tên-endpoint]/route.ts`
2. Triển khai logic lấy dữ liệu từ database và trả về JSON

### Thêm Component Phân tích mới

1. Tạo component mới trong `components/analytics/`
2. Sử dụng `fetch` để lấy dữ liệu từ API endpoints
3. Thêm component vào trang analytics trong `app/(main)/admin/analytics/page.tsx`

## Cấu trúc Dữ liệu

### Dữ liệu Tổng quan (Overview)

```typescript
{
  totalStudents: number;      // Tổng số sinh viên
  totalCourses: number;       // Tổng số khóa học
  completionRate: number;     // Tỷ lệ hoàn thành trung bình
  averageScore: number;       // Điểm thi trung bình
  studentChange: number;      // Thay đổi số lượng sinh viên so với tháng trước
  courseChange: number;       // Thay đổi số lượng khóa học so với tháng trước
  completionRateChange: number; // Thay đổi tỷ lệ hoàn thành
  scoreChange: number;        // Thay đổi điểm trung bình
}
```

### Dữ liệu Tăng trưởng Người dùng (User Growth)

```typescript
[
  {
    month: string;     // Tháng (ví dụ: "Jan")
    students: number;  // Số sinh viên
    teachers: number;  // Số giáo viên
  },
  // ...
]
```

### Dữ liệu Hiệu suất Bài thi (Exam Performance)

```typescript
{
  overview: {
    avgScore: number;     // Điểm trung bình
    totalExams: number;   // Tổng số bài thi
    totalAttempts: number; // Tổng số lần thi
    passingRate: number;  // Tỷ lệ vượt qua
    avgScoreChange: number; // Thay đổi điểm trung bình
    attemptsChange: number; // Thay đổi số lần thi
  },
  examDetails: [          // Chi tiết các bài thi
    {
      id: string;
      name: string;
      avgScore: number;
      attempts: number;
      passingRate: number;
    },
    // ...
  ],
  scoreDistribution: [    // Phân phối điểm
    {
      range: string;     // Ví dụ: "0-20"
      count: number;     // Số lượng
    },
    // ...
  ],
  difficultQuestions: [   // Câu hỏi khó
    {
      questionId: string;
      text: string;
      exam: string;
      correctRate: number;
      difficulty: string;
    },
    // ...
  ],
  performanceTrend: [     // Xu hướng hiệu suất theo thời gian
    {
      name: string;       // Ví dụ: "Week 1"
      completion: number; // % hoàn thành
    },
    // ...
  ]
}
``` 