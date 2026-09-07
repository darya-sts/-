import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_EXPERTS = [
  'Andrej Karpathy',
  'Ilya Sutskever',
  'Yann LeCun',
  'Geoffrey Hinton',
  'Demis Hassabis',
  'Sam Altman',
  'Dario Amodei',
  'Jim Fan',
  'Andrew Ng',
  'Fei-Fei Li',
  'Sebastian Ruder',
  'Lilian Weng',
  'Simon Willison',
  'Jeremy Howard',
  'Radek Osmulski',
  'Eugene Yan',
  'Chip Huyen',
  'Denny Britz',
  'Francois Chollet',
  'Noam Shazeer',
  'Alec Radford',
  'Oriol Vinyals',
  'Jeff Dean',
  'Elon Musk',
  'Mark Zuckerberg',
  'Satya Nadella',
  'Jensen Huang',
  'Harrison Chase',
  'Logan Kilpatrick',
  'Jim Fan',
  'Swyx',
  'Latent Space',
  'Nathan Lambert',
  'Sara Hooker',
  'Tim Dettmers',
  'Tri Dao',
  'Percy Liang',
  'Christopher Manning',
  'Yoav Shoham',
  'Pieter Abbeel',
  'Chelsea Finn',
  'Sergey Levine',
  'Raia Hadsell',
  'David Silver',
  'Shane Legg',
  'Mustafa Suleyman',
  'Emad Mostaque',
  'Clem Delangue',
  'Thomas Wolf',
  'Sasha Rush',
  'Jay Alammar',
  'Allie K. Miller',
];

const DEFAULT_SOURCES = [
  {
    username: 'openai',
    title: 'OpenAI',
    category: 'Инструменты ИИ',
    weight: 5,
  },
  {
    username: 'ai_tools_daily',
    title: 'AI Tools Daily',
    category: 'Скилы и правила для Агентов',
    weight: 4,
  },
  {
    username: 'chatgpt',
    title: 'ChatGPT News',
    category: 'Инструменты ИИ',
    weight: 3,
  },
  {
    username: 'anthropic',
    title: 'Anthropic',
    category: 'Инструменты ИИ',
    weight: 5,
  },
  {
    username: 'midjourney',
    title: 'Midjourney',
    category: 'Инструменты ИИ',
    weight: 3,
  },
  {
    username: 'ai_business',
    title: 'AI Business',
    category: 'Монетизация с помощью ИИ',
    weight: 4,
  },
  {
    username: 'ai_news',
    title: 'AI News',
    category: 'Прочее',
    weight: 3,
  },
];

async function main() {
  const userId = process.env.DEFAULT_USER_ID || 'default-user';

  await prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      keywords: JSON.stringify([
        'агент',
        'фреймворк',
        'автономный',
        'LLM',
        'GPT',
        'инструмент',
        'монетизация',
        'prompt',
        'RAG',
        'multi-agent',
      ]),
      categories: JSON.stringify({
        'Инструменты ИИ': 1,
        'Скилы и правила для Агентов': 1,
        'Монетизация с помощью ИИ': 1,
        Прочее: 0.7,
      }),
      telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
      scheduleCron: '0 6,18 * * *',
      timezone: 'Asia/Novosibirsk',
    },
  });

  for (const expert of DEFAULT_EXPERTS) {
    await prisma.expert.upsert({
      where: { name: expert },
      update: { isActive: true },
      create: { name: expert, source: 'Telegram', isActive: true },
    });
  }

  for (const source of DEFAULT_SOURCES) {
    await prisma.telegramSource.upsert({
      where: { username: source.username },
      update: {
        title: source.title,
        category: source.category,
        weight: source.weight,
        isActive: true,
      },
      create: source,
    });
  }

  console.log('Seed завершён: настройки, эксперты и каналы загружены.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });