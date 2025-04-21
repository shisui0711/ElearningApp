import { z } from "zod";

export const signInSchema = z.object({
    username: z.string().trim().min(1, "Tên đăng nhập không được để trống"),
    password: z.string().trim().min(1, "Mật khẩu không được để trống"),
  });
  
  export type SignInValues = z.infer<typeof signInSchema>;

  export const signUpSchema = z.object({
    firstName: z
      .string()
      .trim()
      .min(1, "Họ không được để trống")
      .regex(
        /^[aAàÀảẢãÃáÁạẠăĂằẰẳẲẵẴắẮặẶâÂầẦẩẨẫẪấẤậẬbBcCdDđĐeEèÈẻẺẽẼéÉẹẸêÊềỀểỂễỄếẾệỆfFgGhHiIìÌỉỈĩĨíÍịỊjJkKlLmMnNoOòÒỏỎõÕóÓọỌôÔồỒổỔỗỖốỐộỘơƠờỜởỞỡỠớỚợỢpPqQrRsStTuUùÙủỦũŨúÚụỤưƯừỪửỬữỮứỨựỰvVwWxXyYỳỲỷỶỹỸýÝỵỴzZ\s]*$/,
        "Họ không hợp lệ"
      ),
    lastName: z
      .string()
      .trim()
      .min(1, "Tên không được để trống")
      .regex(
        /^[aAàÀảẢãÃáÁạẠăĂằẰẳẲẵẴắẮặẶâÂầẦẩẨẫẪấẤậẬbBcCdDđĐeEèÈẻẺẽẼéÉẹẸêÊềỀểỂễỄếẾệỆfFgGhHiIìÌỉỈĩĨíÍịỊjJkKlLmMnNoOòÒỏỎõÕóÓọỌôÔồỒổỔỗỖốỐộỘơƠờỜởỞỡỠớỚợỢpPqQrRsStTuUùÙủỦũŨúÚụỤưƯừỪửỬữỮứỨựỰvVwWxXyYỳỲỷỶỹỸýÝỵỴzZ\s]*$/,
        "Tên không hợp lệ"
      ),
    email: z
      .string()
      .trim()
      .min(1, "Email không được để trống")
      .email("Email không hợp lệ"),
    username: z
      .string()
      .trim()
      .min(1, "Tên đăng nhập không được để trống")
      .regex(/^[a-zA-Z0-9_]{1,30}$/, "Tên đăng nhập không hợp lệ"),
    password: z.string().trim().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
    repassword: z.string().trim().min(1, "Mật khẩu không được để trống"),
  });
  
  export type SignUpValues = z.infer<typeof signUpSchema>;

export const createCourseSchema = z.object({
  name: z.string().trim().min(1, "Tên khóa học không được để trống"),
  description: z.string().trim().min(1, "Mô tả không được để trống"),
  imageUrl: z.string().trim().optional(),
  departmentId: z.string().trim().min(1, "Danh mục không được để trống"),
});

export type CreateCourseValues = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = z.object({
  id: z.string().trim().min(1, "ID khóa học không được để trống"),
  name: z.string().trim().min(1, "Tên khóa học không được để trống"),
  description: z.string().trim().min(1, "Mô tả không được để trống"),
  imageUrl: z.string().trim().optional(),
  departmentId: z.string().trim().min(1, "Danh mục không được để trống"),
});

export type UpdateCourseValues = z.infer<typeof updateCourseSchema>;

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(1, "Tên khoa không được để trống"),
});

export type CreateDepartmentValues = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = z.object({
  id: z.string().trim().min(1, "ID không được để trống"),
  name: z.string().trim().min(1, "Tên khoa không được để trống")
})

export type UpdateDepartmentValues = z.infer<typeof updateDepartmentSchema>

