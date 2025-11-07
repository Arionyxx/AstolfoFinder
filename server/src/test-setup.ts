import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup test database
  await prisma.$connect();
});

afterAll(async () => {
  // Cleanup test database
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up test data before each test
  await prisma.profileHobby.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.swipe.deleteMany();
  await prisma.match.deleteMany();
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'test',
      },
    },
  });
  await prisma.hobby.deleteMany({
    where: {
      name: {
        contains: 'Test',
      },
    },
  });
});