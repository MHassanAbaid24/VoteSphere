import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding content pages...');

  const pages = [
    {
      slug: 'about-us',
      title: 'About Us',
      body: 'Welcome to VoteSphere, the premier platform for community polling and voting. We connect users around meaningful decisions.',
    },
    {
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      body: 'Your privacy is critical to us. VoteSphere does not sell your data, and handles all voter information securely.',
    },
    {
      slug: 'terms-of-service',
      title: 'Terms of Service',
      body: 'By using VoteSphere, you agree to post content that is respectful and does not infringe on anyone else rights.',
    },
  ];

  for (const page of pages) {
    await prisma.contentPage.upsert({
      where: { slug: page.slug },
      update: {
        title: page.title,
        body: page.body,
      },
      create: {
        slug: page.slug,
        title: page.title,
        body: page.body,
      },
    });
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
