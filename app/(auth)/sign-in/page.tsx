import { Metadata } from "next";
import React from "react";
import SignInForm from "./SignInForm";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { title: "Đăng nhập | UTEHY E-Learning" };

const Page = () => {
  return (
    <main className="h-screen flex items-center justify-center p-0 bg-gray-50 dark:bg-gray-900">
      <div className="flex h-full w-full lg:h-[85vh] lg:max-w-7xl lg:rounded-3xl overflow-hidden bg-white dark:bg-gray-800 shadow-2xl transition-all duration-300">
        {/* Left side - Background Image */}
        <div className="hidden lg:block lg:w-1/2 relative">
          <Image
            src="/images/bg-utehy.jpg"
            alt="UTEHY Campus"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/40 to-purple-600/40 flex flex-col justify-end p-10">
            <h2 className="text-white text-3xl font-bold mb-2 drop-shadow-md">
              UTEHY E-Learning
            </h2>
            <p className="text-white/90 text-lg drop-shadow-md">
              Hệ thống học tập trực tuyến cho sinh viên và giảng viên
            </p>
          </div>
        </div>
        {/* Right side - Sign in form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 lg:p-10">
          <div className="w-full max-w-md space-y-8">
            {/* Logo */}
            <div className="flex flex-col items-center">
              <div className="bg-blue-600 p-3 rounded-2xl mb-6 shadow-lg">
                <Image
                  src="/images/logo.png"
                  alt="Logo"
                  width={60}
                  height={60}
                  className="w-auto h-auto"
                />
              </div>
              <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Đăng nhập
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-center">
                Đăng nhập để truy cập hệ thống học tập
              </p>
            </div>
            {/* Form */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <SignInForm />
              {/* Additional links */}
              <div className="mt-6 text-center text-sm">
                <Link
                  href="/forgot-password"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            </div>
            {/* Footer */}
            <div className="text-center text-xs text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} UTEHY E-Learning. Bản quyền thuộc về
              Trường Đại học Sư phạm Kỹ thuật Hưng Yên
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;
