import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { countriesTable, universitiesTable } from '../db/schema';
import { 
  type CreateUniversityInput, 
  type UpdateUniversityInput,
  type GetUniversitiesInput 
} from '../schema';
import {
  getUniversities,
  getUniversityById,
  getUniversityBySlug,
  getUniversitiesByCountry,
  createUniversity,
  updateUniversity,
  deleteUniversity
} from '../handlers/universities';
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

const testUniversityInput: CreateUniversityInput = {
  name_ar: 'جامعة اسطنبول التقنية',
  name_en: 'Istanbul Technical University',
  name_tr: 'İstanbul Teknik Üniversitesi',
  name_ms: 'Universiti Teknikal Istanbul',
  slug: 'istanbul-technical-university',
  country_id: 1, // Will be set dynamically in tests
  global_ranking: 100,
  local_ranking: 5,
  teaching_language_ar: 'التركية والإنجليزية',
  teaching_language_en: 'Turkish and English',
  teaching_language_tr: 'Türkçe ve İngilizce',
  teaching_language_ms: 'Turki dan Inggeris',
  description_ar: 'جامعة تقنية رائدة في تركيا',
  description_en: 'A leading technical university in Turkey',
  description_tr: 'Türkiye\'nin önde gelen teknik üniversitesi',
  description_ms: 'Universiti teknikal terkemuka di Turki',
  image_url: 'https://example.com/itu-logo.jpg',
  gallery_images: ['https://example.com/itu-1.jpg', 'https://example.com/itu-2.jpg'],
  status: 'ACTIVE',
  meta_title_en: 'Istanbul Technical University - Study in Turkey',
  meta_description_en: 'Learn about Istanbul Technical University programs and admission requirements',
};

const testUniversityInput2: CreateUniversityInput = {
  name_ar: 'جامعة البوسفور',
  name_en: 'Bogazici University',
  name_tr: 'Boğaziçi Üniversitesi',
  name_ms: 'Universiti Bogazici',
  slug: 'bogazici-university',
  country_id: 1, // Will be set dynamically in tests
  global_ranking: 50,
  local_ranking: 1,
  status: 'ACTIVE',
};

