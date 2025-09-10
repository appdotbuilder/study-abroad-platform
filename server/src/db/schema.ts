import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  integer, 
  boolean,
  jsonb,
  pgEnum,
  numeric,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const studyLevelEnum = pgEnum('study_level', ['DIPLOMA', 'BACHELOR', 'MASTER', 'PHD']);
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'EDITOR', 'PARTIAL_SUPERVISOR']);
export const languageCodeEnum = pgEnum('language_code', ['ar', 'en', 'tr', 'ms']);
export const statusEnum = pgEnum('status', ['ACTIVE', 'INACTIVE']);
export const inquiryStatusEnum = pgEnum('inquiry_status', ['NEW', 'CONTACTED', 'COMPLETED', 'ARCHIVED']);

// Countries table
export const countriesTable = pgTable('countries', {
  id: serial('id').primaryKey(),
  name_ar: text('name_ar').notNull(),
  name_en: text('name_en').notNull(),
  name_tr: text('name_tr').notNull(),
  name_ms: text('name_ms').notNull(),
  slug: text('slug').notNull().unique(),
  description_ar: text('description_ar'),
  description_en: text('description_en'),
  description_tr: text('description_tr'),
  description_ms: text('description_ms'),
  image_url: text('image_url'),
  status: statusEnum('status').notNull().default('ACTIVE'),
  meta_title_ar: text('meta_title_ar'),
  meta_title_en: text('meta_title_en'),
  meta_title_tr: text('meta_title_tr'),
  meta_title_ms: text('meta_title_ms'),
  meta_description_ar: text('meta_description_ar'),
  meta_description_en: text('meta_description_en'),
  meta_description_tr: text('meta_description_tr'),
  meta_description_ms: text('meta_description_ms'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('countries_slug_idx').on(table.slug),
  statusIdx: index('countries_status_idx').on(table.status),
}));

// Universities table
export const universitiesTable = pgTable('universities', {
  id: serial('id').primaryKey(),
  name_ar: text('name_ar').notNull(),
  name_en: text('name_en').notNull(),
  name_tr: text('name_tr').notNull(),
  name_ms: text('name_ms').notNull(),
  slug: text('slug').notNull().unique(),
  country_id: integer('country_id').notNull().references(() => countriesTable.id),
  global_ranking: integer('global_ranking'),
  local_ranking: integer('local_ranking'),
  teaching_language_ar: text('teaching_language_ar'),
  teaching_language_en: text('teaching_language_en'),
  teaching_language_tr: text('teaching_language_tr'),
  teaching_language_ms: text('teaching_language_ms'),
  description_ar: text('description_ar'),
  description_en: text('description_en'),
  description_tr: text('description_tr'),
  description_ms: text('description_ms'),
  image_url: text('image_url'),
  gallery_images: jsonb('gallery_images').$type<string[]>(),
  status: statusEnum('status').notNull().default('ACTIVE'),
  meta_title_ar: text('meta_title_ar'),
  meta_title_en: text('meta_title_en'),
  meta_title_tr: text('meta_title_tr'),
  meta_title_ms: text('meta_title_ms'),
  meta_description_ar: text('meta_description_ar'),
  meta_description_en: text('meta_description_en'),
  meta_description_tr: text('meta_description_tr'),
  meta_description_ms: text('meta_description_ms'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('universities_slug_idx').on(table.slug),
  countryIdx: index('universities_country_idx').on(table.country_id),
  statusIdx: index('universities_status_idx').on(table.status),
  globalRankingIdx: index('universities_global_ranking_idx').on(table.global_ranking),
}));

