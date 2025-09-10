import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { majorsTable, countriesTable, universitiesTable, universityMajorsTable, articlesTable } from '../db/schema';
import { 
  type CreateMajorInput, 
  type UpdateMajorInput,
  type GetMajorsInput 
} from '../schema';
import {
  getMajors,
  getMajorById,
  getMajorBySlug,
  getMajorsByUniversity,
  createMajor,
  updateMajor,
  deleteMajor
} from '../handlers/majors';
import { eq } from 'drizzle-orm';

// Test data
const testMajor: CreateMajorInput = {
  name_ar: 'هندسة الحاسوب',
  name_en: 'Computer Engineering',
  name_tr: 'Bilgisayar Mühendisliği',
  name_ms: 'Kejuruteraan Komputer',
  slug: 'computer-engineering',
  description_ar: 'وصف هندسة الحاسوب',
  description_en: 'Computer Engineering Description',
  description_tr: 'Bilgisayar Mühendisliği Açıklaması',
  description_ms: 'Penerangan Kejuruteraan Komputer',
  future_opportunities_ar: 'فرص مستقبلية',
  future_opportunities_en: 'Future opportunities',
  future_opportunities_tr: 'Gelecek fırsatları',
  future_opportunities_ms: 'Peluang masa depan',
  image_url: 'https://example.com/image.jpg',
  status: 'ACTIVE',
  meta_title_ar: 'عنوان تحسين محركات البحث',
  meta_title_en: 'SEO Title',
  meta_title_tr: 'SEO Başlığı',
  meta_title_ms: 'Tajuk SEO',
  meta_description_ar: 'وصف تحسين محركات البحث',
  meta_description_en: 'SEO Description',
  meta_description_tr: 'SEO Açıklaması',
  meta_description_ms: 'Penerangan SEO',
};

const testCountry = {
  name_ar: 'تركيا',
  name_en: 'Turkey',
  name_tr: 'Türkiye',
  name_ms: 'Turki',
  slug: 'turkey',
  status: 'ACTIVE' as const,
};

const testUniversity = {
  name_ar: 'جامعة اسطنبول',
  name_en: 'Istanbul University',
  name_tr: 'İstanbul Üniversitesi',
  name_ms: 'Universiti Istanbul',
  slug: 'istanbul-university',
  country_id: 1,
  status: 'ACTIVE' as const,
};

