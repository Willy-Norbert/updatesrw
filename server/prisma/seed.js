require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'AI', slug: 'ai', description: 'Artificial intelligence research, products, and practice.' },
  { name: 'Programming', slug: 'programming', description: 'Language tips, patterns, and engineering craft.' },
  { name: 'Web Development', slug: 'web-development', description: 'Frontend, backend, and the web platform.' },
  { name: 'Mobile Development', slug: 'mobile-development', description: 'iOS, Android, and cross-platform apps.' },
  { name: 'UI/UX', slug: 'ui-ux', description: 'Interface design, usability, and product thinking.' },
  { name: 'Design', slug: 'design', description: 'Visual systems, branding, and design tools.' },
  { name: 'Tools', slug: 'tools', description: 'Editors, CLIs, and software that speeds up work.' },
  { name: 'Productivity', slug: 'productivity', description: 'Workflows, systems, and how builders stay effective.' },
  { name: 'Career', slug: 'career', description: 'Jobs, interviews, and professional growth.' },
  { name: 'Startups', slug: 'startups', description: 'Building companies and shipping products.' },
  { name: 'Cybersecurity', slug: 'cybersecurity', description: 'Security practice for builders and teams.' },
  { name: 'Databases', slug: 'databases', description: 'SQL, Postgres, Prisma, and data modeling.' },
];

const HASHTAGS = [
  'ai',
  'cursor',
  'chatgpt',
  'claude',
  'gemini',
  'react',
  'nodejs',
  'prisma',
  'postgresql',
  'uiux',
  'webdev',
  'javascript',
];

const DEMO_USERS = [
  {
    username: 'willy',
    fullName: 'Willy Nkusi',
    email: 'willy@updaterw.local',
    bio: 'Writes about AI tooling, Cursor, and shipping faster.',
  },
  {
    username: 'john',
    fullName: 'John Mugisha',
    email: 'john@updaterw.local',
    bio: 'Web developer focused on React, Node, and clean UI.',
  },
  {
    username: 'developer123',
    fullName: 'Alex Developer',
    email: 'alex@updaterw.local',
    bio: 'Backend engineer. Postgres, Prisma, and practical APIs.',
  },
  {
    username: 'amina',
    fullName: 'Amina Uwase',
    email: 'amina@updaterw.local',
    bio: 'Product designer sharing UI/UX notes and design systems.',
  },
  {
    username: 'marco',
    fullName: 'Marco Habimana',
    email: 'marco@updaterw.local',
    bio: 'Startup stories, career milestones, and useful tools.',
  },
];

async function upsertUser({ username, fullName, email, password, role, bio }) {
  const hashed = await bcrypt.hash(password, 12);
  return prisma.user.upsert({
    where: { email },
    update: {
      username,
      fullName,
      role,
      bio,
      isActive: true,
      emailVerified: true,
      onboardingCompleted: true,
    },
    create: {
      username,
      fullName,
      email,
      password: hashed,
      role,
      bio,
      emailVerified: true,
      onboardingCompleted: true,
    },
  });
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env before seeding.');
  }

  await upsertUser({
    username: (process.env.ADMIN_USERNAME || 'admin').toLowerCase(),
    fullName: process.env.ADMIN_NAME || 'Updaterw Admin',
    email: adminEmail.toLowerCase(),
    password: adminPassword,
    role: 'ADMIN',
    bio: 'Platform administrator.',
  });

  await upsertUser({
    username: (process.env.CHIEF_EDITOR_USERNAME || 'editor').toLowerCase(),
    fullName: process.env.CHIEF_EDITOR_NAME || 'Chief Editor',
    email: (process.env.CHIEF_EDITOR_EMAIL || 'editor@updaterw.local').toLowerCase(),
    password: process.env.CHIEF_EDITOR_PASSWORD || 'Editor123!@#',
    role: 'CHIEF_EDITOR',
    bio: 'Chief editor for Updaterw.',
  });

  const demoPassword = 'User123!@#';
  for (const user of DEMO_USERS) {
    await upsertUser({
      ...user,
      username: user.username.toLowerCase(),
      email: user.email.toLowerCase(),
      password: demoPassword,
      role: 'USER',
    });
  }

  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description },
      create: category,
    });
  }

  for (const name of HASHTAGS) {
    await prisma.hashtag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('Seed complete.');
  console.log(`Admin: ${adminEmail}`);
  console.log(`Chief Editor: ${process.env.CHIEF_EDITOR_EMAIL || 'editor@updaterw.local'}`);
  console.log('Demo users: willy, john, developer123, amina, marco / User123!@#');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