// Majors table
export const majorsTable = pgTable('majors', {
  id: serial('id').primaryKey(),
  name_ar: text('name_ar').notNull(),
  name_en: text('name_en').notNull(),
  name_tr: text('name_tr').notNull(),
  name_ms: text('name_ms').notNull(),
  slug: text('slug').notNull().unique(),
  description_ar: text('description_ar'),
  description_en: text('description_en'),
  description_tr: text('description_tr'),
  description_ms: text('description_ms'),
  future_opportunities_ar: text('future_opportunities_ar'),
  future_opportunities_en: text('future_opportunities_en'),
  future_opportunities_tr: text('future_opportunities_tr'),
  future_opportunities_ms: text('future_opportunities_ms'),
  image_url: text('image_url'),
  status: statusEnum('status').notNull().default('ACTIVE'),
  meta_title_ar: text('meta_title_ar'),
  meta_title_en: text('meta_title_en'),
  meta_title_tr: text('meta_title_tr'),
  meta_title_ms: text('meta_title_ms'),
  meta_description_ar: text('meta_description_ar'),
  meta_description_en: text('meta_description_en'),
  meta_description_tr: text('meta_description_tr'),
  meta_description_ms: text('meta_description_ms'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('majors_slug_idx').on(table.slug),
  statusIdx: index('majors_status_idx').on(table.status),
}));

// University-Major relationship table
export const universityMajorsTable = pgTable('university_majors', {
  id: serial('id').primaryKey(),
  university_id: integer('university_id').notNull().references(() => universitiesTable.id),
  major_id: integer('major_id').notNull().references(() => majorsTable.id),
  study_levels: jsonb('study_levels').$type<('DIPLOMA' | 'BACHELOR' | 'MASTER' | 'PHD')[]>().notNull(),
  tuition_fee_min: numeric('tuition_fee_min', { precision: 10, scale: 2 }),
  tuition_fee_max: numeric('tuition_fee_max', { precision: 10, scale: 2 }),
  currency: text('currency'),
  duration_years: integer('duration_years'),
  requirements_ar: text('requirements_ar'),
  requirements_en: text('requirements_en'),
  requirements_tr: text('requirements_tr'),
  requirements_ms: text('requirements_ms'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  universityIdx: index('university_majors_university_idx').on(table.university_id),
  majorIdx: index('university_majors_major_idx').on(table.major_id),
  uniqueUniversityMajor: uniqueIndex('university_majors_unique').on(table.university_id, table.major_id),
}));

// Articles table
export const articlesTable = pgTable('articles', {
  id: serial('id').primaryKey(),
  title_ar: text('title_ar').notNull(),
  title_en: text('title_en').notNull(),
  title_tr: text('title_tr').notNull(),
  title_ms: text('title_ms').notNull(),
  slug: text('slug').notNull().unique(),
  content_ar: text('content_ar'),
  content_en: text('content_en'),
  content_tr: text('content_tr'),
  content_ms: text('content_ms'),
  excerpt_ar: text('excerpt_ar'),
  excerpt_en: text('excerpt_en'),
  excerpt_tr: text('excerpt_tr'),
  excerpt_ms: text('excerpt_ms'),
  featured_image_url: text('featured_image_url'),
  category: text('category'),
  country_id: integer('country_id').references(() => countriesTable.id),
  major_id: integer('major_id').references(() => majorsTable.id),
  status: statusEnum('status').notNull().default('ACTIVE'),
  is_featured: boolean('is_featured').notNull().default(false),
  meta_title_ar: text('meta_title_ar'),
  meta_title_en: text('meta_title_en'),
  meta_title_tr: text('meta_title_tr'),
  meta_title_ms: text('meta_title_ms'),
  meta_description_ar: text('meta_description_ar'),
  meta_description_en: text('meta_description_en'),
  meta_description_tr: text('meta_description_tr'),
  meta_description_ms: text('meta_description_ms'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('articles_slug_idx').on(table.slug),
  statusIdx: index('articles_status_idx').on(table.status),
  countryIdx: index('articles_country_idx').on(table.country_id),
  majorIdx: index('articles_major_idx').on(table.major_id),
  featuredIdx: index('articles_featured_idx').on(table.is_featured),
  categoryIdx: index('articles_category_idx').on(table.category),
}));

