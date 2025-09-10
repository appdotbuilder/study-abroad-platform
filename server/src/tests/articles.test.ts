import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable, countriesTable, majorsTable } from '../db/schema';
import { 
  type CreateArticleInput, 
  type UpdateArticleInput,
  type GetArticlesInput 
} from '../schema';
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
  deleteArticle
} from '../handlers/articles';
import { eq } from 'drizzle-orm';

// Test data
const testCountry = {
  name_ar: 'تركيا',
  name_en: 'Turkey',
  name_tr: 'Türkiye',
  name_ms: 'Turki',
  slug: 'turkey',
  status: 'ACTIVE' as const,
};

const testMajor = {
  name_ar: 'علوم الحاسوب',
  name_en: 'Computer Science',
  name_tr: 'Bilgisayar Bilimleri',
  name_ms: 'Sains Komputer',
  slug: 'computer-science',
  status: 'ACTIVE' as const,
};

const testArticleInput: CreateArticleInput = {
  title_ar: 'مقال تجريبي',
  title_en: 'Test Article',
  title_tr: 'Test Makalesi',
  title_ms: 'Artikel Ujian',
  slug: 'test-article',
  content_ar: 'محتوى المقال باللغة العربية',
  content_en: 'Article content in English',
  content_tr: 'Makale içeriği Türkçe',
  content_ms: 'Kandungan artikel dalam Bahasa Malaysia',
  excerpt_ar: 'ملخص المقال',
  excerpt_en: 'Article excerpt',
  excerpt_tr: 'Makale özeti',
  excerpt_ms: 'Ringkasan artikel',
  featured_image_url: 'https://example.com/image.jpg',
  category: 'education',
  status: 'ACTIVE' as const,
  is_featured: false,
  meta_title_ar: 'عنوان السيو',
  meta_title_en: 'SEO Title',
  meta_title_tr: 'SEO Başlığı',
  meta_title_ms: 'Tajuk SEO',
  meta_description_ar: 'وصف السيو',
  meta_description_en: 'SEO Description',
  meta_description_tr: 'SEO Açıklaması',
  meta_description_ms: 'Penerangan SEO',
};

