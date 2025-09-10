import { db } from '../db';
import { universityMajorsTable, universitiesTable, majorsTable } from '../db/schema';
import { 
  type UniversityMajor, 
  type CreateUniversityMajorInput 
} from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getUniversityMajors(universityId: number): Promise<UniversityMajor[]> {
  try {
    const results = await db.select()
      .from(universityMajorsTable)
      .where(eq(universityMajorsTable.university_id, universityId))
      .execute();

    return results.map(result => ({
      ...result,
      tuition_fee_min: result.tuition_fee_min ? parseFloat(result.tuition_fee_min) : null,
      tuition_fee_max: result.tuition_fee_max ? parseFloat(result.tuition_fee_max) : null
    }));
  } catch (error) {
    console.error('Failed to get university majors:', error);
    throw error;
  }
}

export async function getMajorUniversities(majorId: number): Promise<UniversityMajor[]> {
  try {
    const results = await db.select()
      .from(universityMajorsTable)
      .where(eq(universityMajorsTable.major_id, majorId))
      .execute();

    return results.map(result => ({
      ...result,
      tuition_fee_min: result.tuition_fee_min ? parseFloat(result.tuition_fee_min) : null,
      tuition_fee_max: result.tuition_fee_max ? parseFloat(result.tuition_fee_max) : null
    }));
  } catch (error) {
    console.error('Failed to get major universities:', error);
    throw error;
  }
}

export async function getUniversityMajorDetails(universityId: number, majorId: number): Promise<UniversityMajor | null> {
  try {
    const results = await db.select()
      .from(universityMajorsTable)
      .where(and(
        eq(universityMajorsTable.university_id, universityId),
        eq(universityMajorsTable.major_id, majorId)
      ))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const result = results[0];
    return {
      ...result,
      tuition_fee_min: result.tuition_fee_min ? parseFloat(result.tuition_fee_min) : null,
      tuition_fee_max: result.tuition_fee_max ? parseFloat(result.tuition_fee_max) : null
    };
  } catch (error) {
    console.error('Failed to get university major details:', error);
    throw error;
  }
}

export async function createUniversityMajor(input: CreateUniversityMajorInput): Promise<UniversityMajor> {
  try {
    // Verify that university exists
    const universityExists = await db.select({ id: universitiesTable.id })
      .from(universitiesTable)
      .where(eq(universitiesTable.id, input.university_id))
      .execute();

    if (universityExists.length === 0) {
      throw new Error(`University with ID ${input.university_id} does not exist`);
    }

    // Verify that major exists
    const majorExists = await db.select({ id: majorsTable.id })
      .from(majorsTable)
      .where(eq(majorsTable.id, input.major_id))
      .execute();

    if (majorExists.length === 0) {
      throw new Error(`Major with ID ${input.major_id} does not exist`);
    }

    const results = await db.insert(universityMajorsTable)
      .values({
        university_id: input.university_id,
        major_id: input.major_id,
        study_levels: input.study_levels,
        tuition_fee_min: input.tuition_fee_min ? input.tuition_fee_min.toString() : null,
        tuition_fee_max: input.tuition_fee_max ? input.tuition_fee_max.toString() : null,
        currency: input.currency || null,
        duration_years: input.duration_years || null,
        requirements_ar: input.requirements_ar || null,
        requirements_en: input.requirements_en || null,
        requirements_tr: input.requirements_tr || null,
        requirements_ms: input.requirements_ms || null
      })
      .returning()
      .execute();

    const result = results[0];
    return {
      ...result,
      tuition_fee_min: result.tuition_fee_min ? parseFloat(result.tuition_fee_min) : null,
      tuition_fee_max: result.tuition_fee_max ? parseFloat(result.tuition_fee_max) : null
    };
  } catch (error) {
    console.error('Failed to create university major:', error);
    throw error;
  }
}

export async function updateUniversityMajor(
  universityId: number, 
  majorId: number, 
  input: Partial<CreateUniversityMajorInput>
): Promise<UniversityMajor | null> {
  try {
    const updateData: any = {};

    if (input.study_levels !== undefined) {
      updateData.study_levels = input.study_levels;
    }
    if (input.tuition_fee_min !== undefined) {
      updateData.tuition_fee_min = input.tuition_fee_min ? input.tuition_fee_min.toString() : null;
    }
    if (input.tuition_fee_max !== undefined) {
      updateData.tuition_fee_max = input.tuition_fee_max ? input.tuition_fee_max.toString() : null;
    }
    if (input.currency !== undefined) {
      updateData.currency = input.currency;
    }
    if (input.duration_years !== undefined) {
      updateData.duration_years = input.duration_years;
    }
    if (input.requirements_ar !== undefined) {
      updateData.requirements_ar = input.requirements_ar;
    }
    if (input.requirements_en !== undefined) {
      updateData.requirements_en = input.requirements_en;
    }
    if (input.requirements_tr !== undefined) {
      updateData.requirements_tr = input.requirements_tr;
    }
    if (input.requirements_ms !== undefined) {
      updateData.requirements_ms = input.requirements_ms;
    }

    if (Object.keys(updateData).length === 0) {
      // No fields to update, return current record
      return await getUniversityMajorDetails(universityId, majorId);
    }

    updateData.updated_at = new Date();

    const results = await db.update(universityMajorsTable)
      .set(updateData)
      .where(and(
        eq(universityMajorsTable.university_id, universityId),
        eq(universityMajorsTable.major_id, majorId)
      ))
      .returning()
      .execute();

    if (results.length === 0) {
      return null;
    }

    const result = results[0];
    return {
      ...result,
      tuition_fee_min: result.tuition_fee_min ? parseFloat(result.tuition_fee_min) : null,
      tuition_fee_max: result.tuition_fee_max ? parseFloat(result.tuition_fee_max) : null
    };
  } catch (error) {
    console.error('Failed to update university major:', error);
    throw error;
  }
}

export async function deleteUniversityMajor(universityId: number, majorId: number): Promise<boolean> {
  try {
    const results = await db.delete(universityMajorsTable)
      .where(and(
        eq(universityMajorsTable.university_id, universityId),
        eq(universityMajorsTable.major_id, majorId)
      ))
      .returning({ id: universityMajorsTable.id })
      .execute();

    return results.length > 0;
  } catch (error) {
    console.error('Failed to delete university major:', error);
    throw error;
  }
}