"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import DeleteLessonBtn from "./DeleteLessonBtn";
import ToggleLessonBtn from "./ToggleLessonBtn";
import DuplicateLessonBtn from "./DuplicateLessonBtn";

interface Props {
  courseId: string;
  sectionId: string;
  lessonId: string;
  hidden: boolean;
}

export default function LessonActionsMenu({ courseId, sectionId, lessonId, hidden }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="Actions"
      >
        <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20 animate-slide-down">
          <Link
            href={"/admin/cours/" + courseId + "/sections/" + sectionId + "/lessons/" + lessonId + "/modifier"}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <span>✏️</span><span>Modifier</span>
          </Link>
          <div className="px-2">
            <DuplicateLessonBtn lessonId={lessonId} currentCourseId={courseId} />
          </div>
          <div className="px-2">
            <ToggleLessonBtn lessonId={lessonId} hidden={hidden} />
          </div>
          <div className="border-t border-slate-100 mt-1 pt-1 px-2">
            <DeleteLessonBtn courseId={courseId} sectionId={sectionId} lessonId={lessonId} />
          </div>
        </div>
      )}
    </div>
  );
}
