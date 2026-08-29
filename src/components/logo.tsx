import { Briefcase } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export default function Logo({
  size = "md",
  showText = true,
  className = "",
}: LogoProps) {
  const iconSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl blur-sm opacity-60" />
        <div className="relative bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl p-2 flex items-center justify-center">
          <Briefcase className={`${iconSizes[size]} text-white`} />
        </div>
      </div>
      {showText && (
        <span
          className={`font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent ${textSizes[size]}`}
        >
          JobSwipe
        </span>
      )}
    </div>
  );
}