describe('Universities Handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test country
  const createTestCountry = async () => {
    const result = await db.insert(countriesTable)
      .values(testCountry)
      .returning()
      .execute();
    return result[0];
  };

  describe('createUniversity', () => {
    it('should create a university successfully', async () => {
      const country = await createTestCountry();
      const input = { ...testUniversityInput, country_id: country.id };
      
      const result = await createUniversity(input);
      
      expect(result.name_en).toEqual('Istanbul Technical University');
      expect(result.name_ar).toEqual('جامعة اسطنبول التقنية');
      expect(result.slug).toEqual('istanbul-technical-university');
      expect(result.country_id).toEqual(country.id);
      expect(result.global_ranking).toEqual(100);
      expect(result.local_ranking).toEqual(5);
      expect(result.status).toEqual('ACTIVE');
      expect(result.gallery_images).toEqual(['https://example.com/itu-1.jpg', 'https://example.com/itu-2.jpg']);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save university to database', async () => {
      const country = await createTestCountry();
      const input = { ...testUniversityInput, country_id: country.id };
      
      const result = await createUniversity(input);
      
      const universities = await db.select()
        .from(universitiesTable)
        .where(eq(universitiesTable.id, result.id))
        .execute();
      
      expect(universities).toHaveLength(1);
      expect(universities[0].name_en).toEqual('Istanbul Technical University');
      expect(universities[0].country_id).toEqual(country.id);
      expect(universities[0].global_ranking).toEqual(100);
    });

    it('should throw error for non-existent country', async () => {
      const input = { ...testUniversityInput, country_id: 9999 };
      
      await expect(createUniversity(input)).rejects.toThrow(/Country with ID 9999 does not exist/);
    });

    it('should handle minimal required fields', async () => {
      const country = await createTestCountry();
      const minimalInput: CreateUniversityInput = {
        name_ar: 'جامعة',
        name_en: 'University',
        name_tr: 'Üniversite',
        name_ms: 'Universiti',
        slug: 'test-university',
        country_id: country.id,
        status: 'ACTIVE',
      };
      
      const result = await createUniversity(minimalInput);
      
      expect(result.name_en).toEqual('University');
      expect(result.global_ranking).toBeNull();
      expect(result.local_ranking).toBeNull();
      expect(result.gallery_images).toBeNull();
    });
  });

  describe('getUniversityById', () => {
    it('should return university by ID', async () => {
      const country = await createTestCountry();
      const input = { ...testUniversityInput, country_id: country.id };
      const created = await createUniversity(input);
      
      const result = await getUniversityById(created.id);
      
      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.name_en).toEqual('Istanbul Technical University');
      expect(result!.country_id).toEqual(country.id);
    });

    it('should return null for non-existent ID', async () => {
      const result = await getUniversityById(9999);
      
      expect(result).toBeNull();
    });
  });

  describe('getUniversityBySlug', () => {
    it('should return university by slug', async () => {
      const country = await createTestCountry();
      const input = { ...testUniversityInput, country_id: country.id };
      const created = await createUniversity(input);
      
      const result = await getUniversityBySlug(created.slug);
      
      expect(result).not.toBeNull();
      expect(result!.slug).toEqual('istanbul-technical-university');
      expect(result!.name_en).toEqual('Istanbul Technical University');
    });

    it('should return null for non-existent slug', async () => {
      const result = await getUniversityBySlug('non-existent-university');
      
      expect(result).toBeNull();
    });
  });

  describe('getUniversitiesByCountry', () => {
    it('should return universities for specific country', async () => {
      const country = await createTestCountry();
      const input1 = { ...testUniversityInput, country_id: country.id };
      const input2 = { ...testUniversityInput2, country_id: country.id };
      
      await createUniversity(input1);
      await createUniversity(input2);
      
      const result = await getUniversitiesByCountry(country.id);
      
      expect(result).toHaveLength(2);
      expect(result.some(u => u.name_en === 'Istanbul Technical University')).toBe(true);
      expect(result.some(u => u.name_en === 'Bogazici University')).toBe(true);
      // Should be ordered by created_at desc (most recent first)
      expect(result[0].name_en).toEqual('Bogazici University'); // Created second
    });

    it('should return empty array for country with no universities', async () => {
      const country = await createTestCountry();
      
      const result = await getUniversitiesByCountry(country.id);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('getUniversities', () => {
    const setupTestUniversities = async () => {
      const country1 = await createTestCountry();
      const country2 = await db.insert(countriesTable)
        .values({ ...testCountry, slug: 'usa', name_en: 'USA' })
        .returning()
        .execute();

      const input1 = { ...testUniversityInput, country_id: country1.id };
      const input2 = { ...testUniversityInput2, country_id: country1.id };
      const input3 = { 
        ...testUniversityInput, 
        name_en: 'Harvard University',
        slug: 'harvard-university',
        country_id: country2[0].id,
        status: 'INACTIVE' as const
      };
      
      await createUniversity(input1);
      await createUniversity(input2);
      await createUniversity(input3);
      
      return { country1, country2: country2[0] };
    };

    it('should return paginated universities', async () => {
      await setupTestUniversities();
      
      const input: GetUniversitiesInput = {
        page: 1,
        limit: 2,
      };
      
      const result = await getUniversities(input);
      
      expect(result.data).toHaveLength(2);
      expect(result.total).toEqual(3);
      expect(result.page).toEqual(1);
      expect(result.limit).toEqual(2);
    });

    it('should filter by country_id', async () => {
      const { country1 } = await setupTestUniversities();
      
      const input: GetUniversitiesInput = {
        page: 1,
        limit: 10,
        country_id: country1.id,
      };
      
      const result = await getUniversities(input);
      
      expect(result.data).toHaveLength(2);
      expect(result.total).toEqual(2);
      expect(result.data.every(u => u.country_id === country1.id)).toBe(true);
    });

    it('should filter by status', async () => {
      await setupTestUniversities();
      
      const input: GetUniversitiesInput = {
        page: 1,
        limit: 10,
        status: 'ACTIVE',
      };
      
      const result = await getUniversities(input);
      
      expect(result.data).toHaveLength(2);
      expect(result.total).toEqual(2);
      expect(result.data.every(u => u.status === 'ACTIVE')).toBe(true);
    });

    it('should filter by search term', async () => {
      await setupTestUniversities();
      
      const input: GetUniversitiesInput = {
        page: 1,
        limit: 10,
        search: 'Technical',
      };
      
      const result = await getUniversities(input);
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name_en).toEqual('Istanbul Technical University');
    });

    it('should combine multiple filters', async () => {
      const { country1 } = await setupTestUniversities();
      
      const input: GetUniversitiesInput = {
        page: 1,
        limit: 10,
        country_id: country1.id,
        status: 'ACTIVE',
        search: 'Bogazici',
      };
      
      const result = await getUniversities(input);
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name_en).toEqual('Bogazici University');
    });

    it('should return empty results when no matches', async () => {
      await setupTestUniversities();
      
      const input: GetUniversitiesInput = {
        page: 1,
        limit: 10,
        search: 'NonExistentUniversity',
      };
      
      const result = await getUniversities(input);
      
      expect(result.data).toHaveLength(0);
      expect(result.total).toEqual(0);
    });
  });

  describe('updateUniversity', () => {
    it('should update university successfully', async () => {
      const country = await createTestCountry();
      const input = { ...testUniversityInput, country_id: country.id };
      const created = await createUniversity(input);
      
      const updateInput: UpdateUniversityInput = {
        id: created.id,
        name_en: 'Updated University Name',
        global_ranking: 75,
        status: 'INACTIVE',
      };
      
      const result = await updateUniversity(updateInput);
      
      expect(result).not.toBeNull();
      expect(result!.name_en).toEqual('Updated University Name');
      expect(result!.global_ranking).toEqual(75);
      expect(result!.status).toEqual('INACTIVE');
      // Other fields should remain unchanged
      expect(result!.name_ar).toEqual('جامعة اسطنبول التقنية');
      expect(result!.country_id).toEqual(country.id);
    });

    it('should update country_id with validation', async () => {
      const country1 = await createTestCountry();
      const country2 = await db.insert(countriesTable)
        .values({ ...testCountry, slug: 'usa', name_en: 'USA' })
        .returning()
        .execute();
      
      const input = { ...testUniversityInput, country_id: country1.id };
      const created = await createUniversity(input);
      
      const updateInput: UpdateUniversityInput = {
        id: created.id,
        country_id: country2[0].id,
      };
      
      const result = await updateUniversity(updateInput);
      
      expect(result).not.toBeNull();
      expect(result!.country_id).toEqual(country2[0].id);
    });

    it('should return null for non-existent university', async () => {
      const updateInput: UpdateUniversityInput = {
        id: 9999,
        name_en: 'Updated Name',
      };
      
      const result = await updateUniversity(updateInput);
      
      expect(result).toBeNull();
    });

    it('should throw error for non-existent country', async () => {
      const country = await createTestCountry();
      const input = { ...testUniversityInput, country_id: country.id };
      const created = await createUniversity(input);
      
      const updateInput: UpdateUniversityInput = {
        id: created.id,
        country_id: 9999,
      };
      
      await expect(updateUniversity(updateInput)).rejects.toThrow(/Country with ID 9999 does not exist/);
    });
  });

  describe('deleteUniversity', () => {
    it('should delete university successfully', async () => {
      const country = await createTestCountry();
      const input = { ...testUniversityInput, country_id: country.id };
      const created = await createUniversity(input);
      
      const result = await deleteUniversity(created.id);
      
      expect(result).toBe(true);
      
      // Verify deletion
      const deleted = await getUniversityById(created.id);
      expect(deleted).toBeNull();
    });

    it('should return false for non-existent university', async () => {
      const result = await deleteUniversity(9999);
      
      expect(result).toBe(false);
    });
  });
});