export const createTeacherSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Tên đăng nhập không được để trống")
    .regex(/^[a-zA-Z0-9_]{1,30}$/, "Tên đăng nhập không hợp lệ"),
  firstName: z
    .string()
    .trim()
    .min(1, "Họ không được để trống")
    .regex(
      /^[aAàÀảẢãÃáÁạẠăĂằẰẳẲẵẴắẮặẶâÂầẦẩẨẫẪấẤậẬbBcCdDđĐeEèÈẻẺẽẼéÉẹẸêÊềỀểỂễỄếẾệỆfFgGhHiIìÌỉỈĩĨíÍịỊjJkKlLmMnNoOòÒỏỎõÕóÓọỌôÔồỒổỔỗỖốỐộỘơƠờỜởỞỡỠớỚợỢpPqQrRsStTuUùÙủỦũŨúÚụỤưƯừỪửỬữỮứỨựỰvVwWxXyYỳỲỷỶỹỸýÝỵỴzZ\s]*$/,
      "Họ không hợp lệ"
    ),
  lastName: z
    .string()
    .trim()
    .min(1, "Tên không được để trống")
    .regex(
      /^[aAàÀảẢãÃáÁạẠăĂằẰẳẲẵẴắẮặẶâÂầẦẩẨẫẪấẤậẬbBcCdDđĐeEèÈẻẺẽẼéÉẹẸêÊềỀểỂễỄếẾệỆfFgGhHiIìÌỉỈĩĨíÍịỊjJkKlLmMnNoOòÒỏỎõÕóÓọỌôÔồỒổỔỗỖốỐộỘơƠờỜởỞỡỠớỚợỢpPqQrRsStTuUùÙủỦũŨúÚụỤưƯừỪửỬữỮứỨựỰvVwWxXyYỳỲỷỶỹỸýÝỵỴzZ\s]*$/,
      "Tên không hợp lệ"
    ),
  email: z
    .string()
    .trim()
    .min(1, "Email không được để trống")
    .email("Email không hợp lệ"),
  password: z.string().trim().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
});

export type CreateTeacherValues = z.infer<typeof createTeacherSchema>;

export const updateTeacherSchema = z.object({
  id: z.string().trim().min(1, "ID không được để trống"),
  firstName: z
    .string()
    .trim()
    .min(1, "Họ không được để trống")
    .regex(
      /^[aAàÀảẢãÃáÁạẠăĂằẰẳẲẵẴắẮặẶâÂầẦẩẨẫẪấẤậẬbBcCdDđĐeEèÈẻẺẽẼéÉẹẸêÊềỀểỂễỄếẾệỆfFgGhHiIìÌỉỈĩĨíÍịỊjJkKlLmMnNoOòÒỏỎõÕóÓọỌôÔồỒổỔỗỖốỐộỘơƠờỜởỞỡỠớỚợỢpPqQrRsStTuUùÙủỦũŨúÚụỤưƯừỪửỬữỮứỨựỰvVwWxXyYỳỲỷỶỹỸýÝỵỴzZ\s]*$/,
      "Họ không hợp lệ"
    ),
  lastName: z
    .string()
    .trim()
    .min(1, "Tên không được để trống")
    .regex(
      /^[aAàÀảẢãÃáÁạẠăĂằẰẳẲẵẴắẮặẶâÂầẦẩẨẫẪấẤậẬbBcCdDđĐeEèÈẻẺẽẼéÉẹẸêÊềỀểỂễỄếẾệỆfFgGhHiIìÌỉỈĩĨíÍịỊjJkKlLmMnNoOòÒỏỎõÕóÓọỌôÔồỒổỔỗỖốỐộỘơƠờỜởỞỡỠớỚợỢpPqQrRsStTuUùÙủỦũŨúÚụỤưƯừỪửỬữỮứỨựỰvVwWxXyYỳỲỷỶỹỸýÝỵỴzZ\s]*$/,
      "Tên không hợp lệ"
    ),
  email: z
    .string()
    .trim()
    .min(1, "Email không được để trống")
    .email("Email không hợp lệ"),
});

export type UpdateTeacherValues = z.infer<typeof updateTeacherSchema>;

export const createStudentSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Tên đăng nhập không được để trống")
    .regex(/^[a-zA-Z0-9_]{1,30}$/, "Tên đăng nhập không hợp lệ"),
  firstName: z
    .string()
    .trim()
    .min(1, "Họ không được để trống")
    .regex(
      /^[aAàÀảẢãÃáÁạẠăĂằẰẳẲẵẴắẮặẶâÂầẦẩẨẫẪấẤậẬbBcCdDđĐeEèÈẻẺẽẼéÉẹẸêÊềỀểỂễỄếẾệỆfFgGhHiIìÌỉỈĩĨíÍịỊjJkKlLmMnNoOòÒỏỎõÕóÓọỌôÔồỒổỔỗỖốỐộỘơƠờỜởỞỡỠớỚợỢpPqQrRsStTuUùÙủỦũŨúÚụỤưƯừỪửỬữỮứỨựỰvVwWxXyYỳỲỷỶỹỸýÝỵỴzZ\s]*$/,
      "Họ không hợp lệ"
    ),
  lastName: z
    .string()
    .trim()
    .min(1, "Tên không được để trống")
    .regex(
      /^[aAàÀảẢãÃáÁạẠăĂằẰẳẲẵẴắẮặẶâÂầẦẩẨẫẪấẤậẬbBcCdDđĐeEèÈẻẺẽẼéÉẹẸêÊềỀểỂễỄếẾệỆfFgGhHiIìÌỉỈĩĨíÍịỊjJkKlLmMnNoOòÒỏỎõÕóÓọỌôÔồỒổỔỗỖốỐộỘơƠờỜởỞỡỠớỚợỢpPqQrRsStTuUùÙủỦũŨúÚụỤưƯừỪửỬữỮứỨựỰvVwWxXyYỳỲỷỶỹỸýÝỵỴzZ\s]*$/,
      "Tên không hợp lệ"
    ),
  email: z
    .string()
    .trim()
    .min(1, "Email không được để trống")
    .email("Email không hợp lệ"),
  password: z.string().trim().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
  classId: z.string().trim().min(1, "Lớp không được để trống"),
});

