import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createCountryInputSchema,
  updateCountryInputSchema,
  getCountriesInputSchema,
  createUniversityInputSchema,
  updateUniversityInputSchema,
  getUniversitiesInputSchema,
  createMajorInputSchema,
  updateMajorInputSchema,
  getMajorsInputSchema,
  createUniversityMajorInputSchema,
  createArticleInputSchema,
  updateArticleInputSchema,
  getArticlesInputSchema,
  createStudentInquiryInputSchema,
  updateStudentInquiryInputSchema,
  getStudentInquiriesInputSchema,
  createUserInputSchema,
  updateUserInputSchema,
  createFAQInputSchema,
  updateSettingsInputSchema,
} from './schema';

// Import handlers
import {
  getCountries,
  getCountryById,
  getCountryBySlug,
  createCountry,
  updateCountry,
  deleteCountry,
} from './handlers/countries';

import {
  getUniversities,
  getUniversityById,
  getUniversityBySlug,
  getUniversitiesByCountry,
  createUniversity,
  updateUniversity,
  deleteUniversity,
} from './handlers/universities';

import {
  getMajors,
  getMajorById,
  getMajorBySlug,
  getMajorsByUniversity,
  createMajor,
  updateMajor,
  deleteMajor,
} from './handlers/majors';

import {
  getUniversityMajors,
  getMajorUniversities,
  getUniversityMajorDetails,
  createUniversityMajor,
  updateUniversityMajor,
  deleteUniversityMajor,
} from './handlers/university-majors';

import {
  getArticles,
  getArticleById,
  getArticleBySlug,
  getFeaturedArticles,
  getRelatedArticles,
  getArticlesByCountry,
  getArticlesByMajor,
  createArticle,
  updateArticle,
  deleteArticle,
} from './handlers/articles';

import {
  getStudentInquiries,
  getStudentInquiryById,
  getNewInquiriesCount,
  getInquiriesByStatus,
  createStudentInquiry,
  updateStudentInquiry,
  deleteStudentInquiry,
  exportStudentInquiries,
} from './handlers/student-inquiries';

import {
  getUsers,
  getUserById,
  getUserByUsername,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  updateUserLastLogin,
  validateUserCredentials,
} from './handlers/users';

import {
  getFAQs,
  getFAQById,
  getActiveFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  reorderFAQs,
} from './handlers/faqs';

import {
  getAllSettings,
  getSettingByKey,
  getSettingsByCategory,
  updateSetting,
  updateMultipleSettings,
  getSupportedLanguages,
  getEmailSettings,
  getSEOSettings,
} from './handlers/settings';