describe('Articles Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createArticle', () => {
    it('should create an article without foreign keys', async () => {
      const result = await createArticle(testArticleInput);

      expect(result.id).toBeDefined();
      expect(result.title_en).toEqual('Test Article');
      expect(result.title_ar).toEqual('مقال تجريبي');
      expect(result.slug).toEqual('test-article');
      expect(result.content_en).toEqual('Article content in English');
      expect(result.status).toEqual('ACTIVE');
      expect(result.is_featured).toEqual(false);
      expect(result.country_id).toBeNull();
      expect(result.major_id).toBeNull();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create an article with country and major references', async () => {
      // Create country and major first
      const countryResult = await db.insert(countriesTable)
        .values(testCountry)
        .returning()
        .execute();
      const country = countryResult[0];

      const majorResult = await db.insert(majorsTable)
        .values(testMajor)
        .returning()
        .execute();
      const major = majorResult[0];

      // Create article with references
      const articleInput = {
        ...testArticleInput,
        country_id: country.id,
        major_id: major.id,
        is_featured: true,
      };

      const result = await createArticle(articleInput);

      expect(result.country_id).toEqual(country.id);
      expect(result.major_id).toEqual(major.id);
      expect(result.is_featured).toEqual(true);
    });

    it('should throw error for invalid country reference', async () => {
      const articleInput = {
        ...testArticleInput,
        country_id: 999,
      };

      expect(createArticle(articleInput)).rejects.toThrow(/Country with id 999 not found/i);
    });

    it('should throw error for invalid major reference', async () => {
      const articleInput = {
        ...testArticleInput,
        major_id: 999,
      };

      expect(createArticle(articleInput)).rejects.toThrow(/Major with id 999 not found/i);
    });
  });

  describe('getArticleById', () => {
    it('should return article by ID', async () => {
      const created = await createArticle(testArticleInput);
      const result = await getArticleById(created.id);

      expect(result).toBeDefined();
      expect(result!.id).toEqual(created.id);
      expect(result!.title_en).toEqual('Test Article');
    });

    it('should return null for non-existent article', async () => {
      const result = await getArticleById(999);
      expect(result).toBeNull();
    });
  });

  describe('getArticleBySlug', () => {
    it('should return active article by slug', async () => {
      const created = await createArticle(testArticleInput);
      const result = await getArticleBySlug('test-article');

      expect(result).toBeDefined();
      expect(result!.id).toEqual(created.id);
      expect(result!.slug).toEqual('test-article');
    });

    it('should not return inactive article by slug', async () => {
      const inactiveInput = {
        ...testArticleInput,
        status: 'INACTIVE' as const,
      };
      await createArticle(inactiveInput);
      
      const result = await getArticleBySlug('test-article');
      expect(result).toBeNull();
    });

    it('should return null for non-existent slug', async () => {
      const result = await getArticleBySlug('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getArticles', () => {
    beforeEach(async () => {
      // Create test data
      const countryResult = await db.insert(countriesTable)
        .values(testCountry)
        .returning()
        .execute();
      const country = countryResult[0];

      const majorResult = await db.insert(majorsTable)
        .values(testMajor)
        .returning()
        .execute();
      const major = majorResult[0];

      // Create multiple articles
      await createArticle({
        ...testArticleInput,
        title_en: 'Featured Article',
        slug: 'featured-article',
        is_featured: true,
        country_id: country.id,
      });

      await createArticle({
        ...testArticleInput,
        title_en: 'Major Article',
        slug: 'major-article',
        major_id: major.id,
        category: 'study',
      });

      await createArticle({
        ...testArticleInput,
        title_en: 'Inactive Article',
        slug: 'inactive-article',
        status: 'INACTIVE',
      });
    });

    it('should return paginated articles', async () => {
      const input: GetArticlesInput = {
        page: 1,
        limit: 10,
      };

      const result = await getArticles(input);

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toEqual(1);
      expect(result.limit).toEqual(10);
    });

    it('should filter by country', async () => {
      const countryResult = await db.select()
        .from(countriesTable)
        .where(eq(countriesTable.slug, 'turkey'))
        .execute();
      const country = countryResult[0];

      const input: GetArticlesInput = {
        page: 1,
        limit: 10,
        country_id: country.id,
      };

      const result = await getArticles(input);

      expect(result.data.length).toEqual(1);
      expect(result.data[0].title_en).toEqual('Featured Article');
      expect(result.data[0].country_id).toEqual(country.id);
    });

    it('should filter by major', async () => {
      const majorResult = await db.select()
        .from(majorsTable)
        .where(eq(majorsTable.slug, 'computer-science'))
        .execute();
      const major = majorResult[0];

      const input: GetArticlesInput = {
        page: 1,
        limit: 10,
        major_id: major.id,
      };

      const result = await getArticles(input);

      expect(result.data.length).toEqual(1);
      expect(result.data[0].title_en).toEqual('Major Article');
      expect(result.data[0].major_id).toEqual(major.id);
    });

    it('should filter by category', async () => {
      const input: GetArticlesInput = {
        page: 1,
        limit: 10,
        category: 'study',
      };

      const result = await getArticles(input);

      expect(result.data.length).toEqual(1);
      expect(result.data[0].category).toEqual('study');
    });

    it('should filter by status', async () => {
      const input: GetArticlesInput = {
        page: 1,
        limit: 10,
        status: 'INACTIVE',
      };

      const result = await getArticles(input);

      expect(result.data.length).toEqual(1);
      expect(result.data[0].status).toEqual('INACTIVE');
    });

    it('should filter by featured status', async () => {
      const input: GetArticlesInput = {
        page: 1,
        limit: 10,
        is_featured: true,
      };

      const result = await getArticles(input);

      expect(result.data.length).toEqual(1);
      expect(result.data[0].is_featured).toEqual(true);
    });

    it('should search in article titles and content', async () => {
      const input: GetArticlesInput = {
        page: 1,
        limit: 10,
        search: 'Featured',
      };

      const result = await getArticles(input);

      expect(result.data.length).toEqual(1);
      expect(result.data[0].title_en).toEqual('Featured Article');
    });
  });

  describe('getFeaturedArticles', () => {
    it('should return featured active articles', async () => {
      await createArticle({
        ...testArticleInput,
        title_en: 'Featured Article 1',
        slug: 'featured-1',
        is_featured: true,
      });

      await createArticle({
        ...testArticleInput,
        title_en: 'Non-Featured Article',
        slug: 'non-featured',
        is_featured: false,
      });

      await createArticle({
        ...testArticleInput,
        title_en: 'Featured Inactive',
        slug: 'featured-inactive',
        is_featured: true,
        status: 'INACTIVE',
      });

      const result = await getFeaturedArticles(10);

      expect(result.length).toEqual(1);
      expect(result[0].is_featured).toEqual(true);
      expect(result[0].status).toEqual('ACTIVE');
      expect(result[0].title_en).toEqual('Featured Article 1');
    });

    it('should respect limit parameter', async () => {
      // Create multiple featured articles
      for (let i = 1; i <= 10; i++) {
        await createArticle({
          ...testArticleInput,
          title_en: `Featured Article ${i}`,
          slug: `featured-${i}`,
          is_featured: true,
        });
      }

      const result = await getFeaturedArticles(3);
      expect(result.length).toEqual(3);
    });
  });

  describe('getRelatedArticles', () => {
    it('should return articles related by country', async () => {
      const countryResult = await db.insert(countriesTable)
        .values(testCountry)
        .returning()
        .execute();
      const country = countryResult[0];

      // Create main article
      const mainArticle = await createArticle({
        ...testArticleInput,
        title_en: 'Main Article',
        slug: 'main-article',
        country_id: country.id,
      });

      // Create related article
      await createArticle({
        ...testArticleInput,
        title_en: 'Related Article',
        slug: 'related-article',
        country_id: country.id,
      });

      // Create unrelated article
      await createArticle({
        ...testArticleInput,
        title_en: 'Unrelated Article',
        slug: 'unrelated-article',
      });

      const result = await getRelatedArticles(mainArticle.id, 5);

      expect(result.length).toEqual(1);
      expect(result[0].title_en).toEqual('Related Article');
      expect(result[0].country_id).toEqual(country.id);
      expect(result[0].id).not.toEqual(mainArticle.id);
    });

    it('should return empty array for non-existent article', async () => {
      const result = await getRelatedArticles(999, 5);
      expect(result).toEqual([]);
    });
  });

  describe('getArticlesByCountry', () => {
    it('should return active articles for specific country', async () => {
      const countryResult = await db.insert(countriesTable)
        .values(testCountry)
        .returning()
        .execute();
      const country = countryResult[0];

      await createArticle({
        ...testArticleInput,
        country_id: country.id,
      });

      await createArticle({
        ...testArticleInput,
        title_en: 'Inactive Country Article',
        slug: 'inactive-country',
        country_id: country.id,
        status: 'INACTIVE',
      });

      const result = await getArticlesByCountry(country.id);

      expect(result.length).toEqual(1);
      expect(result[0].status).toEqual('ACTIVE');
      expect(result[0].country_id).toEqual(country.id);
    });

    it('should respect limit parameter', async () => {
      const countryResult = await db.insert(countriesTable)
        .values(testCountry)
        .returning()
        .execute();
      const country = countryResult[0];

      // Create multiple articles
      for (let i = 1; i <= 5; i++) {
        await createArticle({
          ...testArticleInput,
          title_en: `Country Article ${i}`,
          slug: `country-${i}`,
          country_id: country.id,
        });
      }

      const result = await getArticlesByCountry(country.id, 3);
      expect(result.length).toEqual(3);
    });
  });

  describe('getArticlesByMajor', () => {
    it('should return active articles for specific major', async () => {
      const majorResult = await db.insert(majorsTable)
        .values(testMajor)
        .returning()
        .execute();
      const major = majorResult[0];

      await createArticle({
        ...testArticleInput,
        major_id: major.id,
      });

      const result = await getArticlesByMajor(major.id);

      expect(result.length).toEqual(1);
      expect(result[0].major_id).toEqual(major.id);
    });
  });

  describe('updateArticle', () => {
    it('should update article fields', async () => {
      const created = await createArticle(testArticleInput);

      const updateInput: UpdateArticleInput = {
        id: created.id,
        title_en: 'Updated Title',
        is_featured: true,
        status: 'INACTIVE',
      };

      const result = await updateArticle(updateInput);

      expect(result).toBeDefined();
      expect(result!.title_en).toEqual('Updated Title');
      expect(result!.is_featured).toEqual(true);
      expect(result!.status).toEqual('INACTIVE');
      // Other fields should remain unchanged
      expect(result!.title_ar).toEqual(testArticleInput.title_ar);
      expect(result!.slug).toEqual(testArticleInput.slug);
    });

    it('should return null for non-existent article', async () => {
      const updateInput: UpdateArticleInput = {
        id: 999,
        title_en: 'Updated Title',
      };

      const result = await updateArticle(updateInput);
      expect(result).toBeNull();
    });

    it('should throw error for invalid country reference in update', async () => {
      const created = await createArticle(testArticleInput);

      const updateInput: UpdateArticleInput = {
        id: created.id,
        country_id: 999,
      };

      expect(updateArticle(updateInput)).rejects.toThrow(/Country with id 999 not found/i);
    });
  });

  describe('deleteArticle', () => {
    it('should delete article and return true', async () => {
      const created = await createArticle(testArticleInput);

      const result = await deleteArticle(created.id);

      expect(result).toEqual(true);

      // Verify article is deleted
      const article = await getArticleById(created.id);
      expect(article).toBeNull();
    });

    it('should return false for non-existent article', async () => {
      const result = await deleteArticle(999);
      expect(result).toEqual(false);
    });
  });
});