export type CreateStudentValues = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = z.object({
  id: z.string().trim().min(1, "ID không được để trống"),
  firstName: z
    .string()
    .trim()
    .min(1, "Họ không được để trống")
    .regex(
      /^[aAàÀảẢãÃáÁạẠăĂằẰẳẲẵẴắẮặẶâÂầẦẩẨẫẪấẤậẬbBcCdDđĐeEèÈẻẺẽẼéÉẹẸêÊềỀểỂễỄếẾệỆfFgGhHiIìÌỉỈĩĨíÍịỊjJkKlLmMnNoOòÒỏỎõÕóÓọỌôÔồỒổỔỗỖốỐộỘơƠờỜởỞỡỠớỚợỢpPqQrRsStTuUùÙủỦũŨúÚụỤưƯừỪửỬữỮứỨựỰvVwWxXyYỳỲỷỶỹỸýÝỵỴzZ\s]*$/,
      "Họ không hợp lệ"
    ),
  lastName: z
    .string()
    .trim()
    .min(1, "Tên không được để trống")
    .regex(
      /^[aAàÀảẢãÃáÁạẠăĂằẰẳẲẵẴắẮặẶâÂầẦẩẨẫẪấẤậẬbBcCdDđĐeEèÈẻẺẽẼéÉẹẸêÊềỀểỂễỄếẾệỆfFgGhHiIìÌỉỈĩĨíÍịỊjJkKlLmMnNoOòÒỏỎõÕóÓọỌôÔồỒổỔỗỖốỐộỘơƠờỜởỞỡỠớỚợỢpPqQrRsStTuUùÙủỦũŨúÚụỤưƯừỪửỬữỮứỨựỰvVwWxXyYỳỲỷỶỹỸýÝỵỴzZ\s]*$/,
      "Tên không hợp lệ"
    ),
  email: z
    .string()
    .trim()
    .min(1, "Email không được để trống")
    .email("Email không hợp lệ"),
  classId: z.string().trim().min(1, "Lớp không được để trống"),
});

export type UpdateStudentValues = z.infer<typeof updateStudentSchema>;

export const createClassSchema = z.object({
  name: z.string().trim().min(1, "Tên lớp không được để trống"),
  departmentId: z.string().trim().min(1, "Khoa không được để trống"),
});

export type CreateClassValues = z.infer<typeof createClassSchema>;

export const updateClassSchema = z.object({
  id: z.string().trim().min(1, "ID không được để trống"),
  name: z.string().trim().min(1, "Tên lớp không được để trống"),
  departmentId: z.string().trim().min(1, "Khoa không được để trống"),
});

export type UpdateClassValues = z.infer<typeof updateClassSchema>;

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, {
      message: 'Vui lòng nhập mật khẩu hiện tại',
    }),
    newPassword: z
      .string()
      .min(8, {
        message: 'Mật khẩu phải có ít nhất 8 ký tự',
      })
      .regex(/[A-Z]/, {
        message: 'Mật khẩu phải có ít nhất 1 ký tự viết hoa',
      })
      .regex(/[a-z]/, {
        message: 'Mật khẩu phải có ít nhất 1 ký tự viết thường',
      })
      .regex(/[0-9]/, {
        message: 'Mật khẩu phải có ít nhất 1 chữ số',
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export type PasswordFormValues = z.infer<typeof passwordSchema>;

export const profileSchema = z.object({
  displayName: z.string().min(2, {
    message: 'Tên hiển thị phải có ít nhất 2 ký tự',
  }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email({
    message: 'Email không hợp lệ',
  }),
  bio: z.string().max(500, {
    message: 'Giới thiệu không được vượt quá 500 ký tự',
  }).optional(),
  location: z.string().max(100, {
    message: 'Địa chỉ không được vượt quá 100 ký tự',
  }).optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
