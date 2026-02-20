"use client";

import { ArrowLeft, Timer } from "lucide-react";
import Link from "next/link";

const InterviewNav = ({ interview }: { interview: any }) => {
  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 dark:text-white text-black border-b shadow-lg md:py-6 md:px-10 dark:border-slate-800/80 border-slate-200/80 dark:bg-black/30 bg-white/30 backdrop-blur-md">
        <div className="flex gap-4">
          <span className="logo max-sm:hidden">
            Inter<span className="highlight">View</span>ture
          </span>
          <div className="text-sm leading-2 max-sm:text-xs">
            <h1 className="text-3xl font-bold tracking-tighter max-sm:text-base uppercase">
              {interview.jobRole} interview
            </h1>
            <p className="font-light tracking-tight dark:text-slate-400 text-slate-600">
              Secure your future with the right answers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 dark:text-white text-black">
          <button className="p-3 max-sm:hidden rounded-full border dark:border-slate-700 border-slate-300 dark:bg-slate-800/50 bg-slate-200/50 hover:bg-[#b87a9c]/20 hover:border-[#b87a9c]/50 cursor-pointer transition-all duration-300">
            <Timer className="h-4 w-4 text-[#d8a1bc]" />
          </button>
          <Link
            href={"/dashboard"}
            className="flex dark:hover:bg-slate-800/50 hover:bg-slate-200/50 px-4 py-2 rounded-lg items-center -space-x-1.5 dark:hover:text-white hover:text-black transition-colors duration-400 group"
          >
            <ArrowLeft className="w-4 transition-all duration-300 dark:text-slate-400 text-slate-600 dark:group-hover:text-white group-hover:text-black" />
            <span className="ml-4 text-sm font-medium transition-all duration-300 max-sm:text-xs dark:text-slate-400 text-slate-600 dark:group-hover:text-white group-hover:text-black">
              Back to Dashboard
            </span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default InterviewNav;
