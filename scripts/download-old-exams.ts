import { createHash } from "node:crypto";
import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

type CourseConfig = {
  courseCode: "TMA4100" | "TMA4110" | "TMA4130";
  sourcePage: string;
  rowParser: (html: string) => ExamCandidate[];
};

type ExamCandidate = {
  label: string;
  url: string;
  year: number;
  term: string;
};

type DownloadedExam = ExamCandidate & {
  fileName: string;
  relativePath: string;
  sourcePage: string;
};

const ROOT = process.cwd();
const OUTPUT_ROOT = path.join(ROOT, "data", "old-exams");
const WIKI_ORIGIN = "https://wiki.math.ntnu.no";
const MAX_EXAMS_PER_COURSE = 10;

const COURSES: CourseConfig[] = [
  {
    courseCode: "TMA4110",
    sourcePage: "https://wiki.math.ntnu.no/tma4110/2025h/eksamensoppgaver",
    rowParser: parseNorwegianMultiLanguageRows
  },
  {
    courseCode: "TMA4130",
    sourcePage: "https://wiki.math.ntnu.no/tma4130/2025h/old_exams",
    rowParser: parseTma4130Rows
  },
  {
    courseCode: "TMA4100",
    sourcePage: "https://wiki.math.ntnu.no/tma4100/2024h/eksamensoppgaver",
    rowParser: parseNorwegianProblemRows
  }
];

