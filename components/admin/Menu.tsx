import Image from "next/image";
import Link from "next/link";

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: "/images/home.png",
        label: "Bảng điều khiển",
        href: "/admin"
      },
      {
        icon: "/images/class.png",
        label: "Lớp học",
        href: "/admin/classes"
      },
      {
        icon: "/images/teacher.png",
        label: "Giáo viên",
        href: "/admin/teachers"
      },
      {
        icon: "/images/student.png",
        label: "Học sinh",
        href: "/admin/students"
      },
      {
        icon: "/images/subject.png",
        label: "Phân tích dữ liệu",
        href: "/admin/analytics"
      },
      {
        icon: "/images/class.png",
        label: "Khoa",
        href: "/admin/departments"
      },
      {
        icon: "/images/exam.png",
        label: "Kiểm tra",
        href: "/admin/exams"
      },
      {
        icon: "/images/assignment.png",
        label: "Khóa học",
        href: "/admin/courses"
      },
      {
        icon: "/images/calendar.png",
        label: "Môn học",
        href: "/admin/subjects"
      },
      // {
      //   icon: "/images/announcement.png",
      //   label: "Thông báo",
      //   href: "/admin/announcements"
      // },
    ],
  },
  {
    title: "Khác",
    items: [
      // {
      //   icon: "/images/setting.png",
      //   label: "Cài đặt",
      //   href: "/admin/settings"
      // },
      {
        icon: "/images/logout.png",
        label: "Đăng xuất",
        href: "/logout"
      },
    ],
  },
];

const Menu = () => {
  return (
    <div className="mt-4 text-sm">
      {menuItems.map((i) => (
        <div className="flex flex-col gap-2" key={i.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {i.title}
          </span>
          {i.items.map((item) => {
            return (
                <Link
                  href={item.href}
                  key={item.label}
                  className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight"
                >
                  <Image src={item.icon} alt="" width={20} height={20} />
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              );
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;
