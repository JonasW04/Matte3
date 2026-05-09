import { PrismaClient } from "@prisma/client";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { ensureCourseStructure } from "../lib/course-seed";
import { importExamProblems } from "../lib/problem-import";

type ImportOptions = {
  files: string[];
  dir: string;
  includeMock: boolean;
  ensureTopics: boolean;
};

const prisma = new PrismaClient();

async function main() {
  const options = await parseArgs(process.argv.slice(2));

  if (options.ensureTopics) {
    await ensureCourseStructure(prisma);
    console.log("Temaer og undertemaer er upsertet.");
  }

  if (options.files.length === 0) {
    console.log("Fant ingen JSON-filer å importere.");
    return;
  }

  let total = 0;
  for (const file of options.files) {
    const payload = JSON.parse(await readFile(file, "utf8"));

    if (!options.includeMock && hasMockProblems(payload)) {
      console.log(`Hopper over ${path.relative(process.cwd(), file)} fordi den inneholder isSeedMock=true. Bruk --include-mock hvis du virkelig vil importere den.`);
      continue;
    }

    const result = await importExamProblems(prisma, payload);
    total += result.imported;
    console.log(`Importerte/oppdaterte ${result.imported} oppgaver fra ${path.relative(process.cwd(), file)}.`);
  }

  console.log(`Ferdig. Totalt importert/oppdatert: ${total} oppgaver fra ${options.files.length} filer.`);
}

async function parseArgs(args: string[]): Promise<ImportOptions> {
  let dir = "data/exam-problems";
  const explicitFiles: string[] = [];
  let includeMock = false;
  let ensureTopics = true;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--dir" && next) {
      dir = next;
      index += 1;
      continue;
    }
    if (arg === "--file" && next) {
      explicitFiles.push(next);
      index += 1;
      continue;
    }
    if (arg === "--include-mock") {
      includeMock = true;
      continue;
    }
    if (arg === "--no-ensure-topics") {
      ensureTopics = false;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    throw new Error(`Ukjent argument: ${arg}`);
  }

  const files = explicitFiles.length > 0 ? explicitFiles : await findRelevantJsonFiles(dir);
  return {
    files: files.map((file) => path.resolve(file)).sort(),
    dir,
    includeMock,
    ensureTopics
  };
}

async function findRelevantJsonFiles(dir: string) {
  const root = path.resolve(dir);
  const entries = await readdir(root);
  const files: string[] = [];

  for (const entry of entries) {
    const filePath = path.join(root, entry);
    const fileStat = await stat(filePath);
    if (fileStat.isFile() && entry.endsWith("-relevant.json")) {
      files.push(filePath);
    }
  }

  return files;
}

function hasMockProblems(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("problems" in payload)) return false;
  const problems = (payload as { problems?: unknown }).problems;
  return Array.isArray(problems) && problems.some((problem) => Boolean((problem as { isSeedMock?: unknown }).isSeedMock));
}

function printHelp() {
  console.log(`Importer eksamensoppgaver fra JSON til databasen.

Bruk:
  npm run problems:import
  npm run problems:import -- --file data/exam-problems/tma4110-2025-v-relevant.json
  DATABASE_URL="postgresql://..." npm run problems:import

Valg:
  --dir <path>             Mappe å lese *-relevant.json fra. Standard: data/exam-problems
  --file <path>            Importer én fil. Kan brukes flere ganger.
  --include-mock           Tillat import av JSON som inneholder isSeedMock=true.
  --no-ensure-topics       Ikke upsert tema/undertema før import.
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