import {
  getDashboardStats,
  getVisitorAnalytics,
  getContentStats,
  getInquiryTrends,
} from './handlers/dashboard';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Countries routes
  countries: router({
    list: publicProcedure
      .input(getCountriesInputSchema)
      .query(({ input }) => getCountries(input)),
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => getCountryById(input)),
    getBySlug: publicProcedure
      .input(z.string())
      .query(({ input }) => getCountryBySlug(input)),
    create: publicProcedure
      .input(createCountryInputSchema)
      .mutation(({ input }) => createCountry(input)),
    update: publicProcedure
      .input(updateCountryInputSchema)
      .mutation(({ input }) => updateCountry(input)),
    delete: publicProcedure
      .input(z.number())
      .mutation(({ input }) => deleteCountry(input)),
  }),

  // Universities routes
  universities: router({
    list: publicProcedure
      .input(getUniversitiesInputSchema)
      .query(({ input }) => getUniversities(input)),
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => getUniversityById(input)),
    getBySlug: publicProcedure
      .input(z.string())
      .query(({ input }) => getUniversityBySlug(input)),
    getByCountry: publicProcedure
      .input(z.number())
      .query(({ input }) => getUniversitiesByCountry(input)),
    create: publicProcedure
      .input(createUniversityInputSchema)
      .mutation(({ input }) => createUniversity(input)),
    update: publicProcedure
      .input(updateUniversityInputSchema)
      .mutation(({ input }) => updateUniversity(input)),
    delete: publicProcedure
      .input(z.number())
      .mutation(({ input }) => deleteUniversity(input)),
  }),

  // Majors routes
  majors: router({
    list: publicProcedure
      .input(getMajorsInputSchema)
      .query(({ input }) => getMajors(input)),
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => getMajorById(input)),
    getBySlug: publicProcedure
      .input(z.string())
      .query(({ input }) => getMajorBySlug(input)),
    getByUniversity: publicProcedure
      .input(z.number())
      .query(({ input }) => getMajorsByUniversity(input)),
    create: publicProcedure
      .input(createMajorInputSchema)
      .mutation(({ input }) => createMajor(input)),
    update: publicProcedure
      .input(updateMajorInputSchema)
      .mutation(({ input }) => updateMajor(input)),
    delete: publicProcedure
      .input(z.number())
      .mutation(({ input }) => deleteMajor(input)),
  }),

  // University-Major relationship routes
  universityMajors: router({
    getUniversityMajors: publicProcedure
      .input(z.number())
      .query(({ input }) => getUniversityMajors(input)),
    getMajorUniversities: publicProcedure
      .input(z.number())
      .query(({ input }) => getMajorUniversities(input)),
    getDetails: publicProcedure
      .input(z.object({ universityId: z.number(), majorId: z.number() }))
      .query(({ input }) => getUniversityMajorDetails(input.universityId, input.majorId)),
    create: publicProcedure
      .input(createUniversityMajorInputSchema)
      .mutation(({ input }) => createUniversityMajor(input)),
    update: publicProcedure
      .input(z.object({
        universityId: z.number(),
        majorId: z.number(),
        data: createUniversityMajorInputSchema.partial(),
      }))
      .mutation(({ input }) => updateUniversityMajor(input.universityId, input.majorId, input.data)),
    delete: publicProcedure
      .input(z.object({ universityId: z.number(), majorId: z.number() }))
      .mutation(({ input }) => deleteUniversityMajor(input.universityId, input.majorId)),
  }),

  // Articles routes
  articles: router({
    list: publicProcedure
      .input(getArticlesInputSchema)
      .query(({ input }) => getArticles(input)),
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => getArticleById(input)),
    getBySlug: publicProcedure
      .input(z.string())
      .query(({ input }) => getArticleBySlug(input)),
    getFeatured: publicProcedure
      .input(z.number().default(5))
      .query(({ input }) => getFeaturedArticles(input)),
    getRelated: publicProcedure
      .input(z.object({ articleId: z.number(), limit: z.number().default(5) }))
      .query(({ input }) => getRelatedArticles(input.articleId, input.limit)),
    getByCountry: publicProcedure
      .input(z.object({ countryId: z.number(), limit: z.number().optional() }))
      .query(({ input }) => getArticlesByCountry(input.countryId, input.limit)),
    getByMajor: publicProcedure
      .input(z.object({ majorId: z.number(), limit: z.number().optional() }))
      .query(({ input }) => getArticlesByMajor(input.majorId, input.limit)),
    create: publicProcedure
      .input(createArticleInputSchema)
      .mutation(({ input }) => createArticle(input)),
    update: publicProcedure
      .input(updateArticleInputSchema)
      .mutation(({ input }) => updateArticle(input)),
    delete: publicProcedure
      .input(z.number())
      .mutation(({ input }) => deleteArticle(input)),
  }),

  // Student inquiries routes
  inquiries: router({
    list: publicProcedure
      .input(getStudentInquiriesInputSchema)
      .query(({ input }) => getStudentInquiries(input)),
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => getStudentInquiryById(input)),
    getNewCount: publicProcedure
      .query(() => getNewInquiriesCount()),
    getByStatus: publicProcedure
      .input(z.enum(['NEW', 'CONTACTED', 'COMPLETED', 'ARCHIVED']))
      .query(({ input }) => getInquiriesByStatus(input)),
    create: publicProcedure
      .input(createStudentInquiryInputSchema)
      .mutation(({ input }) => createStudentInquiry(input)),
    update: publicProcedure
      .input(updateStudentInquiryInputSchema)
      .mutation(({ input }) => updateStudentInquiry(input)),
    delete: publicProcedure
      .input(z.number())
      .mutation(({ input }) => deleteStudentInquiry(input)),
    export: publicProcedure
      .input(getStudentInquiriesInputSchema)
      .query(({ input }) => exportStudentInquiries(input)),
  }),

  // Users routes
  users: router({
    list: publicProcedure
      .query(() => getUsers()),
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => getUserById(input)),
    getByUsername: publicProcedure
      .input(z.string())
      .query(({ input }) => getUserByUsername(input)),
    getByEmail: publicProcedure
      .input(z.string())
      .query(({ input }) => getUserByEmail(input)),
    create: publicProcedure
      .input(createUserInputSchema)
      .mutation(({ input }) => createUser(input)),
    update: publicProcedure
      .input(updateUserInputSchema)
      .mutation(({ input }) => updateUser(input)),
    delete: publicProcedure
      .input(z.number())
      .mutation(({ input }) => deleteUser(input)),
    updateLastLogin: publicProcedure
      .input(z.number())
      .mutation(({ input }) => updateUserLastLogin(input)),
    validateCredentials: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(({ input }) => validateUserCredentials(input.username, input.password)),
  }),

  // FAQs routes
  faqs: router({
    list: publicProcedure
      .input(z.string().optional())
      .query(({ input }) => getFAQs(input)),
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => getFAQById(input)),
    getActive: publicProcedure
      .input(z.string().optional())
      .query(({ input }) => getActiveFAQs(input)),
    create: publicProcedure
      .input(createFAQInputSchema)
      .mutation(({ input }) => createFAQ(input)),
    update: publicProcedure
      .input(z.object({ id: z.number(), data: createFAQInputSchema.partial() }))
      .mutation(({ input }) => updateFAQ(input.id, input.data)),
    delete: publicProcedure
      .input(z.number())
      .mutation(({ input }) => deleteFAQ(input)),
    reorder: publicProcedure
      .input(z.array(z.object({ id: z.number(), order_index: z.number() })))
      .mutation(({ input }) => reorderFAQs(input)),
  }),

  // Settings routes
  settings: router({
    getAll: publicProcedure
      .query(() => getAllSettings()),
    getByKey: publicProcedure
      .input(z.string())
      .query(({ input }) => getSettingByKey(input)),
    getByCategory: publicProcedure
      .input(z.string())
      .query(({ input }) => getSettingsByCategory(input)),
    update: publicProcedure
      .input(updateSettingsInputSchema)
      .mutation(({ input }) => updateSetting(input)),
    updateMultiple: publicProcedure
      .input(z.array(updateSettingsInputSchema))
      .mutation(({ input }) => updateMultipleSettings(input)),
    getSupportedLanguages: publicProcedure
      .query(() => getSupportedLanguages()),
    getEmailSettings: publicProcedure
      .query(() => getEmailSettings()),
    getSEOSettings: publicProcedure
      .query(() => getSEOSettings()),
  }),

  // Dashboard routes
  dashboard: router({
    getStats: publicProcedure
      .query(() => getDashboardStats()),
    getVisitorAnalytics: publicProcedure
      .input(z.number().default(30))
      .query(({ input }) => getVisitorAnalytics(input)),
    getContentStats: publicProcedure
      .query(() => getContentStats()),
    getInquiryTrends: publicProcedure
      .input(z.number().default(30))
      .query(({ input }) => getInquiryTrends(input)),
  }),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();