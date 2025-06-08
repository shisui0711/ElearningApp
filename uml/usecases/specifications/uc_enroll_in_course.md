# Đặc tả Use Case: Ghi danh vào khóa học

- **ID:** UC-014
- **Tên Use Case:** Enroll in Course (Ghi danh vào khóa học)
- **Ngày tạo:** 24/05/2024
- **Phiên bản:** 1.0

---

### 1. Mô tả tóm tắt
Use case này cho phép một `Student` (Sinh viên) đăng ký tham gia một khóa học mà họ tìm thấy trên hệ thống để có thể truy cập vào nội dung học tập chi tiết.

### 2. Actors
- **Actor chính (Primary):** `Student` ( người thực hiện hành động ghi danh).
- **Actor phụ (Secondary):** Không có.

### 3. Điều kiện tiên quyết (Preconditions)
- Student phải đã đăng nhập vào hệ thống (đã xác thực).
- Khóa học mà Student muốn ghi danh phải tồn tại và đang ở trạng thái cho phép ghi danh.
- Student chưa ghi danh vào khóa học này trước đó.

### 4. Điều kiện sau (Postconditions)
- **Thành công:**
    - Một bản ghi `Enrollment` mới được tạo ra, liên kết giữa `Student` và `Course`.
    - Hệ thống ghi nhận `Student` là một học viên của `Course`.
    - `Student` được cấp quyền truy cập vào nội dung của `Course` (ví dụ: chuyển đến trang nội dung khóa học).
- **Thất bại:**
    - Trạng thái hệ thống không thay đổi. `Student` vẫn chưa được ghi danh.
    - Hệ thống hiển thị một thông báo lỗi giải thích lý do thất bại.

### 5. Luồng sự kiện chính (Main Success Scenario)
1. `Student` chọn một khóa học từ danh sách khóa học (từ kết quả của use case "Browse Courses").
2. Hệ thống hiển thị trang chi tiết khóa học, bao gồm thông tin mô tả, giáo viên, và một nút "Ghi danh" (Enroll).
3. `Student` nhấn vào nút "Ghi danh".
4. Hệ thống kiểm tra các điều kiện tiên quyết của khóa học (nếu có).
5. Vì `Student` đáp ứng tất cả các điều kiện, hệ thống tạo một bản ghi `Enrollment` mới.
6. Hệ thống xác nhận ghi danh thành công và tự động chuyển hướng `Student` đến trang nội dung khóa học (thực hiện use case "View Course Content").

### 6. Luồng rẽ nhánh (Extensions / Alternative Flows)

**6a. Khóa học có điều kiện tiên quyết nhưng sinh viên chưa hoàn thành**
- Tại bước 4 của luồng chính:
    1. Hệ thống kiểm tra và phát hiện `Student` chưa hoàn thành các khóa học tiên quyết (`CoursePrerequisite`).
    2. Hệ thống hiển thị một thông báo lỗi, nêu rõ các khóa học cần phải hoàn thành trước.
    3. Use case kết thúc.

**6b. Sinh viên đã ghi danh vào khóa học này từ trước**
- Tại bước 3 của luồng chính:
    1. Hệ thống kiểm tra và phát hiện đã tồn tại một bản ghi `Enrollment` cho `Student` và `Course` này.
    2. Thay vì hiển thị nút "Ghi danh", hệ thống hiển thị nút "Vào học" hoặc "Xem khóa học".
    3. Use case kết thúc và có thể chuyển tiếp sang "View Course Content".

### 7. Yêu cầu đặc biệt (Special Requirements)
- Giao diện phải rõ ràng về trạng thái của khóa học (đã ghi danh hay chưa).
- Phản hồi từ hệ thống (thành công hay thất bại) phải nhanh chóng và dễ hiểu.

### 8. Mối quan hệ
- **Association:** Student
- **Include:**
    - `View Course Content`: Sau khi ghi danh thành công, use case này thường được gọi để sinh viên bắt đầu học ngay lập tức.
- **Extend:** Không có. 