import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JobSwipe AI — Authentication",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
