import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const chapters = [
  { number: 1, part: "Foundations", title: "Why I Am Writing This", description: "Your motivation for this project, and what you hope future readers take from it." },
  { number: 2, part: "Foundations", title: "The Perry Family", description: "Family origins, the Somerset House research, the family bible and tree, traditions." },
  { number: 3, part: "Foundations", title: "My Parents", description: "Who they were, what they taught you, memories from childhood." },
  { number: 4, part: "Foundations", title: "Childhood", description: "Where you grew up, early memories, early influences." },
  { number: 5, part: "Growing Up", title: "Teenage Years and Education", description: "School, university, friendships, ambitions, the culture of the time." },
  { number: 6, part: "Growing Up", title: "Early Career", description: "First jobs, early lessons, the start of your professional life." },
  { number: 7, part: "Growing Up", title: "Discovering the World", description: "Early independence, broader experience beyond home." },
  { number: 8, part: "Major Life Chapters", title: "The Canada Years", description: "Moving to Canada, working and living there, what you learned." },
  { number: 9, part: "Major Life Chapters", title: "Marriage and Family", description: "Meeting your wife, building a family, balancing work and home." },
  { number: 10, part: "Major Life Chapters", title: "Career Years", description: "Key roles, challenges, successes, industries, leadership and culture." },
  { number: 11, part: "Major Life Chapters", title: "Moving to Australia", description: "Why you moved, the transition, what surprised you." },
  { number: 12, part: "Reflection", title: "The World Changing", description: "Technology, globalisation, communication — how life changed around you." },
  { number: 13, part: "Reflection", title: "Challenges and Turning Points", description: "Setbacks, risks, difficult decisions, and what they taught you." },
  { number: 14, part: "Reflection", title: "Lessons Learned", description: "What truly matters, mistakes to avoid, what success really means." },
  { number: 15, part: "Reflection", title: "The Values That Guided My Life", description: "The principles behind every decision — the foundation of the whole story." },
  { number: 16, part: "Looking Forward", title: "Advice for My Children and Grandchildren", description: "A direct message to the future." },
  { number: 17, part: "Looking Forward", title: "Reflections on a Life", description: "Gratitude, the people who mattered most, your hoped-for legacy." },
];

const questionsByChapter: Record<number, string[]> = {
  2: [
    "What do you know about the earliest Perry ancestors?",
    "What traditions or routines did your family have?",
    "Were there any family sayings or beliefs that stayed with you?",
  ],
  3: [
    "What stories did your parents tell you about their own childhood?",
    "What were your parents like as people?",
    "What values did they try to teach you?",
  ],
  4: [
    "What is your earliest childhood memory?",
    "What was your home like growing up?",
    "What kind of child were you?",
    "What did you enjoy most at school?",
    "Who were your closest friends growing up?",
  ],
  5: [
    "Were there teachers who influenced you strongly?",
    "What did you think your future might look like at that time?",
    "What made you choose your university course?",
    "Looking back, was that decision planned or accidental?",
    "What was university life like socially and intellectually?",
    "What were the big cultural influences at the time (music, politics, ideas)?",
  ],
  6: [
    "How did you get your first real job?",
    "What did you learn from those early jobs?",
    "When did you first realise the importance of professional relationships?",
    "Which people had the biggest influence on your career?",
    "When did you realise that connections open doors?",
    "Can you remember a job opportunity that came entirely through someone you knew?",
  ],
  8: [
    "What led you to work in Canada?",
    "What surprised you most about living there?",
  ],
  9: ["How did you meet your wife?"],
  10: [
    "What industries did you work in over your career?",
    "Which companies no longer exist today?",
    "How did technology change those industries?",
    "What makes a strong organisational culture?",
    "What mistakes do companies often make about culture?",
    "What leadership challenges did you face during the pandemic?",
  ],
  11: ["What eventually led you to Australia?"],
  13: [
    "Looking back, what were the biggest turning points in your life?",
    "Were there moments where a small decision changed everything?",
    "Do you believe chance plays a role in life success?",
  ],
  14: [
    "What personal strengths helped you succeed?",
    "What weaknesses caused difficulties?",
    "What advice would you give someone starting their career today?",
  ],
  16: ["What values do you most hope your grandchildren inherit?"],
};

async function main() {
  for (const chapter of chapters) {
    await prisma.chapter.upsert({
      where: { number: chapter.number },
      update: chapter,
      create: chapter,
    });
  }

  for (const [chapterNumber, questions] of Object.entries(questionsByChapter)) {
    const chapter = await prisma.chapter.findUnique({
      where: { number: Number(chapterNumber) },
    });
    if (!chapter) continue;

    for (const text of questions) {
      const existing = await prisma.question.findFirst({
        where: { text, chapterId: chapter.id },
      });
      if (!existing) {
        await prisma.question.create({ data: { text, chapterId: chapter.id } });
      }
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
