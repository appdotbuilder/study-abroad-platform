import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { countriesTable, universitiesTable, majorsTable, universityMajorsTable } from '../db/schema';
import { type CreateUniversityMajorInput } from '../schema';
import {
  getUniversityMajors,
  getMajorUniversities,
  getUniversityMajorDetails,
  createUniversityMajor,
  updateUniversityMajor,
  deleteUniversityMajor
} from '../handlers/university-majors';
import { eq } from 'drizzle-orm';

describe('university-majors handlers', () => {
  let testCountryId: number;
  let testUniversityId: number;
  let testMajorId: number;
  let testUniversityId2: number;

  beforeEach(async () => {
    await createDB();

    // Create test country
    const countryResult = await db.insert(countriesTable)
      .values({
        name_ar: 'تركيا',
        name_en: 'Turkey',
        name_tr: 'Türkiye',
        name_ms: 'Turki',
        slug: 'turkey',
        status: 'ACTIVE'
      })
      .returning({ id: countriesTable.id })
      .execute();
    testCountryId = countryResult[0].id;

    // Create test universities
    const universityResults = await db.insert(universitiesTable)
      .values([
        {
          name_ar: 'جامعة إسطنبول',
          name_en: 'Istanbul University',
          name_tr: 'İstanbul Üniversitesi',
          name_ms: 'Universiti Istanbul',
          slug: 'istanbul-university',
          country_id: testCountryId,
          status: 'ACTIVE'
        },
        {
          name_ar: 'جامعة الشرق الأوسط التقنية',
          name_en: 'Middle East Technical University',
          name_tr: 'Orta Doğu Teknik Üniversitesi',
          name_ms: 'Universiti Teknikal Timur Tengah',
          slug: 'metu',
          country_id: testCountryId,
          status: 'ACTIVE'
        }
      ])
      .returning({ id: universitiesTable.id })
      .execute();
    testUniversityId = universityResults[0].id;
    testUniversityId2 = universityResults[1].id;

    // Create test major
    const majorResult = await db.insert(majorsTable)
      .values({
        name_ar: 'علوم الحاسوب',
        name_en: 'Computer Science',
        name_tr: 'Bilgisayar Bilimleri',
        name_ms: 'Sains Komputer',
        slug: 'computer-science',
        status: 'ACTIVE'
      })
      .returning({ id: majorsTable.id })
      .execute();
    testMajorId = majorResult[0].id;
  });

  afterEach(resetDB);

  describe('createUniversityMajor', () => {
    it('should create a university-major relationship', async () => {
      const input: CreateUniversityMajorInput = {
        university_id: testUniversityId,
        major_id: testMajorId,
        study_levels: ['BACHELOR', 'MASTER'],
        tuition_fee_min: 5000.50,
        tuition_fee_max: 8000.75,
        currency: 'USD',
        duration_years: 4,
        requirements_ar: 'متطلبات باللغة العربية',
        requirements_en: 'English requirements',
        requirements_tr: 'Türkçe gereksinimler',
        requirements_ms: 'Keperluan Bahasa Melayu'
      };

      const result = await createUniversityMajor(input);

      expect(result.university_id).toEqual(testUniversityId);
      expect(result.major_id).toEqual(testMajorId);
      expect(result.study_levels).toEqual(['BACHELOR', 'MASTER']);
      expect(result.tuition_fee_min).toEqual(5000.50);
      expect(result.tuition_fee_max).toEqual(8000.75);
      expect(result.currency).toEqual('USD');
      expect(result.duration_years).toEqual(4);
      expect(result.requirements_ar).toEqual('متطلبات باللغة العربية');
      expect(result.requirements_en).toEqual('English requirements');
      expect(result.requirements_tr).toEqual('Türkçe gereksinimler');
      expect(result.requirements_ms).toEqual('Keperluan Bahasa Melayu');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create university-major with minimal data', async () => {
      const input: CreateUniversityMajorInput = {
        university_id: testUniversityId,
        major_id: testMajorId,
        study_levels: ['BACHELOR']
      };

      const result = await createUniversityMajor(input);

      expect(result.university_id).toEqual(testUniversityId);
      expect(result.major_id).toEqual(testMajorId);
      expect(result.study_levels).toEqual(['BACHELOR']);
      expect(result.tuition_fee_min).toBeNull();
      expect(result.tuition_fee_max).toBeNull();
      expect(result.currency).toBeNull();
      expect(result.duration_years).toBeNull();
      expect(result.requirements_ar).toBeNull();
      expect(result.requirements_en).toBeNull();
      expect(result.requirements_tr).toBeNull();
      expect(result.requirements_ms).toBeNull();
    });

    it('should save university-major to database with correct numeric conversions', async () => {
      const input: CreateUniversityMajorInput = {
        university_id: testUniversityId,
        major_id: testMajorId,
        study_levels: ['MASTER'],
        tuition_fee_min: 10000.99,
        tuition_fee_max: 15000.50
      };

      const result = await createUniversityMajor(input);

      // Verify in database
      const dbResult = await db.select()
        .from(universityMajorsTable)
        .where(eq(universityMajorsTable.id, result.id))
        .execute();

      expect(dbResult).toHaveLength(1);
      expect(dbResult[0].university_id).toEqual(testUniversityId);
      expect(dbResult[0].major_id).toEqual(testMajorId);
      expect(dbResult[0].study_levels).toEqual(['MASTER']);
      expect(parseFloat(dbResult[0].tuition_fee_min!)).toEqual(10000.99);
      expect(parseFloat(dbResult[0].tuition_fee_max!)).toEqual(15000.50);
    });

    it('should throw error for non-existent university', async () => {
      const input: CreateUniversityMajorInput = {
        university_id: 99999,
        major_id: testMajorId,
        study_levels: ['BACHELOR']
      };

      await expect(createUniversityMajor(input)).rejects.toThrow(/University with ID 99999 does not exist/i);
    });

    it('should throw error for non-existent major', async () => {
      const input: CreateUniversityMajorInput = {
        university_id: testUniversityId,
        major_id: 99999,
        study_levels: ['BACHELOR']
      };

      await expect(createUniversityMajor(input)).rejects.toThrow(/Major with ID 99999 does not exist/i);
    });

    it('should handle duplicate university-major relationship', async () => {
      const input: CreateUniversityMajorInput = {
        university_id: testUniversityId,
        major_id: testMajorId,
        study_levels: ['BACHELOR']
      };

      // Create first relationship
      await createUniversityMajor(input);

      // Attempt to create duplicate
      await expect(createUniversityMajor(input)).rejects.toThrow();
    });
  });

  describe('getUniversityMajors', () => {
    beforeEach(async () => {
      // Create test relationships
      await db.insert(universityMajorsTable)
        .values([
          {
            university_id: testUniversityId,
            major_id: testMajorId,
            study_levels: ['BACHELOR', 'MASTER'],
            tuition_fee_min: '5000.50',
            tuition_fee_max: '8000.75',
            currency: 'USD'
          }
        ])
        .execute();
    });

    it('should get all majors for a university', async () => {
      const result = await getUniversityMajors(testUniversityId);

      expect(result).toHaveLength(1);
      expect(result[0].university_id).toEqual(testUniversityId);
      expect(result[0].major_id).toEqual(testMajorId);
      expect(result[0].study_levels).toEqual(['BACHELOR', 'MASTER']);
      expect(result[0].tuition_fee_min).toEqual(5000.50);
      expect(result[0].tuition_fee_max).toEqual(8000.75);
      expect(result[0].currency).toEqual('USD');
    });

    it('should return empty array for university with no majors', async () => {
      const result = await getUniversityMajors(testUniversityId2);

      expect(result).toHaveLength(0);
    });

    it('should return empty array for non-existent university', async () => {
      const result = await getUniversityMajors(99999);

      expect(result).toHaveLength(0);
    });
  });

  describe('getMajorUniversities', () => {
    beforeEach(async () => {
      // Create test relationships for multiple universities
      await db.insert(universityMajorsTable)
        .values([
          {
            university_id: testUniversityId,
            major_id: testMajorId,
            study_levels: ['BACHELOR'],
            tuition_fee_min: '5000.00'
          },
          {
            university_id: testUniversityId2,
            major_id: testMajorId,
            study_levels: ['MASTER'],
            tuition_fee_max: '10000.00'
          }
        ])
        .execute();
    });

    it('should get all universities offering a major', async () => {
      const result = await getMajorUniversities(testMajorId);

      expect(result).toHaveLength(2);
      expect(result.map(r => r.university_id).sort()).toEqual([testUniversityId, testUniversityId2].sort());
      expect(result.find(r => r.university_id === testUniversityId)?.study_levels).toEqual(['BACHELOR']);
      expect(result.find(r => r.university_id === testUniversityId2)?.study_levels).toEqual(['MASTER']);
    });

    it('should return empty array for major with no universities', async () => {
      // Create another major without relationships
      const anotherMajor = await db.insert(majorsTable)
        .values({
          name_ar: 'رياضيات',
          name_en: 'Mathematics',
          name_tr: 'Matematik',
          name_ms: 'Matematik',
          slug: 'mathematics',
          status: 'ACTIVE'
        })
        .returning({ id: majorsTable.id })
        .execute();

      const result = await getMajorUniversities(anotherMajor[0].id);

      expect(result).toHaveLength(0);
    });
  });

  describe('getUniversityMajorDetails', () => {
    beforeEach(async () => {
      await db.insert(universityMajorsTable)
        .values({
          university_id: testUniversityId,
          major_id: testMajorId,
          study_levels: ['BACHELOR', 'MASTER'],
          tuition_fee_min: '6000.25',
          tuition_fee_max: '9000.50',
          currency: 'EUR',
          duration_years: 4,
          requirements_en: 'High school diploma required'
        })
        .execute();
    });

    it('should get specific university-major details', async () => {
      const result = await getUniversityMajorDetails(testUniversityId, testMajorId);

      expect(result).not.toBeNull();
      expect(result!.university_id).toEqual(testUniversityId);
      expect(result!.major_id).toEqual(testMajorId);
      expect(result!.study_levels).toEqual(['BACHELOR', 'MASTER']);
      expect(result!.tuition_fee_min).toEqual(6000.25);
      expect(result!.tuition_fee_max).toEqual(9000.50);
      expect(result!.currency).toEqual('EUR');
      expect(result!.duration_years).toEqual(4);
      expect(result!.requirements_en).toEqual('High school diploma required');
    });

    it('should return null for non-existent relationship', async () => {
      const result = await getUniversityMajorDetails(testUniversityId2, testMajorId);

      expect(result).toBeNull();
    });

    it('should return null for invalid university-major combination', async () => {
      const result = await getUniversityMajorDetails(99999, 99999);

      expect(result).toBeNull();
    });
  });

  describe('updateUniversityMajor', () => {
    let relationshipId: number;

    beforeEach(async () => {
      const result = await db.insert(universityMajorsTable)
        .values({
          university_id: testUniversityId,
          major_id: testMajorId,
          study_levels: ['BACHELOR'],
          tuition_fee_min: '5000.00',
          currency: 'USD',
          duration_years: 4
        })
        .returning({ id: universityMajorsTable.id })
        .execute();
      relationshipId = result[0].id;
    });

    it('should update university-major relationship', async () => {
      const updateInput = {
        study_levels: ['BACHELOR', 'MASTER'] as ('DIPLOMA' | 'BACHELOR' | 'MASTER' | 'PHD')[],
        tuition_fee_min: 6000.50,
        tuition_fee_max: 10000.00,
        currency: 'EUR',
        requirements_en: 'Updated requirements'
      };

      const result = await updateUniversityMajor(testUniversityId, testMajorId, updateInput);

      expect(result).not.toBeNull();
      expect(result!.study_levels).toEqual(['BACHELOR', 'MASTER']);
      expect(result!.tuition_fee_min).toEqual(6000.50);
      expect(result!.tuition_fee_max).toEqual(10000.00);
      expect(result!.currency).toEqual('EUR');
      expect(result!.requirements_en).toEqual('Updated requirements');
      expect(result!.duration_years).toEqual(4); // Should remain unchanged
    });

    it('should update partial fields', async () => {
      const updateInput = {
        currency: 'GBP',
        duration_years: 3
      };

      const result = await updateUniversityMajor(testUniversityId, testMajorId, updateInput);

      expect(result).not.toBeNull();
      expect(result!.currency).toEqual('GBP');
      expect(result!.duration_years).toEqual(3);
      expect(result!.study_levels).toEqual(['BACHELOR']); // Should remain unchanged
      expect(result!.tuition_fee_min).toEqual(5000.00); // Should remain unchanged
    });

    it('should handle null values correctly', async () => {
      const updateInput = {
        tuition_fee_max: null,
        requirements_en: null
      };

      const result = await updateUniversityMajor(testUniversityId, testMajorId, updateInput);

      expect(result).not.toBeNull();
      expect(result!.tuition_fee_max).toBeNull();
      expect(result!.requirements_en).toBeNull();
    });

    it('should return null for non-existent relationship', async () => {
      const updateInput = { currency: 'EUR' };

      const result = await updateUniversityMajor(testUniversityId2, testMajorId, updateInput);

      expect(result).toBeNull();
    });

    it('should return current record when no updates provided', async () => {
      const result = await updateUniversityMajor(testUniversityId, testMajorId, {});

      expect(result).not.toBeNull();
      expect(result!.university_id).toEqual(testUniversityId);
      expect(result!.major_id).toEqual(testMajorId);
      expect(result!.study_levels).toEqual(['BACHELOR']);
    });
  });

  describe('deleteUniversityMajor', () => {
    beforeEach(async () => {
      await db.insert(universityMajorsTable)
        .values({
          university_id: testUniversityId,
          major_id: testMajorId,
          study_levels: ['BACHELOR']
        })
        .execute();
    });

    it('should delete university-major relationship', async () => {
      const result = await deleteUniversityMajor(testUniversityId, testMajorId);

      expect(result).toBe(true);

      // Verify deletion
      const remainingRecords = await db.select()
        .from(universityMajorsTable)
        .where(eq(universityMajorsTable.university_id, testUniversityId))
        .execute();

      expect(remainingRecords).toHaveLength(0);
    });

    it('should return false for non-existent relationship', async () => {
      const result = await deleteUniversityMajor(testUniversityId2, testMajorId);

      expect(result).toBe(false);
    });

    it('should return false for invalid university-major combination', async () => {
      const result = await deleteUniversityMajor(99999, 99999);

      expect(result).toBe(false);
    });
  });
});