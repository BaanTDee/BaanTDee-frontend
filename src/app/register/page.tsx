"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register, user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    router.replace("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    setLoading(true);
    const result = await register({ name, email, password, phone });
    if (result.ok) {
      router.push("/");
    } else {
      setError(result.error || "สมัครสมาชิกไม่สำเร็จ");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">สมัครสมาชิก</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            สร้างบัญชี BaanTDee เพื่อลงประกาศและค้นหาอสังหาฯ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ชื่อ</label>
            <Input
              placeholder="ชื่อที่แสดง"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">อีเมล</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">เบอร์โทร</label>
            <Input
              type="tel"
              placeholder="0812345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">รหัสผ่าน</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ยืนยันรหัสผ่าน</label>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-900 hover:bg-blue-800"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            สมัครสมาชิก
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="font-medium text-blue-900 hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
