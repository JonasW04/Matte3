"use client";

import { useEffect, useRef } from "react";
import { recordProblemViewAction } from "@/actions/progress-actions";

export function ProblemViewTracker({ problemId }: { problemId: string }) {
  const trackedProblemId = useRef<string | null>(null);

  useEffect(() => {
    if (trackedProblemId.current === problemId) return;
    trackedProblemId.current = problemId;
    void recordProblemViewAction(problemId);
  }, [problemId]);

  return null;
}