describe('Majors Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createMajor', () => {
    it('should create a major successfully', async () => {
      const result = await createMajor(testMajor);

      expect(result.name_ar).toEqual('هندسة الحاسوب');
      expect(result.name_en).toEqual('Computer Engineering');
      expect(result.name_tr).toEqual('Bilgisayar Mühendisliği');
      expect(result.name_ms).toEqual('Kejuruteraan Komputer');
      expect(result.slug).toEqual('computer-engineering');
      expect(result.status).toEqual('ACTIVE');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save major to database', async () => {
      const result = await createMajor(testMajor);

      const majors = await db.select()
        .from(majorsTable)
        .where(eq(majorsTable.id, result.id))
        .execute();

      expect(majors).toHaveLength(1);
      expect(majors[0].name_en).toEqual('Computer Engineering');
      expect(majors[0].slug).toEqual('computer-engineering');
      expect(majors[0].status).toEqual('ACTIVE');
    });

    it('should create major with minimal data', async () => {
      const minimalMajor: CreateMajorInput = {
        name_ar: 'تخصص بسيط',
        name_en: 'Simple Major',
        name_tr: 'Basit Bölüm',
        name_ms: 'Jurusan Mudah',
        slug: 'simple-major',
        status: 'ACTIVE',
      };

      const result = await createMajor(minimalMajor);

      expect(result.name_en).toEqual('Simple Major');
      expect(result.description_ar).toBeNull();
      expect(result.image_url).toBeNull();
      expect(result.status).toEqual('ACTIVE');
    });
  });

  describe('getMajorById', () => {
    it('should get major by ID', async () => {
      const created = await createMajor(testMajor);
      const result = await getMajorById(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.name_en).toEqual('Computer Engineering');
      expect(result!.slug).toEqual('computer-engineering');
    });

    it('should return null for non-existent ID', async () => {
      const result = await getMajorById(99999);
      expect(result).toBeNull();
    });
  });

  describe('getMajorBySlug', () => {
    it('should get active major by slug', async () => {
      await createMajor(testMajor);
      const result = await getMajorBySlug('computer-engineering');

      expect(result).not.toBeNull();
      expect(result!.slug).toEqual('computer-engineering');
      expect(result!.name_en).toEqual('Computer Engineering');
      expect(result!.status).toEqual('ACTIVE');
    });

    it('should not return inactive major by slug', async () => {
      const inactiveMajor = { ...testMajor, status: 'INACTIVE' as const };
      await createMajor(inactiveMajor);
      
      const result = await getMajorBySlug('computer-engineering');
      expect(result).toBeNull();
    });

    it('should return null for non-existent slug', async () => {
      const result = await getMajorBySlug('non-existent-slug');
      expect(result).toBeNull();
    });
  });

  describe('getMajors', () => {
    beforeEach(async () => {
      // Create test majors
      await createMajor(testMajor);
      await createMajor({
        ...testMajor,
        name_ar: 'الطب',
        name_en: 'Medicine',
        name_tr: 'Tıp',
        name_ms: 'Perubatan',
        slug: 'medicine',
      });
      await createMajor({
        ...testMajor,
        name_ar: 'الهندسة المدنية',
        name_en: 'Civil Engineering',
        name_tr: 'İnşaat Mühendisliği',
        name_ms: 'Kejuruteraan Awam',
        slug: 'civil-engineering',
        status: 'INACTIVE',
      });
    });

    it('should get all majors with pagination', async () => {
      const input: GetMajorsInput = {
        page: 1,
        limit: 20,
      };

      const result = await getMajors(input);

      expect(result.data).toHaveLength(3);
      expect(result.total).toEqual(3);
      expect(result.page).toEqual(1);
      expect(result.limit).toEqual(20);
    });

    it('should filter majors by status', async () => {
      const input: GetMajorsInput = {
        page: 1,
        limit: 20,
        status: 'ACTIVE',
      };

      const result = await getMajors(input);

      expect(result.data).toHaveLength(2);
      expect(result.total).toEqual(2);
      result.data.forEach(major => {
        expect(major.status).toEqual('ACTIVE');
      });
    });

    it('should search majors by name', async () => {
      const input: GetMajorsInput = {
        page: 1,
        limit: 20,
        search: 'Engineering',
      };

      const result = await getMajors(input);

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach(major => {
        const hasSearchTerm = 
          major.name_en.toLowerCase().includes('engineering') ||
          major.slug.includes('engineering');
        expect(hasSearchTerm).toBe(true);
      });
    });

    it('should handle pagination correctly', async () => {
      const input: GetMajorsInput = {
        page: 2,
        limit: 1,
      };

      const result = await getMajors(input);

      expect(result.data).toHaveLength(1);
      expect(result.total).toEqual(3);
      expect(result.page).toEqual(2);
      expect(result.limit).toEqual(1);
    });

    it('should filter majors by university', async () => {
      // Create prerequisite data
      const country = await db.insert(countriesTable).values(testCountry).returning().execute();
      const university = await db.insert(universitiesTable).values({
        ...testUniversity,
        country_id: country[0].id,
      }).returning().execute();

      // Get created majors
      const allMajors = await getMajors({ page: 1, limit: 20 });
      const computerMajor = allMajors.data.find(m => m.slug === 'computer-engineering')!;
      const medicineMajor = allMajors.data.find(m => m.slug === 'medicine')!;

      // Associate majors with university
      await db.insert(universityMajorsTable).values([
        {
          university_id: university[0].id,
          major_id: computerMajor.id,
          study_levels: ['BACHELOR', 'MASTER'],
        },
        {
          university_id: university[0].id,
          major_id: medicineMajor.id,
          study_levels: ['BACHELOR'],
        }
      ]).execute();

      const input: GetMajorsInput = {
        page: 1,
        limit: 20,
        university_id: university[0].id,
      };

      const result = await getMajors(input);

      expect(result.data).toHaveLength(2);
      expect(result.total).toEqual(2);
      
      const majorSlugs = result.data.map(m => m.slug);
      expect(majorSlugs).toContain('computer-engineering');
      expect(majorSlugs).toContain('medicine');
    });
  });

  describe('getMajorsByUniversity', () => {
    it('should get majors by university ID', async () => {
      // Create prerequisite data
      const country = await db.insert(countriesTable).values(testCountry).returning().execute();
      const university = await db.insert(universitiesTable).values({
        ...testUniversity,
        country_id: country[0].id,
      }).returning().execute();

      // Create majors
      const computerMajor = await createMajor(testMajor);
      const medicineMajor = await createMajor({
        ...testMajor,
        name_en: 'Medicine',
        slug: 'medicine',
      });

      // Associate with university
      await db.insert(universityMajorsTable).values([
        {
          university_id: university[0].id,
          major_id: computerMajor.id,
          study_levels: ['BACHELOR'],
        },
        {
          university_id: university[0].id,
          major_id: medicineMajor.id,
          study_levels: ['BACHELOR'],
        }
      ]).execute();

      const result = await getMajorsByUniversity(university[0].id);

      expect(result).toHaveLength(2);
      const majorNames = result.map(m => m.name_en);
      expect(majorNames).toContain('Computer Engineering');
      expect(majorNames).toContain('Medicine');
    });

    it('should only return active majors', async () => {
      const country = await db.insert(countriesTable).values(testCountry).returning().execute();
      const university = await db.insert(universitiesTable).values({
        ...testUniversity,
        country_id: country[0].id,
      }).returning().execute();

      const activeMajor = await createMajor(testMajor);
      const inactiveMajor = await createMajor({
        ...testMajor,
        name_en: 'Inactive Major',
        slug: 'inactive-major',
        status: 'INACTIVE',
      });

      await db.insert(universityMajorsTable).values([
        {
          university_id: university[0].id,
          major_id: activeMajor.id,
          study_levels: ['BACHELOR'],
        },
        {
          university_id: university[0].id,
          major_id: inactiveMajor.id,
          study_levels: ['BACHELOR'],
        }
      ]).execute();

      const result = await getMajorsByUniversity(university[0].id);

      expect(result).toHaveLength(1);
      expect(result[0].name_en).toEqual('Computer Engineering');
      expect(result[0].status).toEqual('ACTIVE');
    });

    it('should return empty array for university with no majors', async () => {
      const result = await getMajorsByUniversity(99999);
      expect(result).toHaveLength(0);
    });
  });

  describe('updateMajor', () => {
    it('should update major successfully', async () => {
      const created = await createMajor(testMajor);

      const updateInput: UpdateMajorInput = {
        id: created.id,
        name_en: 'Updated Computer Engineering',
        description_en: 'Updated description',
        status: 'INACTIVE',
      };

      const result = await updateMajor(updateInput);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.name_en).toEqual('Updated Computer Engineering');
      expect(result!.description_en).toEqual('Updated description');
      expect(result!.status).toEqual('INACTIVE');
      expect(result!.name_ar).toEqual(testMajor.name_ar); // Unchanged
    });

    it('should return null for non-existent major', async () => {
      const updateInput: UpdateMajorInput = {
        id: 99999,
        name_en: 'Non-existent major',
      };

      const result = await updateMajor(updateInput);
      expect(result).toBeNull();
    });

    it('should update only specified fields', async () => {
      const created = await createMajor(testMajor);

      const updateInput: UpdateMajorInput = {
        id: created.id,
        name_en: 'Partially Updated',
      };

      const result = await updateMajor(updateInput);

      expect(result!.name_en).toEqual('Partially Updated');
      expect(result!.name_ar).toEqual(testMajor.name_ar);
      expect(result!.slug).toEqual(testMajor.slug);
    });
  });

  describe('deleteMajor', () => {
    it('should delete major successfully', async () => {
      const created = await createMajor(testMajor);

      const result = await deleteMajor(created.id);

      expect(result).toBe(true);

      // Verify deletion
      const deletedMajor = await getMajorById(created.id);
      expect(deletedMajor).toBeNull();
    });

    it('should return false for non-existent major', async () => {
      const result = await deleteMajor(99999);
      expect(result).toBe(false);
    });

    it('should prevent deletion when major is referenced by university_majors', async () => {
      const country = await db.insert(countriesTable).values(testCountry).returning().execute();
      const university = await db.insert(universitiesTable).values({
        ...testUniversity,
        country_id: country[0].id,
      }).returning().execute();

      const major = await createMajor(testMajor);

      await db.insert(universityMajorsTable).values({
        university_id: university[0].id,
        major_id: major.id,
        study_levels: ['BACHELOR'],
      }).execute();

      await expect(deleteMajor(major.id)).rejects.toThrow(/referenced by universities/i);
    });

    it('should prevent deletion when major is referenced by articles', async () => {
      const country = await db.insert(countriesTable).values(testCountry).returning().execute();
      const major = await createMajor(testMajor);

      await db.insert(articlesTable).values({
        title_ar: 'مقال تجريبي',
        title_en: 'Test Article',
        title_tr: 'Test Makalesi',
        title_ms: 'Artikel Ujian',
        slug: 'test-article',
        country_id: country[0].id,
        major_id: major.id,
        status: 'ACTIVE',
        is_featured: false,
      }).execute();

      await expect(deleteMajor(major.id)).rejects.toThrow(/referenced by articles/i);
    });
  });
});