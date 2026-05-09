import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ProgressStatus } from "@prisma/client";
import { selectContinueProblem } from "../lib/progress";

function problem(
  id: string,
  status?: ProgressStatus,
  lastAttemptedAt?: Date | null,
  solutionViewedAt?: Date | null,
  lastViewedAt?: Date | null
) {
  return {
    id,
    progress: status
      ? [
          {
            status,
            lastAttemptedAt: lastAttemptedAt ?? null,
            solutionViewedAt: solutionViewedAt ?? null,
            lastViewedAt: lastViewedAt ?? null
          }
        ]
      : []
  };
}

describe("selectContinueProblem", () => {
  it("prefers the latest attempted unresolved problem over list order", () => {
    const staleUnresolved = problem("stale", ProgressStatus.NOT_SOLVED, new Date("2026-01-01T10:00:00Z"));
    const untouched = problem("untouched");
    const latestUnresolved = problem("latest", ProgressStatus.NOT_SOLVED, new Date("2026-01-05T10:00:00Z"));

    const selected = selectContinueProblem([staleUnresolved, untouched, latestUnresolved]);

    assert.equal(selected?.id, "latest");
  });

  it("uses the latest opened problem as recent work before any answer is marked", () => {
    const unresolved = problem("unresolved", ProgressStatus.NOT_SOLVED, new Date("2026-01-01T10:00:00Z"));
    const opened = problem("opened", ProgressStatus.NOT_ATTEMPTED, null, null, new Date("2026-01-05T10:00:00Z"));

    const selected = selectContinueProblem([unresolved, opened]);

    assert.equal(selected?.id, "opened");
  });

  it("treats a viewed solution as recent work without counting it as solved", () => {
    const unresolved = problem("unresolved", ProgressStatus.NOT_SOLVED, new Date("2026-01-01T10:00:00Z"));
    const viewed = problem("viewed", ProgressStatus.NOT_ATTEMPTED, null, new Date("2026-01-05T10:00:00Z"));

    const selected = selectContinueProblem([unresolved, viewed]);

    assert.equal(selected?.id, "viewed");
  });

  it("falls back to an untouched problem when nothing has been left unresolved", () => {
    const solved = problem("solved", ProgressStatus.SOLVED, new Date("2026-01-05T10:00:00Z"));
    const untouched = problem("untouched");

    const selected = selectContinueProblem([solved, untouched]);

    assert.equal(selected?.id, "untouched");
  });
});