async function main() {
  await mkdir(OUTPUT_ROOT, { recursive: true });

  for (const course of COURSES) {
    const html = await fetchText(course.sourcePage);
    const candidates = uniqueByUrl(course.rowParser(html))
      .sort(compareNewestFirst)
      .slice(0, MAX_EXAMS_PER_COURSE);

    const courseDir = path.join(OUTPUT_ROOT, course.courseCode);
    await prepareCourseDir(courseDir);

    const manifest: DownloadedExam[] = [];
    for (const [index, candidate] of candidates.entries()) {
      const fileName = `${String(index + 1).padStart(2, "0")}-${slugify(candidate.label)}.pdf`;
      const filePath = path.join(courseDir, fileName);
      await downloadPdf(candidate.url, filePath);
      manifest.push({
        ...candidate,
        fileName,
        relativePath: path.relative(ROOT, filePath),
        sourcePage: course.sourcePage
      });
      console.log(`${course.courseCode}: lastet ned ${fileName}`);
    }

    await writeFile(path.join(courseDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  }
}

function parseNorwegianMultiLanguageRows(html: string): ExamCandidate[] {
  const rows = getTableRows(html);
  const candidates: ExamCandidate[] = [];
  let currentYear: number | null = null;

  for (const row of rows) {
    const year = firstYear(row);
    if (year) currentYear = year;
    if (!currentYear) continue;

    const cells = getCells(row);
    const term = termFromCells(cells);
    if (!isExamTerm(term)) continue;

    const links = getLinks(row);
    const bokmal = links.find((link) => /^(bm|bokm[aå]l)$/i.test(link.text.trim()) && !isSolutionUrl(link.url));
    const firstExam = links.find((link) => isLikelyExamPdf(link.url, link.text) && !isSolutionUrl(link.url));
    const selected = bokmal ?? firstExam;
    if (!selected) continue;

    candidates.push({
      label: `${currentYear}-${term}-${selected.text}`,
      url: selected.url,
      year: currentYear,
      term
    });
  }

  return candidates;
}

function parseNorwegianProblemRows(html: string): ExamCandidate[] {
  const rows = getTableRows(html);
  const candidates: ExamCandidate[] = [];
  let currentYear: number | null = null;

  for (const row of rows) {
    const year = firstYear(row);
    if (year) currentYear = year;
    if (!currentYear) continue;

    const cells = getCells(row);
    const term = termFromCells(cells);
    if (!isExamTerm(term)) continue;

    const links = getLinks(row);
    const problemLink = links.find((link) => /oppgaver/i.test(link.text) && !isSolutionUrl(link.url));
    if (!problemLink) continue;

    candidates.push({
      label: `${currentYear}-${term}-oppgaver`,
      url: problemLink.url,
      year: currentYear,
      term
    });
  }

  return candidates;
}

function parseTma4130Rows(html: string): ExamCandidate[] {
  const rows = getTableRows(html);
  const candidates: ExamCandidate[] = [];

  for (const row of rows) {
    const cells = getCells(row);
    if (cells.length < 2) continue;

    const examLabel = stripTags(cells[0]);
    const year = firstYear(examLabel);
    if (!year) continue;

    const links = getLinks(cells[1]);
    const problemLink = links.find((link) => isLikelyExamPdf(link.url, link.text, { allowSolutionText: true }));
    if (!problemLink) continue;

    candidates.push({
      label: normalizeWhitespace(examLabel),
      url: problemLink.url,
      year,
      term: normalizeTerm(examLabel)
    });
  }

  return candidates;
}

function getTableRows(html: string) {
  return [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((match) => match[1] ?? "");
}

function getCells(rowHtml: string) {
  return [...rowHtml.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((match) => match[1] ?? "");
}

function getLinks(html: string) {
  return [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({
      url: resolveUrl(decodeHtml(match[1] ?? "")),
      text: normalizeWhitespace(stripTags(match[2] ?? ""))
    }))
    .filter((link) => /\.pdf(?:$|[?#])/i.test(link.url));
}

function firstYear(value: string) {
  const match = value.match(/\b(20\d{2}|19\d{2})\b/);
  return match ? Number(match[1]) : null;
}

function normalizeTerm(value: string) {
  const lower = decodeHtml(stripTags(value)).toLowerCase();
  if (/\b(høst|host|autumn|h[0-9]{2})\b/.test(lower)) return "host";
  if (/\b(vår|var|spring|v[0-9]{2})\b/.test(lower)) return "var";
  if (/\b(kont|summer|sommer|retake|2nd|k[0-9]{2})\b/.test(lower)) return "kont";
  return "eksamen";
}

function isExamTerm(term: string) {
  return term === "host" || term === "var" || term === "kont";
}

function isLikelyExamPdf(url: string, text: string, options: { allowSolutionText?: boolean } = {}) {
  if (!/\.pdf(?:$|[?#])/i.test(url)) return false;
  if (isSolutionUrl(url)) return false;
  const combined = `${url} ${text}`.toLowerCase();
  const disallowed = options.allowSolutionText
    ? /formel|timeplan|tableau|correct|samlefil|lf_|_lf|fasit/
    : /formel|timeplan|tableau|correct|samlefil|solution|l[oø]sning|lf_|_lf|fasit/;
  if (disallowed.test(combined)) return false;
  return true;
}

function isSolutionUrl(url: string) {
  const lower = url.toLowerCase();
  return /(?:^|[/_-])(lf|los|loes|løsn|solution|solutions|fasit)(?:[/_.-]|$)/i.test(lower);
}

function resolveUrl(rawUrl: string) {
  const url = rawUrl.replaceAll("&amp;", "&");
  const absolute = new URL(url, WIKI_ORIGIN);
  const media = absolute.searchParams.get("media");
  if (absolute.pathname.endsWith("/lib/exe/fetch.php") && media) {
    return media;
  }
  return absolute.toString();
}

function stripTags(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, " "));
}

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#039;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ");
}

function normalizeWhitespace(value: string) {
  return decodeHtml(value).replace(/\s+/g, " ").trim();
}

function compareNewestFirst(a: ExamCandidate, b: ExamCandidate) {
  const yearDiff = b.year - a.year;
  if (yearDiff !== 0) return yearDiff;
  return termRank(b.term) - termRank(a.term);
}

function termRank(term: string) {
  if (term === "host") return 3;
  if (term === "kont") return 2;
  if (term === "var") return 1;
  return 0;
}

function uniqueByUrl(candidates: ExamCandidate[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = candidate.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "matte3-tma4422-exam-downloader/1.0"
    }
  });
  if (!response.ok) {
    throw new Error(`Kunne ikke hente ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function prepareCourseDir(courseDir: string) {
  await mkdir(courseDir, { recursive: true });
  const entries = await readdir(courseDir, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && (entry.name.endsWith(".pdf") || entry.name === "manifest.json"))
      .map((entry) => unlink(path.join(courseDir, entry.name)))
  );
}

async function downloadPdf(url: string, filePath: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "matte3-tma4422-exam-downloader/1.0"
    }
  });
  if (!response.ok) {
    throw new Error(`Kunne ikke laste ned ${url}: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("pdf")) {
    console.warn(`Advarsel: ${url} svarte med content-type "${contentType}"`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.subarray(0, 4).equals(Buffer.from("%PDF"))) {
    const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 8);
    console.warn(`Advarsel: ${url} ser ikke ut som PDF ved magic bytes (${digest})`);
  }
  await writeFile(filePath, bytes);
}

function termFromCells(cells: string[]) {
  const first = stripTags(cells[0] ?? "");
  const firstCellIsYear = /^\s*(20\d{2}|19\d{2})\s*$/.test(first);
  return normalizeTerm(stripTags(firstCellIsYear ? cells[1] ?? "" : cells[0] ?? ""));
}

function slugify(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replaceAll("æ", "ae")
    .replaceAll("ø", "o")
    .replaceAll("å", "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
