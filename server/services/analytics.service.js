const prisma = require('../config/db');

const makeHttpError = (message, status) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const parsePositiveInt = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const sumBy = (items, getter) => items.reduce((acc, item) => acc + getter(item), 0);
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const round = (value, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round((Number(value) || 0) * factor) / factor;
};

const TOP_DEVELOPER_SORTS = new Set(['overall', 'downloads', 'rating', 'reviews', 'favorites', 'apps', 'versions']);
const TOP_DEVELOPER_WINDOWS = new Set([7, 30, 90, 365]);

const aggregateDateCounts = (items, dateField, windowStart) => {
  const counts = new Map();
  for (const item of items) {
    const raw = item[dateField];
    if (!raw) continue;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime()) || date < windowStart) continue;
    const key = date.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));
};

const getDeveloperProfileId = async (userId) => {
  const profile = await prisma.developerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  return profile ? profile.id : null;
};

const parseLeaderboardLimit = (value) => clamp(parsePositiveInt(value) || 5, 1, 20);

const parseLeaderboardSort = (value) => {
  const normalized = typeof value === 'string' ? value.toLowerCase() : 'overall';
  return TOP_DEVELOPER_SORTS.has(normalized) ? normalized : 'overall';
};

const parseLeaderboardWindow = (value) => {
  const normalized = typeof value === 'string' ? value.toLowerCase() : '30';
  if (normalized === 'all') {
    return {
      key: 'all',
      days: null,
      label: 'All time',
      windowStart: null,
    };
  }

  const days = parsePositiveInt(normalized);
  const safeDays = TOP_DEVELOPER_WINDOWS.has(days) ? days : 30;
  return {
    key: String(safeDays),
    days: safeDays,
    label: `Last ${safeDays} days`,
    windowStart: new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000),
  };
};

const createScoreBreakdown = ({
  averageRating,
  totalDownloads,
  totalFavorites,
  totalReviews,
  publishedApps,
  totalVersions,
}) => {
  const rating = round((clamp(averageRating, 0, 5) / 5) * 40);
  const downloads = round(clamp(Math.log10(totalDownloads + 1) / 4, 0, 1) * 22);
  const favorites = round(clamp(Math.log10(totalFavorites + 1) / 3, 0, 1) * 10);
  const reviews = round(clamp(Math.log10(totalReviews + 1) / 3, 0, 1) * 13);
  const apps = round(clamp(publishedApps / 8, 0, 1) * 10);
  const versions = round(clamp(totalVersions / 16, 0, 1) * 5);

  return {
    rating,
    downloads,
    favorites,
    reviews,
    apps,
    versions,
  };
};

const computeTopAppImpact = (app) =>
  (app.totalDownloads || 0) * 1
  + (app.totalFavorites || 0) * 2
  + (app.totalReviews || 0) * 4
  + (app.averageRating || 0) * 20
  + (app.totalVersions || 0) * 2;

const sortLeaderboardEntries = (entries, sort) => {
  const sorters = {
    overall: (a, b) => b.score - a.score || b.totalDownloads - a.totalDownloads || b.averageRating - a.averageRating,
    downloads: (a, b) => b.totalDownloads - a.totalDownloads || b.score - a.score,
    rating: (a, b) => b.averageRating - a.averageRating || b.totalReviews - a.totalReviews || b.score - a.score,
    reviews: (a, b) => b.totalReviews - a.totalReviews || b.averageRating - a.averageRating || b.score - a.score,
    favorites: (a, b) => b.totalFavorites - a.totalFavorites || b.score - a.score,
    apps: (a, b) => b.publishedApps - a.publishedApps || b.score - a.score,
    versions: (a, b) => b.totalVersions - a.totalVersions || b.score - a.score,
  };

  return [...entries].sort(sorters[sort] || sorters.overall);
};

const getAppWindowMetrics = (app, windowStart) => {
  if (!windowStart) {
    const totalReviews = app.reviewCount || 0;
    return {
      id: app.id,
      name: app.name,
      slug: app.slug,
      totalDownloads: app.downloadCount || 0,
      totalFavorites: app.favoriteCount || 0,
      totalReviews,
      totalVersions: app.versions?.length || 0,
      averageRating: totalReviews ? round(app.averageRating || 0) : 0,
    };
  }

  const totalReviews = app.reviews?.length || 0;
  const ratingSum = sumBy(app.reviews || [], (review) => review.rating || 0);

  return {
    id: app.id,
    name: app.name,
    slug: app.slug,
    totalDownloads: app.downloads?.length || 0,
    totalFavorites: app.favorites?.length || 0,
    totalReviews,
    totalVersions: app.versions?.length || 0,
    averageRating: totalReviews ? round(ratingSum / totalReviews) : 0,
  };
};

