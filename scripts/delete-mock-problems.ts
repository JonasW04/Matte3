import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.problem.count({
    where: { isSeedMock: true }
  });

  const result = await prisma.problem.deleteMany({
    where: { isSeedMock: true }
  });

  const after = await prisma.problem.count({
    where: { isSeedMock: true }
  });

  console.log(`Mock problems before: ${before}`);
  console.log(`Deleted mock problems: ${result.count}`);
  console.log(`Mock problems after: ${after}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
