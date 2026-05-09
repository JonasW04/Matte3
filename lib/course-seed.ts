import { Prisma, PrismaClient } from "@prisma/client";
import { TOPIC_STRUCTURE, slugifyNorwegian } from "./course-structure";

type Db = PrismaClient | Prisma.TransactionClient;

export async function ensureCourseStructure(db: Db) {
  for (const topicSeed of TOPIC_STRUCTURE) {
    const topic = await db.topic.upsert({
      where: { slug: topicSeed.slug },
      update: {
        name: topicSeed.name,
        week: topicSeed.week,
        order: topicSeed.order,
        color: topicSeed.color,
        description: topicSeed.description
      },
      create: {
        slug: topicSeed.slug,
        name: topicSeed.name,
        week: topicSeed.week,
        order: topicSeed.order,
        color: topicSeed.color,
        description: topicSeed.description
      }
    });

    for (const [index, subtopicName] of topicSeed.subtopics.entries()) {
      await db.subtopic.upsert({
        where: {
          topicId_slug: {
            topicId: topic.id,
            slug: slugifyNorwegian(subtopicName)
          }
        },
        update: {
          name: subtopicName,
          order: index + 1
        },
        create: {
          topicId: topic.id,
          slug: slugifyNorwegian(subtopicName),
          name: subtopicName,
          order: index + 1
        }
      });
    }
  }
}
