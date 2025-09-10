import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { countriesTable, universitiesTable, articlesTable } from '../db/schema';
import { type CreateCountryInput, type UpdateCountryInput, type GetCountriesInput } from '../schema';
import { 
  getCountries, 
  getCountryById, 
  getCountryBySlug, 
  createCountry, 
  updateCountry, 
  deleteCountry 
} from '../handlers/countries';
import { eq } from 'drizzle-orm';

// Test inputs with all required fields
const testCountryInput: CreateCountryInput = {
  name_ar: 'تركيا',
  name_en: 'Turkey',
  name_tr: 'Türkiye',
  name_ms: 'Turki',
  slug: 'turkey',
  description_ar: 'وصف تركيا',
  description_en: 'Turkey description',
  description_tr: 'Türkiye açıklaması',
  description_ms: 'Penerangan Turki',
  image_url: 'https://example.com/turkey.jpg',
  status: 'ACTIVE',
  meta_title_ar: 'عنوان تركيا',
  meta_title_en: 'Turkey Title',
  meta_title_tr: 'Türkiye Başlığı',
  meta_title_ms: 'Tajuk Turki',
  meta_description_ar: 'وصف ميتا تركيا',
  meta_description_en: 'Turkey meta description',
  meta_description_tr: 'Türkiye meta açıklaması',
  meta_description_ms: 'Meta penerangan Turki',
};

const secondCountryInput: CreateCountryInput = {
  name_ar: 'ماليزيا',
  name_en: 'Malaysia',
  name_tr: 'Malezya',
  name_ms: 'Malaysia',
  slug: 'malaysia',
  description_ar: 'وصف ماليزيا',
  description_en: 'Malaysia description',
  description_tr: 'Malezya açıklaması',
  description_ms: 'Penerangan Malaysia',
  status: 'INACTIVE',
};

