"use client";

import { ArrowLeft, Timer } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const InterviewNav = ({ interview }: { interview: any }) => {
  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 text-white border-b shadow-lg md:py-6 md:px-10 border-slate-800/80 bg-black/30 backdrop-blur-md">
        <div className="flex gap-4">
          <Image
            width={40}
            height={40}
            className="max-sm:hidden"
            src="/images/Logo.svg"
            alt="Logo Image"
          />
          <div className="text-sm leading-2 max-sm:text-xs">
            <h1 className="text-3xl font-bold tracking-tighter max-sm:text-base">
              {interview.jobRole} interview
            </h1>
            <p className="font-light tracking-tight text-slate-400">
              Secure your future with the right answers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-white">
          <button className="p-3 max-sm:hidden rounded-full border border-slate-700 bg-slate-800/50 hover:bg-[#b87a9c]/20 hover:border-[#b87a9c]/50 cursor-pointer transition-all duration-300">
            <Timer className="h-4 w-4 text-[#d8a1bc]" />
          </button>
          <Link
            href={"/dashboard"}
            className="flex hover:bg-slate-800/50 px-4 py-2 rounded-lg items-center -space-x-1.5 hover:text-white transition-colors duration-400 group"
          >
            <ArrowLeft className="w-4 transition-all duration-300 text-slate-400 group-hover:text-white" />
            <span className="ml-4 text-sm font-medium transition-all duration-300 max-sm:text-xs text-slate-400 group-hover:text-white">
              Back to Dashboard
            </span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default InterviewNav;