const getTopDevelopers = async ({ window, sort, limit } = {}) => {
  const windowSetting = parseLeaderboardWindow(window);
  const sortKey = parseLeaderboardSort(sort);
  const safeLimit = parseLeaderboardLimit(limit);

  const profiles = await prisma.developerProfile.findMany({
    where: {
      apps: {
        some: {
          status: 'PUBLISHED',
        },
      },
    },
    select: {
      id: true,
      userId: true,
      companyName: true,
      isVerified: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          username: true,
          email: true,
          avatarUrl: true,
        },
      },
      apps: {
        where: {
          status: 'PUBLISHED',
        },
        select: {
          id: true,
          name: true,
          slug: true,
          downloadCount: true,
          favoriteCount: true,
          reviewCount: true,
          averageRating: true,
          versions: windowSetting.windowStart
            ? {
                where: {
                  releaseDate: {
                    gte: windowSetting.windowStart,
                  },
                },
                select: { id: true },
              }
            : {
                select: { id: true },
              },
          downloads: windowSetting.windowStart
            ? {
                where: {
                  downloadedAt: {
                    gte: windowSetting.windowStart,
                  },
                },
                select: { id: true },
              }
            : false,
          favorites: windowSetting.windowStart
            ? {
                where: {
                  createdAt: {
                    gte: windowSetting.windowStart,
                  },
                },
                select: { id: true },
              }
            : false,
          reviews: windowSetting.windowStart
            ? {
                where: {
                  createdAt: {
                    gte: windowSetting.windowStart,
                  },
                },
                select: { id: true, rating: true },
              }
            : false,
        },
      },
    },
  });

  const entries = profiles
    .map((profile) => {
      const appMetrics = profile.apps.map((app) => getAppWindowMetrics(app, windowSetting.windowStart));
      const publishedApps = appMetrics.length;
      const totalDownloads = sumBy(appMetrics, (app) => app.totalDownloads || 0);
      const totalFavorites = sumBy(appMetrics, (app) => app.totalFavorites || 0);
      const totalReviews = sumBy(appMetrics, (app) => app.totalReviews || 0);
      const totalVersions = sumBy(appMetrics, (app) => app.totalVersions || 0);
      const weightedRatingSum = sumBy(appMetrics, (app) => (app.averageRating || 0) * (app.totalReviews || 0));
      const averageRating = totalReviews ? round(weightedRatingSum / totalReviews) : 0;
      const scoreBreakdown = createScoreBreakdown({
        averageRating,
        totalDownloads,
        totalFavorites,
        totalReviews,
        publishedApps,
        totalVersions,
      });
      const score = round(Object.values(scoreBreakdown).reduce((acc, value) => acc + value, 0));
      const topApp = sortLeaderboardEntries(
        appMetrics.map((app) => ({
          ...app,
          impact: computeTopAppImpact(app),
        })),
        'overall',
      )[0];

      return {
        developerId: profile.id,
        userId: profile.userId,
        name: profile.user?.name || profile.companyName || profile.user?.username || profile.user?.email || 'Unknown developer',
        username: profile.user?.username || null,
        email: profile.user?.email || null,
        avatarUrl: profile.user?.avatarUrl || null,
        companyName: profile.companyName || null,
        isVerified: Boolean(profile.isVerified),
        joinedAt: profile.createdAt,
        publishedApps,
        totalDownloads,
        totalFavorites,
        totalReviews,
        totalVersions,
        averageRating,
        score,
        scoreBreakdown,
        topApp: topApp
          ? {
              id: topApp.id,
              name: topApp.name,
              slug: topApp.slug,
              totalDownloads: topApp.totalDownloads,
              totalReviews: topApp.totalReviews,
              averageRating: topApp.averageRating,
            }
          : null,
      };
    })
    .filter((entry) => entry.publishedApps > 0);

  const leaders = sortLeaderboardEntries(entries, sortKey)
    .slice(0, safeLimit)
    .map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      window: windowSetting.key,
      windowDays: windowSetting.days,
      windowLabel: windowSetting.label,
      sort: sortKey,
      limit: safeLimit,
      totalDevelopers: entries.length,
    },
    leaders,
  };
};