describe('Countries Handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createCountry', () => {
    it('should create a country with all fields', async () => {
      const result = await createCountry(testCountryInput);

      expect(result.name_ar).toEqual('تركيا');
      expect(result.name_en).toEqual('Turkey');
      expect(result.name_tr).toEqual('Türkiye');
      expect(result.name_ms).toEqual('Turki');
      expect(result.slug).toEqual('turkey');
      expect(result.description_ar).toEqual('وصف تركيا');
      expect(result.status).toEqual('ACTIVE');
      expect(result.image_url).toEqual('https://example.com/turkey.jpg');
      expect(result.meta_title_en).toEqual('Turkey Title');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save country to database', async () => {
      const result = await createCountry(testCountryInput);

      const countries = await db.select()
        .from(countriesTable)
        .where(eq(countriesTable.id, result.id))
        .execute();

      expect(countries).toHaveLength(1);
      expect(countries[0].name_en).toEqual('Turkey');
      expect(countries[0].slug).toEqual('turkey');
      expect(countries[0].status).toEqual('ACTIVE');
    });

    it('should handle partial input with defaults', async () => {
      const minimalInput: CreateCountryInput = {
        name_ar: 'الأردن',
        name_en: 'Jordan',
        name_tr: 'Ürdün',
        name_ms: 'Jordan',
        slug: 'jordan',
        status: 'ACTIVE',
      };

      const result = await createCountry(minimalInput);

      expect(result.name_en).toEqual('Jordan');
      expect(result.description_ar).toBeNull();
      expect(result.image_url).toBeNull();
      expect(result.meta_title_en).toBeNull();
    });
  });

  describe('getCountryById', () => {
    it('should return country by ID', async () => {
      const created = await createCountry(testCountryInput);
      const result = await getCountryById(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.name_en).toEqual('Turkey');
      expect(result!.slug).toEqual('turkey');
    });

    it('should return null for non-existent ID', async () => {
      const result = await getCountryById(9999);
      expect(result).toBeNull();
    });
  });

  describe('getCountryBySlug', () => {
    it('should return country by slug', async () => {
      await createCountry(testCountryInput);
      const result = await getCountryBySlug('turkey');

      expect(result).not.toBeNull();
      expect(result!.slug).toEqual('turkey');
      expect(result!.name_en).toEqual('Turkey');
    });

    it('should return null for non-existent slug', async () => {
      const result = await getCountryBySlug('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getCountries', () => {
    beforeEach(async () => {
      await createCountry(testCountryInput);
      await createCountry(secondCountryInput);
    });

    it('should return all countries with pagination', async () => {
      const input: GetCountriesInput = {
        page: 1,
        limit: 20,
      };

      const result = await getCountries(input);

      expect(result.data).toHaveLength(2);
      expect(result.total).toEqual(2);
      expect(result.page).toEqual(1);
      expect(result.limit).toEqual(20);
    });

    it('should filter by status', async () => {
      const input: GetCountriesInput = {
        page: 1,
        limit: 20,
        status: 'ACTIVE',
      };

      const result = await getCountries(input);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toEqual('ACTIVE');
      expect(result.total).toEqual(1);
    });

    it('should search across multilingual fields', async () => {
      const input: GetCountriesInput = {
        page: 1,
        limit: 20,
        search: 'Turkey',
      };

      const result = await getCountries(input);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name_en).toEqual('Turkey');
    });

    it('should search by Arabic name', async () => {
      const input: GetCountriesInput = {
        page: 1,
        limit: 20,
        search: 'تركيا',
      };

      const result = await getCountries(input);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name_ar).toEqual('تركيا');
    });

    it('should search by slug', async () => {
      const input: GetCountriesInput = {
        page: 1,
        limit: 20,
        search: 'malaysia',
      };

      const result = await getCountries(input);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].slug).toEqual('malaysia');
    });

    it('should handle pagination correctly', async () => {
      const input: GetCountriesInput = {
        page: 1,
        limit: 1,
      };

      const result = await getCountries(input);

      expect(result.data).toHaveLength(1);
      expect(result.total).toEqual(2);
      expect(result.page).toEqual(1);
      expect(result.limit).toEqual(1);
    });

    it('should combine status filter and search', async () => {
      const input: GetCountriesInput = {
        page: 1,
        limit: 20,
        status: 'INACTIVE',
        search: 'Malaysia',
      };

      const result = await getCountries(input);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toEqual('INACTIVE');
      expect(result.data[0].name_en).toEqual('Malaysia');
    });
  });

  describe('updateCountry', () => {
    it('should update specific fields', async () => {
      const created = await createCountry(testCountryInput);
      
      const updateInput: UpdateCountryInput = {
        id: created.id,
        name_en: 'Updated Turkey',
        status: 'INACTIVE',
        description_en: 'Updated description',
      };

      const result = await updateCountry(updateInput);

      expect(result).not.toBeNull();
      expect(result!.name_en).toEqual('Updated Turkey');
      expect(result!.status).toEqual('INACTIVE');
      expect(result!.description_en).toEqual('Updated description');
      // Other fields should remain unchanged
      expect(result!.name_ar).toEqual('تركيا');
      expect(result!.slug).toEqual('turkey');
    });

    it('should update country in database', async () => {
      const created = await createCountry(testCountryInput);
      
      const updateInput: UpdateCountryInput = {
        id: created.id,
        name_en: 'Updated Turkey',
      };

      await updateCountry(updateInput);

      const updated = await db.select()
        .from(countriesTable)
        .where(eq(countriesTable.id, created.id))
        .execute();

      expect(updated[0].name_en).toEqual('Updated Turkey');
    });

    it('should return null for non-existent ID', async () => {
      const updateInput: UpdateCountryInput = {
        id: 9999,
        name_en: 'Non-existent',
      };

      const result = await updateCountry(updateInput);
      expect(result).toBeNull();
    });

    it('should handle null values correctly', async () => {
      const created = await createCountry(testCountryInput);
      
      const updateInput: UpdateCountryInput = {
        id: created.id,
        description_en: null,
        image_url: null,
      };

      const result = await updateCountry(updateInput);

      expect(result!.description_en).toBeNull();
      expect(result!.image_url).toBeNull();
    });
  });

  describe('deleteCountry', () => {
    it('should delete country when no dependencies exist', async () => {
      const created = await createCountry(testCountryInput);
      const result = await deleteCountry(created.id);

      expect(result).toBe(true);

      const countries = await db.select()
        .from(countriesTable)
        .where(eq(countriesTable.id, created.id))
        .execute();

      expect(countries).toHaveLength(0);
    });

    it('should return false for non-existent ID', async () => {
      const result = await deleteCountry(9999);
      expect(result).toBe(false);
    });

    it('should throw error when country has universities', async () => {
      const country = await createCountry(testCountryInput);
      
      // Create a university associated with this country
      await db.insert(universitiesTable).values({
        name_ar: 'جامعة تركية',
        name_en: 'Turkish University',
        name_tr: 'Türk Üniversitesi',
        name_ms: 'Universiti Turki',
        slug: 'turkish-university',
        country_id: country.id,
        status: 'ACTIVE',
      }).execute();

      await expect(deleteCountry(country.id)).rejects.toThrow(/cannot delete country/i);
    });

    it('should throw error when country has articles', async () => {
      const country = await createCountry(testCountryInput);
      
      // Create an article associated with this country
      await db.insert(articlesTable).values({
        title_ar: 'مقال تركي',
        title_en: 'Turkish Article',
        title_tr: 'Türk Makalesi',
        title_ms: 'Artikel Turki',
        slug: 'turkish-article',
        country_id: country.id,
        status: 'ACTIVE',
        is_featured: false,
      }).execute();

      await expect(deleteCountry(country.id)).rejects.toThrow(/cannot delete country/i);
    });
  });
});