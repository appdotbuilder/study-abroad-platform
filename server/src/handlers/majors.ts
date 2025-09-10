import { db } from '../db';
import { majorsTable, universityMajorsTable, articlesTable } from '../db/schema';
import { 
  type Major, 
  type CreateMajorInput, 
  type UpdateMajorInput,
  type GetMajorsInput 
} from '../schema';
import { eq, ilike, or, and, count, desc, SQL } from 'drizzle-orm';

export async function getMajors(input: GetMajorsInput): Promise<{
  data: Major[];
  total: number;
  page: number;
  limit: number;
}> {
  try {
    const offset = (input.page - 1) * input.limit;

    // Build conditions for majors table
    const majorConditions: SQL<unknown>[] = [];

    if (input.status) {
      majorConditions.push(eq(majorsTable.status, input.status));
    }

    if (input.search) {
      const searchPattern = `%${input.search}%`;
      majorConditions.push(
        or(
          ilike(majorsTable.name_ar, searchPattern),
          ilike(majorsTable.name_en, searchPattern),
          ilike(majorsTable.name_tr, searchPattern),
          ilike(majorsTable.name_ms, searchPattern),
          ilike(majorsTable.slug, searchPattern)
        )!
      );
    }

    // Handle university_id filter by joining with university_majors table
    if (input.university_id) {
      // Build WHERE conditions including university filter
      const allConditions = [...majorConditions, eq(universityMajorsTable.university_id, input.university_id)];
      const whereClause = allConditions.length === 1 ? allConditions[0] : and(...allConditions);

      // Data query with join
      const dataQuery = db.select({
        id: majorsTable.id,
        name_ar: majorsTable.name_ar,
        name_en: majorsTable.name_en,
        name_tr: majorsTable.name_tr,
        name_ms: majorsTable.name_ms,
        slug: majorsTable.slug,
        description_ar: majorsTable.description_ar,
        description_en: majorsTable.description_en,
        description_tr: majorsTable.description_tr,
        description_ms: majorsTable.description_ms,
        future_opportunities_ar: majorsTable.future_opportunities_ar,
        future_opportunities_en: majorsTable.future_opportunities_en,
        future_opportunities_tr: majorsTable.future_opportunities_tr,
        future_opportunities_ms: majorsTable.future_opportunities_ms,
        image_url: majorsTable.image_url,
        status: majorsTable.status,
        meta_title_ar: majorsTable.meta_title_ar,
        meta_title_en: majorsTable.meta_title_en,
        meta_title_tr: majorsTable.meta_title_tr,
        meta_title_ms: majorsTable.meta_title_ms,
        meta_description_ar: majorsTable.meta_description_ar,
        meta_description_en: majorsTable.meta_description_en,
        meta_description_tr: majorsTable.meta_description_tr,
        meta_description_ms: majorsTable.meta_description_ms,
        created_at: majorsTable.created_at,
        updated_at: majorsTable.updated_at,
      })
      .from(majorsTable)
      .innerJoin(universityMajorsTable, eq(majorsTable.id, universityMajorsTable.major_id))
      .where(whereClause)
      .orderBy(desc(majorsTable.created_at))
      .limit(input.limit)
      .offset(offset);

      // Count query with join
      const countQuery = db.select({ count: count() })
        .from(majorsTable)
        .innerJoin(universityMajorsTable, eq(majorsTable.id, universityMajorsTable.major_id))
        .where(whereClause);

      // Execute queries
      const [data, totalResult] = await Promise.all([
        dataQuery.execute(),
        countQuery.execute()
      ]);

      return {
        data,
        total: totalResult[0].count,
        page: input.page,
        limit: input.limit,
      };
    } else {
      // Query without join
      const baseQuery = db.select().from(majorsTable);
      const baseCountQuery = db.select({ count: count() }).from(majorsTable);

      // Apply conditions if any
      const dataQuery = majorConditions.length > 0 
        ? baseQuery.where(majorConditions.length === 1 ? majorConditions[0] : and(...majorConditions))
        : baseQuery;

      const countQuery = majorConditions.length > 0
        ? baseCountQuery.where(majorConditions.length === 1 ? majorConditions[0] : and(...majorConditions))
        : baseCountQuery;

      // Apply ordering and pagination
      const finalDataQuery = dataQuery
        .orderBy(desc(majorsTable.created_at))
        .limit(input.limit)
        .offset(offset);

      // Execute queries
      const [data, totalResult] = await Promise.all([
        finalDataQuery.execute(),
        countQuery.execute()
      ]);

      return {
        data,
        total: totalResult[0].count,
        page: input.page,
        limit: input.limit,
      };
    }
  } catch (error) {
    console.error('Failed to get majors:', error);
    throw error;
  }
}

