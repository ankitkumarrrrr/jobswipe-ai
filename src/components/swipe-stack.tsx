"use client";

import { useState, useRef, useCallback } from "react";
import JobCard from "./job-card";
import { ThumbsDown, ThumbsUp, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  description: string;
  matchScore: number;
  source: string;
  postedAt: string;
}

interface SwipeStackProps {
  jobs: Job[];
  onSwipe: (jobId: string, action: "LIKE" | "DISLIKE") => void;
}

export default function SwipeStack({ jobs, onSwipe }: SwipeStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<
    "left" | "right" | null
  >(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);

  const currentJob = jobs[currentIndex];
  const nextJob = jobs[currentIndex + 1];
  const prevJob = jobs[currentIndex - 1];

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (!currentJob) return;
      setSwipeDirection(direction);

      setTimeout(() => {
        onSwipe(currentJob.id, direction === "right" ? "LIKE" : "DISLIKE");
        setCurrentIndex((prev) => prev + 1);
        setSwipeDirection(null);
        setDragX(0);
      }, 400);
    },
    [currentJob, onSwipe]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!cardRef.current) return;
    setIsDragging(true);
    startX.current = e.clientX;
    cardRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startX.current;
    setDragX(dx);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (Math.abs(dragX) > 120) {
      handleSwipe(dragX > 0 ? "right" : "left");
    } else {
      setDragX(0);
    }
  };

  const getCardStyle = (
    index: number
  ): React.CSSProperties => {
    if (index === currentIndex) {
      const rotation = dragX * 0.1;
      return {
        transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
        opacity: 1,
        zIndex: 3,
      };
    }
    if (index === currentIndex + 1) {
      return {
        transform: "scale(0.95) translateY(12px)",
        opacity: 0.7,
        zIndex: 2,
      };
    }
    if (index === currentIndex + 2) {
      return {
        transform: "scale(0.9) translateY(24px)",
        opacity: 0.4,
        zIndex: 1,
      };
    }
    return { opacity: 0, zIndex: 0 };
  };

  if (currentIndex >= jobs.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">All caught up!</h2>
        <p className="text-gray-500 mb-6">
          You&apos;ve reviewed all available jobs. Check back later for new matches.
        </p>
        <Button
          onClick={() => setCurrentIndex(0)}
          variant="outline"
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Start Over
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Swipe Instructions */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <ThumbsDown className="h-4 w-4 text-red-400" />
          <span>← Swipe left to skip</span>
        </div>
        <div className="h-4 w-px bg-gray-300" />
        <div className="flex items-center gap-1">
          <span>Swipe right to apply →</span>
          <ThumbsUp className="h-4 w-4 text-green-400" />
        </div>
      </div>

      {/* Card Stack */}
      <div className="relative w-full max-w-lg h-[500px]">
        {jobs
          .slice(currentIndex, currentIndex + 3)
          .map((job, i) => (
            <div
              key={job.id}
              ref={i === 0 ? cardRef : undefined}
              className={`absolute inset-0 ${
                i === 0 && swipeDirection === "left"
                  ? "animate-swipe-left"
                  : i === 0 && swipeDirection === "right"
                    ? "animate-swipe-right"
                    : ""
              }`}
              style={
                i === 0
                  ? {
                      ...getCardStyle(currentIndex),
                      ...(swipeDirection
                        ? {}
                        : {
                            transform: `translateX(${dragX}px) rotate(${dragX * 0.1}deg)`,
                          }),
                    }
                  : getCardStyle(currentIndex + i)
              }
              onPointerDown={i === 0 ? handlePointerDown : undefined}
              onPointerMove={i === 0 ? handlePointerMove : undefined}
              onPointerUp={i === 0 ? handlePointerUp : undefined}
            >
              <JobCard job={job} />
            </div>
          ))}

        {/* Drag overlay indicators */}
        {isDragging && Math.abs(dragX) > 50 && (
          <>
            <div
              className="absolute top-4 right-4 z-10 pointer-events-none transition-opacity"
              style={{ opacity: dragX > 50 ? Math.min((dragX - 50) / 100, 1) : 0 }}
            >
              <div className="bg-green-500 text-white px-4 py-2 rounded-lg text-xl font-bold rotate-12 border-2 border-green-400 shadow-lg">
                APPLY ✓
              </div>
            </div>
            <div
              className="absolute top-4 left-4 z-10 pointer-events-none transition-opacity"
              style={{ opacity: dragX < -50 ? Math.min((-dragX - 50) / 100, 1) : 0 }}
            >
              <div className="bg-red-500 text-white px-4 py-2 rounded-lg text-xl font-bold -rotate-12 border-2 border-red-400 shadow-lg">
                SKIP ✗
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <Button
          size="lg"
          variant="outline"
          className="h-14 w-14 rounded-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 p-0"
          onClick={() => handleSwipe("left")}
        >
          <ThumbsDown className="h-6 w-6" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-12 w-12 rounded-full border-gray-200 text-gray-500 hover:bg-gray-50 p-0"
          onClick={() => {
            /* info action */
          }}
        >
          <Info className="h-5 w-5" />
        </Button>
        <Button
          size="lg"
          className="h-14 w-14 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white p-0 shadow-lg shadow-green-500/25"
          onClick={() => handleSwipe("right")}
        >
          <ThumbsUp className="h-6 w-6" />
        </Button>
      </div>

      {/* Progress */}
      <p className="text-sm text-gray-500">
        {currentIndex + 1} of {jobs.length} jobs
      </p>
    </div>
  );
}
