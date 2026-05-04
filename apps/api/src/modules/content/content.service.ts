import { prisma } from '../../config/database';

export const getContentPageBySlug = async (slug: string) => {
  const page = await prisma.contentPage.findUnique({
    where: { slug },
  });
  return page;
};
