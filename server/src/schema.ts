import { z } from 'zod';

// Enums for various fields
export const studyLevelEnum = z.enum(['DIPLOMA', 'BACHELOR', 'MASTER', 'PHD']);
export const userRoleEnum = z.enum(['ADMIN', 'EDITOR', 'PARTIAL_SUPERVISOR']);
export const languageCodeEnum = z.enum(['ar', 'en', 'tr', 'ms']);
export const statusEnum = z.enum(['ACTIVE', 'INACTIVE']);
export const inquiryStatusEnum = z.enum(['NEW', 'CONTACTED', 'COMPLETED', 'ARCHIVED']);

// Country schemas
export const countrySchema = z.object({
  id: z.number(),
  name_ar: z.string(),
  name_en: z.string(),
  name_tr: z.string(),
  name_ms: z.string(),
  slug: z.string(),
  description_ar: z.string().nullable(),
  description_en: z.string().nullable(),
  description_tr: z.string().nullable(),
  description_ms: z.string().nullable(),
  image_url: z.string().nullable(),
  status: statusEnum,
  meta_title_ar: z.string().nullable(),
  meta_title_en: z.string().nullable(),
  meta_title_tr: z.string().nullable(),
  meta_title_ms: z.string().nullable(),
  meta_description_ar: z.string().nullable(),
  meta_description_en: z.string().nullable(),
  meta_description_tr: z.string().nullable(),
  meta_description_ms: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Country = z.infer<typeof countrySchema>;

export const createCountryInputSchema = z.object({
  name_ar: z.string(),
  name_en: z.string(),
  name_tr: z.string(),
  name_ms: z.string(),
  slug: z.string(),
  description_ar: z.string().nullable().optional(),
  description_en: z.string().nullable().optional(),
  description_tr: z.string().nullable().optional(),
  description_ms: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  status: statusEnum.default('ACTIVE'),
  meta_title_ar: z.string().nullable().optional(),
  meta_title_en: z.string().nullable().optional(),
  meta_title_tr: z.string().nullable().optional(),
  meta_title_ms: z.string().nullable().optional(),
  meta_description_ar: z.string().nullable().optional(),
  meta_description_en: z.string().nullable().optional(),
  meta_description_tr: z.string().nullable().optional(),
  meta_description_ms: z.string().nullable().optional(),
});

export type CreateCountryInput = z.infer<typeof createCountryInputSchema>;

export const updateCountryInputSchema = z.object({
  id: z.number(),
  name_ar: z.string().optional(),
  name_en: z.string().optional(),
  name_tr: z.string().optional(),
  name_ms: z.string().optional(),
  slug: z.string().optional(),
  description_ar: z.string().nullable().optional(),
  description_en: z.string().nullable().optional(),
  description_tr: z.string().nullable().optional(),
  description_ms: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  status: statusEnum.optional(),
  meta_title_ar: z.string().nullable().optional(),
  meta_title_en: z.string().nullable().optional(),
  meta_title_tr: z.string().nullable().optional(),
  meta_title_ms: z.string().nullable().optional(),
  meta_description_ar: z.string().nullable().optional(),
  meta_description_en: z.string().nullable().optional(),
  meta_description_tr: z.string().nullable().optional(),
  meta_description_ms: z.string().nullable().optional(),
});

export type UpdateCountryInput = z.infer<typeof updateCountryInputSchema>;

// University schemas
export const universitySchema = z.object({
  id: z.number(),
  name_ar: z.string(),
  name_en: z.string(),
  name_tr: z.string(),
  name_ms: z.string(),
  slug: z.string(),
  country_id: z.number(),
  global_ranking: z.number().nullable(),
  local_ranking: z.number().nullable(),
  teaching_language_ar: z.string().nullable(),
  teaching_language_en: z.string().nullable(),
  teaching_language_tr: z.string().nullable(),
  teaching_language_ms: z.string().nullable(),
  description_ar: z.string().nullable(),
  description_en: z.string().nullable(),
  description_tr: z.string().nullable(),
  description_ms: z.string().nullable(),
  image_url: z.string().nullable(),
  gallery_images: z.array(z.string()).nullable(),
  status: statusEnum,
  meta_title_ar: z.string().nullable(),
  meta_title_en: z.string().nullable(),
  meta_title_tr: z.string().nullable(),
  meta_title_ms: z.string().nullable(),
  meta_description_ar: z.string().nullable(),
  meta_description_en: z.string().nullable(),
  meta_description_tr: z.string().nullable(),
  meta_description_ms: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type University = z.infer<typeof universitySchema>;

export const createUniversityInputSchema = z.object({
  name_ar: z.string(),
  name_en: z.string(),
  name_tr: z.string(),
  name_ms: z.string(),
  slug: z.string(),
  country_id: z.number(),
  global_ranking: z.number().nullable().optional(),
  local_ranking: z.number().nullable().optional(),
  teaching_language_ar: z.string().nullable().optional(),
  teaching_language_en: z.string().nullable().optional(),
  teaching_language_tr: z.string().nullable().optional(),
  teaching_language_ms: z.string().nullable().optional(),
  description_ar: z.string().nullable().optional(),
  description_en: z.string().nullable().optional(),
  description_tr: z.string().nullable().optional(),
  description_ms: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  gallery_images: z.array(z.string()).nullable().optional(),
  status: statusEnum.default('ACTIVE'),
  meta_title_ar: z.string().nullable().optional(),
  meta_title_en: z.string().nullable().optional(),
  meta_title_tr: z.string().nullable().optional(),
  meta_title_ms: z.string().nullable().optional(),
  meta_description_ar: z.string().nullable().optional(),
  meta_description_en: z.string().nullable().optional(),
  meta_description_tr: z.string().nullable().optional(),
  meta_description_ms: z.string().nullable().optional(),
});

export type CreateUniversityInput = z.infer<typeof createUniversityInputSchema>;

export const updateUniversityInputSchema = z.object({
  id: z.number(),
  name_ar: z.string().optional(),
  name_en: z.string().optional(),
  name_tr: z.string().optional(),
  name_ms: z.string().optional(),
  slug: z.string().optional(),
  country_id: z.number().optional(),
  global_ranking: z.number().nullable().optional(),
  local_ranking: z.number().nullable().optional(),
  teaching_language_ar: z.string().nullable().optional(),
  teaching_language_en: z.string().nullable().optional(),
  teaching_language_tr: z.string().nullable().optional(),
  teaching_language_ms: z.string().nullable().optional(),
  description_ar: z.string().nullable().optional(),
  description_en: z.string().nullable().optional(),
  description_tr: z.string().nullable().optional(),
  description_ms: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  gallery_images: z.array(z.string()).nullable().optional(),
  status: statusEnum.optional(),
  meta_title_ar: z.string().nullable().optional(),
  meta_title_en: z.string().nullable().optional(),
  meta_title_tr: z.string().nullable().optional(),
  meta_title_ms: z.string().nullable().optional(),
  meta_description_ar: z.string().nullable().optional(),
  meta_description_en: z.string().nullable().optional(),
  meta_description_tr: z.string().nullable().optional(),
  meta_description_ms: z.string().nullable().optional(),
});

export type UpdateUniversityInput = z.infer<typeof updateUniversityInputSchema>;

// Major schemas
export const majorSchema = z.object({
  id: z.number(),
  name_ar: z.string(),
  name_en: z.string(),
  name_tr: z.string(),
  name_ms: z.string(),
  slug: z.string(),
  description_ar: z.string().nullable(),
  description_en: z.string().nullable(),
  description_tr: z.string().nullable(),
  description_ms: z.string().nullable(),
  future_opportunities_ar: z.string().nullable(),
  future_opportunities_en: z.string().nullable(),
  future_opportunities_tr: z.string().nullable(),
  future_opportunities_ms: z.string().nullable(),
  image_url: z.string().nullable(),
  status: statusEnum,
  meta_title_ar: z.string().nullable(),
  meta_title_en: z.string().nullable(),
  meta_title_tr: z.string().nullable(),
  meta_title_ms: z.string().nullable(),
  meta_description_ar: z.string().nullable(),
  meta_description_en: z.string().nullable(),
  meta_description_tr: z.string().nullable(),
  meta_description_ms: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Major = z.infer<typeof majorSchema>;

export const createMajorInputSchema = z.object({
  name_ar: z.string(),
  name_en: z.string(),
  name_tr: z.string(),
  name_ms: z.string(),
  slug: z.string(),
  description_ar: z.string().nullable().optional(),
  description_en: z.string().nullable().optional(),
  description_tr: z.string().nullable().optional(),
  description_ms: z.string().nullable().optional(),
  future_opportunities_ar: z.string().nullable().optional(),
  future_opportunities_en: z.string().nullable().optional(),
  future_opportunities_tr: z.string().nullable().optional(),
  future_opportunities_ms: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  status: statusEnum.default('ACTIVE'),
  meta_title_ar: z.string().nullable().optional(),
  meta_title_en: z.string().nullable().optional(),
  meta_title_tr: z.string().nullable().optional(),
  meta_title_ms: z.string().nullable().optional(),
  meta_description_ar: z.string().nullable().optional(),
  meta_description_en: z.string().nullable().optional(),
  meta_description_tr: z.string().nullable().optional(),
  meta_description_ms: z.string().nullable().optional(),
});

export type CreateMajorInput = z.infer<typeof createMajorInputSchema>;

export const updateMajorInputSchema = z.object({
  id: z.number(),
  name_ar: z.string().optional(),
  name_en: z.string().optional(),
  name_tr: z.string().optional(),
  name_ms: z.string().optional(),
  slug: z.string().optional(),
  description_ar: z.string().nullable().optional(),
  description_en: z.string().nullable().optional(),
  description_tr: z.string().nullable().optional(),
  description_ms: z.string().nullable().optional(),
  future_opportunities_ar: z.string().nullable().optional(),
  future_opportunities_en: z.string().nullable().optional(),
  future_opportunities_tr: z.string().nullable().optional(),
  future_opportunities_ms: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  status: statusEnum.optional(),
  meta_title_ar: z.string().nullable().optional(),
  meta_title_en: z.string().nullable().optional(),
  meta_title_tr: z.string().nullable().optional(),
  meta_title_ms: z.string().nullable().optional(),
  meta_description_ar: z.string().nullable().optional(),
  meta_description_en: z.string().nullable().optional(),
  meta_description_tr: z.string().nullable().optional(),
  meta_description_ms: z.string().nullable().optional(),
});

export type UpdateMajorInput = z.infer<typeof updateMajorInputSchema>;

// Article schemas
export const articleSchema = z.object({
  id: z.number(),
  title_ar: z.string(),
  title_en: z.string(),
  title_tr: z.string(),
  title_ms: z.string(),
  slug: z.string(),
  content_ar: z.string().nullable(),
  content_en: z.string().nullable(),
  content_tr: z.string().nullable(),
  content_ms: z.string().nullable(),
  excerpt_ar: z.string().nullable(),
  excerpt_en: z.string().nullable(),
  excerpt_tr: z.string().nullable(),
  excerpt_ms: z.string().nullable(),
  featured_image_url: z.string().nullable(),
  category: z.string().nullable(),
  country_id: z.number().nullable(),
  major_id: z.number().nullable(),
  status: statusEnum,
  is_featured: z.boolean(),
  meta_title_ar: z.string().nullable(),
  meta_title_en: z.string().nullable(),
  meta_title_tr: z.string().nullable(),
  meta_title_ms: z.string().nullable(),
  meta_description_ar: z.string().nullable(),
  meta_description_en: z.string().nullable(),
  meta_description_tr: z.string().nullable(),
  meta_description_ms: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Article = z.infer<typeof articleSchema>;

export const createArticleInputSchema = z.object({
  title_ar: z.string(),
  title_en: z.string(),
  title_tr: z.string(),
  title_ms: z.string(),
  slug: z.string(),
  content_ar: z.string().nullable().optional(),
  content_en: z.string().nullable().optional(),
  content_tr: z.string().nullable().optional(),
  content_ms: z.string().nullable().optional(),
  excerpt_ar: z.string().nullable().optional(),
  excerpt_en: z.string().nullable().optional(),
  excerpt_tr: z.string().nullable().optional(),
  excerpt_ms: z.string().nullable().optional(),
  featured_image_url: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  country_id: z.number().nullable().optional(),
  major_id: z.number().nullable().optional(),
  status: statusEnum.default('ACTIVE'),
  is_featured: z.boolean().default(false),
  meta_title_ar: z.string().nullable().optional(),
  meta_title_en: z.string().nullable().optional(),
  meta_title_tr: z.string().nullable().optional(),
  meta_title_ms: z.string().nullable().optional(),
  meta_description_ar: z.string().nullable().optional(),
  meta_description_en: z.string().nullable().optional(),
  meta_description_tr: z.string().nullable().optional(),
  meta_description_ms: z.string().nullable().optional(),
});

export type CreateArticleInput = z.infer<typeof createArticleInputSchema>;

export const updateArticleInputSchema = z.object({
  id: z.number(),
  title_ar: z.string().optional(),
  title_en: z.string().optional(),
  title_tr: z.string().optional(),
  title_ms: z.string().optional(),
  slug: z.string().optional(),
  content_ar: z.string().nullable().optional(),
  content_en: z.string().nullable().optional(),
  content_tr: z.string().nullable().optional(),
  content_ms: z.string().nullable().optional(),
  excerpt_ar: z.string().nullable().optional(),
  excerpt_en: z.string().nullable().optional(),
  excerpt_tr: z.string().nullable().optional(),
  excerpt_ms: z.string().nullable().optional(),
  featured_image_url: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  country_id: z.number().nullable().optional(),
  major_id: z.number().nullable().optional(),
  status: statusEnum.optional(),
  is_featured: z.boolean().optional(),
  meta_title_ar: z.string().nullable().optional(),
  meta_title_en: z.string().nullable().optional(),
  meta_title_tr: z.string().nullable().optional(),
  meta_title_ms: z.string().nullable().optional(),
  meta_description_ar: z.string().nullable().optional(),
  meta_description_en: z.string().nullable().optional(),
  meta_description_tr: z.string().nullable().optional(),
  meta_description_ms: z.string().nullable().optional(),
});

export type UpdateArticleInput = z.infer<typeof updateArticleInputSchema>;

// Student inquiry schemas
export const studentInquirySchema = z.object({
  id: z.number(),
  full_name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  whatsapp: z.string().nullable(),
  desired_country: z.string().nullable(),
  study_level: studyLevelEnum.nullable(),
  desired_major: z.string().nullable(),
  message: z.string().nullable(),
  source_page: z.string().nullable(),
  language_code: languageCodeEnum,
  status: inquiryStatusEnum,
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type StudentInquiry = z.infer<typeof studentInquirySchema>;

export const createStudentInquiryInputSchema = z.object({
  full_name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  whatsapp: z.string().nullable().optional(),
  desired_country: z.string().nullable().optional(),
  study_level: studyLevelEnum.nullable().optional(),
  desired_major: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  source_page: z.string().nullable().optional(),
  language_code: languageCodeEnum,
});

export type CreateStudentInquiryInput = z.infer<typeof createStudentInquiryInputSchema>;

export const updateStudentInquiryInputSchema = z.object({
  id: z.number(),
  status: inquiryStatusEnum.optional(),
  notes: z.string().nullable().optional(),
});

export type UpdateStudentInquiryInput = z.infer<typeof updateStudentInquiryInputSchema>;

// User schemas
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  full_name: z.string(),
  role: userRoleEnum,
  is_active: z.boolean(),
  last_login: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string(),
  role: userRoleEnum,
  is_active: z.boolean().default(true),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = z.object({
  id: z.number(),
  username: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  full_name: z.string().optional(),
  role: userRoleEnum.optional(),
  is_active: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// University-Major relationship schema
export const universityMajorSchema = z.object({
  id: z.number(),
  university_id: z.number(),
  major_id: z.number(),
  study_levels: z.array(studyLevelEnum),
  tuition_fee_min: z.number().nullable(),
  tuition_fee_max: z.number().nullable(),
  currency: z.string().nullable(),
  duration_years: z.number().nullable(),
  requirements_ar: z.string().nullable(),
  requirements_en: z.string().nullable(),
  requirements_tr: z.string().nullable(),
  requirements_ms: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type UniversityMajor = z.infer<typeof universityMajorSchema>;

export const createUniversityMajorInputSchema = z.object({
  university_id: z.number(),
  major_id: z.number(),
  study_levels: z.array(studyLevelEnum),
  tuition_fee_min: z.number().nullable().optional(),
  tuition_fee_max: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  duration_years: z.number().nullable().optional(),
  requirements_ar: z.string().nullable().optional(),
  requirements_en: z.string().nullable().optional(),
  requirements_tr: z.string().nullable().optional(),
  requirements_ms: z.string().nullable().optional(),
});

export type CreateUniversityMajorInput = z.infer<typeof createUniversityMajorInputSchema>;

// FAQ schemas
export const faqSchema = z.object({
  id: z.number(),
  question_ar: z.string(),
  question_en: z.string(),
  question_tr: z.string(),
  question_ms: z.string(),
  answer_ar: z.string(),
  answer_en: z.string(),
  answer_tr: z.string(),
  answer_ms: z.string(),
  order_index: z.number().int(),
  category: z.string().nullable(),
  status: statusEnum,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type FAQ = z.infer<typeof faqSchema>;

export const createFAQInputSchema = z.object({
  question_ar: z.string(),
  question_en: z.string(),
  question_tr: z.string(),
  question_ms: z.string(),
  answer_ar: z.string(),
  answer_en: z.string(),
  answer_tr: z.string(),
  answer_ms: z.string(),
  order_index: z.number().int().default(0),
  category: z.string().nullable().optional(),
  status: statusEnum.default('ACTIVE'),
});

export type CreateFAQInput = z.infer<typeof createFAQInputSchema>;

// Settings schema
export const settingsSchema = z.object({
  id: z.number(),
  key: z.string(),
  value: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Settings = z.infer<typeof settingsSchema>;

export const updateSettingsInputSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsInputSchema>;

// Query input schemas
export const paginationInputSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationInputSchema>;

export const getCountriesInputSchema = paginationInputSchema.extend({
  status: statusEnum.optional(),
  search: z.string().optional(),
});

export type GetCountriesInput = z.infer<typeof getCountriesInputSchema>;

export const getUniversitiesInputSchema = paginationInputSchema.extend({
  country_id: z.number().optional(),
  status: statusEnum.optional(),
  search: z.string().optional(),
});

export type GetUniversitiesInput = z.infer<typeof getUniversitiesInputSchema>;

export const getMajorsInputSchema = paginationInputSchema.extend({
  university_id: z.number().optional(),
  status: statusEnum.optional(),
  search: z.string().optional(),
});

export type GetMajorsInput = z.infer<typeof getMajorsInputSchema>;

export const getArticlesInputSchema = paginationInputSchema.extend({
  country_id: z.number().optional(),
  major_id: z.number().optional(),
  category: z.string().optional(),
  status: statusEnum.optional(),
  is_featured: z.boolean().optional(),
  search: z.string().optional(),
});

export type GetArticlesInput = z.infer<typeof getArticlesInputSchema>;

export const getStudentInquiriesInputSchema = paginationInputSchema.extend({
  status: inquiryStatusEnum.optional(),
  language_code: languageCodeEnum.optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),
  search: z.string().optional(),
});

export type GetStudentInquiriesInput = z.infer<typeof getStudentInquiriesInputSchema>;

// Dashboard statistics schema
export const dashboardStatsSchema = z.object({
  total_countries: z.number(),
  total_universities: z.number(),
  total_majors: z.number(),
  total_articles: z.number(),
  total_inquiries: z.number(),
  new_inquiries_today: z.number(),
  inquiries_by_status: z.record(z.number()),
  inquiries_by_language: z.record(z.number()),
  recent_inquiries: z.array(studentInquirySchema),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;