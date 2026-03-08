"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Heart, MessageCircle, Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-blue-900">BaanTDee</span>
            <span className="ml-1 text-xs text-muted-foreground">อสังหาฯ</span>
          </div>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden flex-1 max-w-xl mx-8 md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาบ้าน คอนโด ที่ดิน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 rounded-full border-gray-300 focus-visible:ring-blue-500"
            />
          </div>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {user && (
            <Link href="/favorites">
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <Heart className="h-5 w-5 text-gray-600" />
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <MessageCircle className="h-5 w-5 text-gray-600" />
          </Button>

          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                <User className="h-4 w-4" />
                <span className="max-w-[120px] truncate">{user.name}</span>
              </div>
              <button
                onClick={() => logout()}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login" className="text-sm text-gray-600 hover:text-blue-900">
                เข้าสู่ระบบ
              </Link>
              <span className="text-gray-300">/</span>
              <Link href="/register" className="text-sm text-gray-600 hover:text-blue-900">
                สมัครสมาชิก
              </Link>
            </div>
          )}

          <Link href={user ? "/listings/create" : "/login"}>
            <Button className="ml-2 rounded-full bg-blue-900 hover:bg-blue-800 text-white px-6">
              ลงประกาศ
            </Button>
          </Link>

          {/* Mobile menu */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