// Student inquiries table
export const studentInquiriesTable = pgTable('student_inquiries', {
  id: serial('id').primaryKey(),
  full_name: text('full_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  whatsapp: text('whatsapp'),
  desired_country: text('desired_country'),
  study_level: studyLevelEnum('study_level'),
  desired_major: text('desired_major'),
  message: text('message'),
  source_page: text('source_page'),
  language_code: languageCodeEnum('language_code').notNull(),
  status: inquiryStatusEnum('status').notNull().default('NEW'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('student_inquiries_status_idx').on(table.status),
  languageIdx: index('student_inquiries_language_idx').on(table.language_code),
  createdAtIdx: index('student_inquiries_created_at_idx').on(table.created_at),
  emailIdx: index('student_inquiries_email_idx').on(table.email),
}));

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  full_name: text('full_name').notNull(),
  role: userRoleEnum('role').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  last_login: timestamp('last_login'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  usernameIdx: uniqueIndex('users_username_idx').on(table.username),
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
  activeIdx: index('users_active_idx').on(table.is_active),
}));

// FAQs table
export const faqsTable = pgTable('faqs', {
  id: serial('id').primaryKey(),
  question_ar: text('question_ar').notNull(),
  question_en: text('question_en').notNull(),
  question_tr: text('question_tr').notNull(),
  question_ms: text('question_ms').notNull(),
  answer_ar: text('answer_ar').notNull(),
  answer_en: text('answer_en').notNull(),
  answer_tr: text('answer_tr').notNull(),
  answer_ms: text('answer_ms').notNull(),
  order_index: integer('order_index').notNull().default(0),
  category: text('category'),
  status: statusEnum('status').notNull().default('ACTIVE'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('faqs_status_idx').on(table.status),
  orderIdx: index('faqs_order_idx').on(table.order_index),
  categoryIdx: index('faqs_category_idx').on(table.category),
}));

// Settings table
export const settingsTable = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  category: text('category'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  keyIdx: uniqueIndex('settings_key_idx').on(table.key),
  categoryIdx: index('settings_category_idx').on(table.category),
}));

// Relations
export const countriesRelations = relations(countriesTable, ({ many }) => ({
  universities: many(universitiesTable),
  articles: many(articlesTable),
}));

export const universitiesRelations = relations(universitiesTable, ({ one, many }) => ({
  country: one(countriesTable, {
    fields: [universitiesTable.country_id],
    references: [countriesTable.id],
  }),
  universityMajors: many(universityMajorsTable),
}));

export const majorsRelations = relations(majorsTable, ({ many }) => ({
  universityMajors: many(universityMajorsTable),
  articles: many(articlesTable),
}));

export const universityMajorsRelations = relations(universityMajorsTable, ({ one }) => ({
  university: one(universitiesTable, {
    fields: [universityMajorsTable.university_id],
    references: [universitiesTable.id],
  }),
  major: one(majorsTable, {
    fields: [universityMajorsTable.major_id],
    references: [majorsTable.id],
  }),
}));

export const articlesRelations = relations(articlesTable, ({ one }) => ({
  country: one(countriesTable, {
    fields: [articlesTable.country_id],
    references: [countriesTable.id],
  }),
  major: one(majorsTable, {
    fields: [articlesTable.major_id],
    references: [majorsTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = {
  countries: countriesTable,
  universities: universitiesTable,
  majors: majorsTable,
  universityMajors: universityMajorsTable,
  articles: articlesTable,
  studentInquiries: studentInquiriesTable,
  users: usersTable,
  faqs: faqsTable,
  settings: settingsTable,
};

// TypeScript types for the table schemas
export type Country = typeof countriesTable.$inferSelect;
export type NewCountry = typeof countriesTable.$inferInsert;

export type University = typeof universitiesTable.$inferSelect;
export type NewUniversity = typeof universitiesTable.$inferInsert;

export type Major = typeof majorsTable.$inferSelect;
export type NewMajor = typeof majorsTable.$inferInsert;

export type UniversityMajor = typeof universityMajorsTable.$inferSelect;
export type NewUniversityMajor = typeof universityMajorsTable.$inferInsert;

export type Article = typeof articlesTable.$inferSelect;
export type NewArticle = typeof articlesTable.$inferInsert;

export type StudentInquiry = typeof studentInquiriesTable.$inferSelect;
export type NewStudentInquiry = typeof studentInquiriesTable.$inferInsert;

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type FAQ = typeof faqsTable.$inferSelect;
export type NewFAQ = typeof faqsTable.$inferInsert;

export type Settings = typeof settingsTable.$inferSelect;
export type NewSettings = typeof settingsTable.$inferInsert;