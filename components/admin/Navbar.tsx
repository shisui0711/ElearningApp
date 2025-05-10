'use client'
import { useSession } from "@/provider/SessionProvider"
import UserAvatar from "../UserAvatar";
import { Bell, Search, MessageCircle } from "lucide-react";
import UserButton from "../UserButton";
import { ThemeToggle } from "../ThemeToggle";

const Navbar = () => {
  const { user } = useSession();
  return (
    <div className='flex items-center justify-between p-4 border-b'>
      {/* SEARCH BAR */}
      <div className='hidden md:flex items-center gap-2 text-xs rounded-full ring-1 ring-border px-3 py-1.5'>
        <Search className="w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Tìm kiếm..." className="w-[200px] p-1 bg-transparent outline-none text-sm" />
      </div>

      {/* ICONS AND USER */}
      <div className='flex items-center gap-6 justify-end'>
        {/* <div className='bg-muted/50 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer relative hover:bg-muted transition-all'>
          <Bell className="w-4 h-4 text-muted-foreground" />
          <div className='absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-primary text-primary-foreground rounded-full text-[10px]'>1</div>
        </div> */}
        <div className='flex flex-col'>
          <span className="text-sm leading-4 font-medium text-gradient-1">{user.displayName}</span>
          <span className="text-[11px] text-gradient-3 text-right font-medium">Admin</span>
        </div>
        <UserButton/>
      </div>
    </div>
  )
}

export default Navbar