const getDeveloperOverview = async (userId) => {
  const developerId = await getDeveloperProfileId(userId);
  if (!developerId) {
    return {
      totals: {
        apps: 0,
        downloads: 0,
        favorites: 0,
        reviews: 0,
        averageRating: 0,
      },
      versions: {
        count: 0,
        downloads: 0,
        installs: 0,
      },
      statusBreakdown: {},
    };
  }

  const apps = await prisma.app.findMany({
    where: { developerId },
    select: {
      id: true,
      status: true,
      downloadCount: true,
      favoriteCount: true,
      reviewCount: true,
      averageRating: true,
    },
  });

  const totalDownloads = sumBy(apps, (app) => app.downloadCount || 0);
  const totalFavorites = sumBy(apps, (app) => app.favoriteCount || 0);
  const totalReviews = sumBy(apps, (app) => app.reviewCount || 0);
  const weightedRatingSum = sumBy(apps, (app) => (app.averageRating || 0) * (app.reviewCount || 0));
  const averageRating = totalReviews ? round(weightedRatingSum / totalReviews) : 0;

  const statusBreakdown = apps.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  const versionAgg = await prisma.appVersion.aggregate({
    where: {
      app: {
        developerId,
      },
    },
    _count: { id: true },
    _sum: {
      downloadCount: true,
      installCount: true,
    },
  });

  return {
    totals: {
      apps: apps.length,
      downloads: totalDownloads,
      favorites: totalFavorites,
      reviews: totalReviews,
      averageRating,
    },
    versions: {
      count: versionAgg._count.id || 0,
      downloads: versionAgg._sum.downloadCount || 0,
      installs: versionAgg._sum.installCount || 0,
    },
    statusBreakdown,
  };
};

const getAppAnalytics = async ({ userId, appId }) => {
  const parsedAppId = parsePositiveInt(appId);
  if (!parsedAppId) throw makeHttpError('Invalid app id', 400);

  const app = await prisma.app.findUnique({
    where: { id: parsedAppId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      downloadCount: true,
      favoriteCount: true,
      reviewCount: true,
      averageRating: true,
      developer: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!app) throw makeHttpError('App not found', 404);
  if (!app.developer || app.developer.userId !== userId) {
    throw makeHttpError('You can only view analytics for your own apps', 403);
  }

  const versions = await prisma.appVersion.findMany({
    where: { appId: app.id },
    select: {
      id: true,
      version: true,
      releaseDate: true,
      downloadCount: true,
      installCount: true,
      isStable: true,
      isPrerelease: true,
    },
    orderBy: [{ releaseDate: 'asc' }, { createdAt: 'asc' }],
  });

  const totalVersionDownloads = sumBy(versions, (version) => version.downloadCount || 0);
  const totalVersionInstalls = sumBy(versions, (version) => version.installCount || 0);
  const adoptionDenominator = totalVersionDownloads || app.downloadCount || 0;

  let cumulative = 0;
  const versionTrends = versions.map((version) => {
    const downloads = version.downloadCount || 0;
    cumulative += downloads;
    const adoptionRate = adoptionDenominator
      ? round((downloads / adoptionDenominator) * 100)
      : 0;

    return {
      id: version.id,
      version: version.version,
      releaseDate: version.releaseDate,
      downloads,
      installs: version.installCount || 0,
      cumulativeDownloads: cumulative,
      adoptionRate,
      isStable: version.isStable,
      isPrerelease: version.isPrerelease,
    };
  });

  const ratingRows = await prisma.review.groupBy({
    by: ['rating'],
    where: { appId: app.id },
    _count: {
      _all: true,
    },
  });

  const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingRows.forEach((row) => {
    if (ratingBreakdown[row.rating] !== undefined) {
      ratingBreakdown[row.rating] = row._count._all;
    }
  });

  const daysWindow = 90;
  const windowStart = new Date(Date.now() - daysWindow * 24 * 60 * 60 * 1000);

  const [recentDownloads, recentFavorites] = await Promise.all([
    prisma.download.findMany({
      where: {
        appId: app.id,
        downloadedAt: { gte: windowStart },
      },
      select: { downloadedAt: true },
      orderBy: { downloadedAt: 'asc' },
    }),
    prisma.favorite.findMany({
      where: {
        appId: app.id,
        createdAt: { gte: windowStart },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  return {
    app: {
      id: app.id,
      name: app.name,
      slug: app.slug,
      status: app.status,
    },
    totals: {
      downloads: app.downloadCount || 0,
      favorites: app.favoriteCount || 0,
      reviews: app.reviewCount || 0,
      averageRating: round(app.averageRating || 0),
    },
    reviews: {
      count: app.reviewCount || 0,
      averageRating: round(app.averageRating || 0),
      ratingBreakdown,
    },
    versions: {
      totalVersions: versions.length,
      totalDownloads: totalVersionDownloads,
      totalInstalls: totalVersionInstalls,
      trends: versionTrends,
    },
    trends: {
      windowDays: daysWindow,
      dailyDownloads: aggregateDateCounts(recentDownloads, 'downloadedAt', windowStart),
      dailyFavorites: aggregateDateCounts(recentFavorites, 'createdAt', windowStart),
    },
  };
};

module.exports = {
  getDeveloperOverview,
  getAppAnalytics,
  getTopDevelopers,
};
