# Matte 3 · TMA4422

Produksjonsklar Next.js-app for en norsk læringsplattform i TMA4422 Matematikk 3C ved NTNU. Appen organiserer gamle eksamensoppgaver etter tema og læringsmål, lagrer brukerprogresjon i PostgreSQL og tilbyr temabasert øving, adaptiv øving og eksamensmodus.

## Stack

- Next.js App Router, React 19 og TypeScript
- Tailwind CSS med shadcn-inspirerte lokale komponenter
- PostgreSQL og Prisma ORM
- Enkel databasebasert auth med httpOnly session-cookie
- Server actions og én API route for automatisk fullføring av tidsstyrt eksamen
- KaTeX for matematikkvisning
- Framer Motion for subtile sideanimasjoner
- Zod for auth- og importvalidering

## Kom i gang

```bash
npm install
cp .env.example .env
```

Start PostgreSQL lokalt og sørg for at `DATABASE_URL` i `.env` peker på databasen. Eksempelverdien er:

```env
DATABASE_URL="postgresql://matte3:matte3@localhost:5432/matte3?schema=public"
```

Kjør migrering og seed:

```bash
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

Åpne `http://localhost:3000`.

Demo-brukere etter seed:

- Student: `student@matte3.local` / `student-demo`
- Admin: `admin@matte3.local` / `matte3-demo`

## Viktige routes

- `/dashboard`
- `/tema`
- `/tema/[topicSlug]`
- `/oppgaver/[problemId]`
- `/adaptiv`
- `/eksamen`
- `/eksamen/[sessionId]`
- `/eksamen/[sessionId]/resultat`
- `/profil`
- `/login`
- `/register`
- `/admin/import`

## Arkitektur

- `prisma/schema.prisma` definerer `ExamSource`, `Problem`, `Topic`, `Subtopic`, `UserProblemProgress`, `PracticeSession` og `PracticeSessionProblem`, pluss `User` og `AuthSession`.
- `data/exam-problems/*.json` er importformatet for oppgaver. Samme format brukes av seed og admin-import.
- `lib/problem-import.ts` validerer JSON med Zod og upserter kilder og oppgaver.
- `lib/progress.ts` beregner total progresjon og progresjon per tema.
- `lib/adaptive.ts` inneholder adaptiv anbefalingslogikk.
- `actions/*` inneholder server actions for auth, progresjon, eksamen og admin-import.

## Adaptiv algoritme

For hver ikke-løste oppgave beregnes:

```ts
adaptivePriorityScore =
  notSolvedRateWeight +
  lowCoverageWeight +
  recencyWeight +
  subtopicWeaknessWeight +
  ownStatusBoost
```

Vektene betyr:

- `notSolvedRateWeight`: temaer med høy andel `NOT_SOLVED` vektes opp.
- `lowCoverageWeight`: temaer med få forsøk vektes opp.
- `recencyWeight`: temaer brukeren ikke har jobbet med på en stund vektes opp.
- `subtopicWeaknessWeight`: undertemaer med nylige feil vektes opp.
- `ownStatusBoost`: konkrete oppgaver brukeren tidligere ikke klarte får ekstra prioritet.

UI viser en menneskelig forklaring, for eksempel at et tema har flere uløste oppgaver eller er lite øvd på. `hiddenDifficultyScore` finnes i datamodellen, men brukes ikke i UI.

## Kilder og seed/mock-status

Ekte kilder brukt i datastrukturen:

- TMA4422 fremdriftsplan våren 2026: https://wiki.math.ntnu.no/tma4422/2026v/fremdriftsplan
- TMA4110 gamle eksamensoppgaver: https://wiki.math.ntnu.no/tma4110/2025h/eksamensoppgaver
- TMA4130 old exams: https://wiki.math.ntnu.no/tma4130/2025h/old_exams
- TMA4100 eksamensoppgaver: https://wiki.math.ntnu.no/tma4100/2024h/eksamensoppgaver

Hva som er ekte:

- Tema- og undertemastruktur er basert på TMA4422-fremdriftsplanen.
- `ExamSource`-seed bruker ekte NTNU-emnekoder, semestre og PDF-lenker.

Hva som er seed/mock:

- Problemene i `data/exam-problems/*.json` er merket `isSeedMock: true`.
- Oppgavetekstene er korte demo/parafraser for å vise appflyt og metadata, ikke en komplett kvalitetssikret import av alle gamle eksamensoppgaver.
- Admin-importen er ment som veien videre for å legge inn fullstendige, verifiserte oppgaver med PDF-sidehenvisning og løsningsforslag.

## Kvalitetssjekker

```bash
npx prisma validate
npm run typecheck
npm run lint
npm run build
```

Merk: Docker var ikke tilgjengelig i utviklingsmiljøet som ble brukt her, så migrering/seed mot en faktisk lokal Postgres må kjøres på en maskin med PostgreSQL tilgjengelig.

## Last ned gamle eksamener

Scriptet under henter de 10 nyeste eksamens-PDF-ene fra TMA4100, TMA4110 og TMA4130-kildesidene, og legger dem i hver sin mappe under `data/old-exams/`.

```bash
npm run exams:download
```

Resultat:

- `data/old-exams/TMA4100`
- `data/old-exams/TMA4110`
- `data/old-exams/TMA4130`

Hver mappe får også en `manifest.json` med opprinnelig URL, label og lokal filsti.

For å hente neste bolk med 10 ekstra eksamener per fag uten å slette de eksisterende PDF-ene:

```bash
npm run exams:download:more
```

Dette bruker `--offset 10 --limit 10 --append`, slik at mappene ender med 20 PDF-er per fag når de første 10 allerede finnes. Du kan også styre nedlastingen mer presist:

```bash
npm run exams:download -- --course TMA4110 --offset 20 --limit 10 --append
npm run exams:download -- --course TMA4130 --limit 20
npm run exams:download -- --dry-run
```

## Importer JSON-oppgaver fra script

Når nye oppgave-JSON-er er laget i `data/exam-problems/`, kan de importeres uten å bruke admin-siden:

```bash
npm run problems:import
```

Standardimporten:

- leser alle `*-relevant.json` i `data/exam-problems/`
- upserter tema og undertema først
- hopper over JSON-er som inneholder `isSeedMock: true`
- upserter `ExamSource` og `Problem`, slik at samme JSON kan kjøres flere ganger

Importer én bestemt fil:

```bash
npm run problems:import -- --file data/exam-problems/tma4110-2025-v-relevant.json
```

Importer til Railway/Postgres ved å bruke public database URL:

```bash
DATABASE_URL="postgresql://..." npm run problems:import
```

Ikke bruk `postgres.railway.internal` fra lokal maskin. Den fungerer bare inne i Railway sitt private nettverk.
