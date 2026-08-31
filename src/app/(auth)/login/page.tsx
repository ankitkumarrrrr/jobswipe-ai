"use client";

import dynamic from "next/dynamic";

const LampLogin = dynamic(
  () => import("@/components/lamp-login"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#030712] via-[#111827] to-[#030712]">
        <div className="text-gray-500">Loading...</div>
      </div>
    ),
  }
);

export default function LoginPage() {
  return <LampLogin />;
}
