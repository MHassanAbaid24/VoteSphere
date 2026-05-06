import { prisma } from '../../config/database';

export const getDemographics = async (pollId: string) => {
  // Fetch votes with voter demographics
  const votes = (await prisma.vote.findMany({
    where: { pollId },
    include: {
      user: {
        include: {
          demographicInfo: true,
        },
      },
    },
  })) as any[];

  // Unique users who voted in this poll
  const uniqueUserIds = new Set(votes.map((v) => v.userId));
  if (uniqueUserIds.size < 5) {
    return { insufficientData: true };
  }

  // Aggregation containers
  const ageGroups: Record<string, number> = {};
  const genders: Record<string, number> = {};
  const countries: Record<string, number> = {};

  let ageTotal = 0;
  let genderTotal = 0;
  let countryTotal = 0;

  // Track unique user records to prevent multiple questions in same poll from counting multiple times
  const countedUsers = new Set<string>();

  for (const vote of votes) {
    if (countedUsers.has(vote.userId)) continue;
    countedUsers.add(vote.userId);

    const demo = vote.user?.demographicInfo;
    if (demo) {
      if (demo.ageRange) {
        ageGroups[demo.ageRange] = (ageGroups[demo.ageRange] || 0) + 1;
        ageTotal++;
      }
      if (demo.gender) {
        genders[demo.gender] = (genders[demo.gender] || 0) + 1;
        genderTotal++;
      }
      if (demo.country) {
        countries[demo.country] = (countries[demo.country] || 0) + 1;
        countryTotal++;
      }
    }
  }

  // Format with percentages
  const formatDemographics = (group: Record<string, number>, total: number) => {
    return Object.entries(group).map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  };

  return {
    insufficientData: false,
    ageRange: formatDemographics(ageGroups, ageTotal),
    gender: formatDemographics(genders, genderTotal),
    country: formatDemographics(countries, countryTotal),
  };
};
