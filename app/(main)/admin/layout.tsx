import Menu from "@/components/admin/Menu";
import Navbar from "@/components/admin/Navbar";
import AdminFooter from "@/components/admin/Footer";
import Image from "next/image";
import Link from "next/link";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex overflow-hidden">
      {/* LEFT */}
      <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4 h-screen">
        <Link
          href="/"
          className="flex items-center justify-center lg:justify-start gap-2"
        >
          <Image src="/images/logo.png" alt="logo" width={32} height={32} />
          <span className="hidden lg:block font-bold text-gradient-1">Easy Learn</span>
        </Link>
        <Menu />
      </div>
      {/* RIGHT */}
      <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-background h-screen overflow-hidden flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
          <AdminFooter />
        </div>
      </div>
    </div>
  );
}