export async function getMajorById(id: number): Promise<Major | null> {
  try {
    const majors = await db.select()
      .from(majorsTable)
      .where(eq(majorsTable.id, id))
      .limit(1)
      .execute();

    return majors.length > 0 ? majors[0] : null;
  } catch (error) {
    console.error('Failed to get major by ID:', error);
    throw error;
  }
}

export async function getMajorBySlug(slug: string): Promise<Major | null> {
  try {
    const majors = await db.select()
      .from(majorsTable)
      .where(and(
        eq(majorsTable.slug, slug),
        eq(majorsTable.status, 'ACTIVE')
      ))
      .limit(1)
      .execute();

    return majors.length > 0 ? majors[0] : null;
  } catch (error) {
    console.error('Failed to get major by slug:', error);
    throw error;
  }
}

export async function getMajorsByUniversity(universityId: number): Promise<Major[]> {
  try {
    const results = await db.select({
      id: majorsTable.id,
      name_ar: majorsTable.name_ar,
      name_en: majorsTable.name_en,
      name_tr: majorsTable.name_tr,
      name_ms: majorsTable.name_ms,
      slug: majorsTable.slug,
      description_ar: majorsTable.description_ar,
      description_en: majorsTable.description_en,
      description_tr: majorsTable.description_tr,
      description_ms: majorsTable.description_ms,
      future_opportunities_ar: majorsTable.future_opportunities_ar,
      future_opportunities_en: majorsTable.future_opportunities_en,
      future_opportunities_tr: majorsTable.future_opportunities_tr,
      future_opportunities_ms: majorsTable.future_opportunities_ms,
      image_url: majorsTable.image_url,
      status: majorsTable.status,
      meta_title_ar: majorsTable.meta_title_ar,
      meta_title_en: majorsTable.meta_title_en,
      meta_title_tr: majorsTable.meta_title_tr,
      meta_title_ms: majorsTable.meta_title_ms,
      meta_description_ar: majorsTable.meta_description_ar,
      meta_description_en: majorsTable.meta_description_en,
      meta_description_tr: majorsTable.meta_description_tr,
      meta_description_ms: majorsTable.meta_description_ms,
      created_at: majorsTable.created_at,
      updated_at: majorsTable.updated_at,
    })
      .from(majorsTable)
      .innerJoin(universityMajorsTable, eq(majorsTable.id, universityMajorsTable.major_id))
      .where(and(
        eq(universityMajorsTable.university_id, universityId),
        eq(majorsTable.status, 'ACTIVE')
      ))
      .orderBy(majorsTable.name_en)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get majors by university:', error);
    throw error;
  }
}

export async function createMajor(input: CreateMajorInput): Promise<Major> {
  try {
    const result = await db.insert(majorsTable)
      .values({
        name_ar: input.name_ar,
        name_en: input.name_en,
        name_tr: input.name_tr,
        name_ms: input.name_ms,
        slug: input.slug,
        description_ar: input.description_ar,
        description_en: input.description_en,
        description_tr: input.description_tr,
        description_ms: input.description_ms,
        future_opportunities_ar: input.future_opportunities_ar,
        future_opportunities_en: input.future_opportunities_en,
        future_opportunities_tr: input.future_opportunities_tr,
        future_opportunities_ms: input.future_opportunities_ms,
        image_url: input.image_url,
        status: input.status,
        meta_title_ar: input.meta_title_ar,
        meta_title_en: input.meta_title_en,
        meta_title_tr: input.meta_title_tr,
        meta_title_ms: input.meta_title_ms,
        meta_description_ar: input.meta_description_ar,
        meta_description_en: input.meta_description_en,
        meta_description_tr: input.meta_description_tr,
        meta_description_ms: input.meta_description_ms,
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Failed to create major:', error);
    throw error;
  }
}

export async function updateMajor(input: UpdateMajorInput): Promise<Major | null> {
  try {
    const { id, ...updateData } = input;
    
    const result = await db.update(majorsTable)
      .set({
        ...updateData,
        updated_at: new Date(),
      })
      .where(eq(majorsTable.id, id))
      .returning()
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Failed to update major:', error);
    throw error;
  }
}

export async function deleteMajor(id: number): Promise<boolean> {
  try {
    // Check if major is referenced by university_majors
    const universityMajors = await db.select({ count: count() })
      .from(universityMajorsTable)
      .where(eq(universityMajorsTable.major_id, id))
      .execute();

    if (universityMajors[0].count > 0) {
      throw new Error('Cannot delete major: it is referenced by universities');
    }

    // Check if major is referenced by articles
    const articles = await db.select({ count: count() })
      .from(articlesTable)
      .where(eq(articlesTable.major_id, id))
      .execute();

    if (articles[0].count > 0) {
      throw new Error('Cannot delete major: it is referenced by articles');
    }

    // Perform deletion
    const result = await db.delete(majorsTable)
      .where(eq(majorsTable.id, id))
      .execute();

    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Failed to delete major:', error);
    throw error;
  }
}