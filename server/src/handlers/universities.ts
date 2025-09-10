import { db } from '../db';
import { universitiesTable, countriesTable } from '../db/schema';
import { 
  type University, 
  type CreateUniversityInput, 
  type UpdateUniversityInput,
  type GetUniversitiesInput 
} from '../schema';
import { eq, and, or, ilike, count, desc, SQL } from 'drizzle-orm';

export async function getUniversities(input: GetUniversitiesInput): Promise<{
  data: University[];
  total: number;
  page: number;
  limit: number;
}> {
  try {
    const offset = (input.page - 1) * input.limit;
    
    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    
    if (input.country_id !== undefined) {
      conditions.push(eq(universitiesTable.country_id, input.country_id));
    }
    
    if (input.status !== undefined) {
      conditions.push(eq(universitiesTable.status, input.status));
    }
    
    if (input.search) {
      conditions.push(
        or(
          ilike(universitiesTable.name_ar, `%${input.search}%`),
          ilike(universitiesTable.name_en, `%${input.search}%`),
          ilike(universitiesTable.name_tr, `%${input.search}%`),
          ilike(universitiesTable.name_ms, `%${input.search}%`)
        )!
      );
    }
    
    // Build WHERE clause
    const whereClause = conditions.length === 0 ? undefined : 
                       (conditions.length === 1 ? conditions[0] : and(...conditions)!);
    
    // Execute queries separately to avoid TypeScript issues
    let results: University[];
    let totalResults: { count: number }[];
    
    if (whereClause) {
      // With filters
      const dataPromise = db.select()
        .from(universitiesTable)
        .where(whereClause)
        .orderBy(desc(universitiesTable.created_at))
        .limit(input.limit)
        .offset(offset)
        .execute();
        
      const countPromise = db.select({ count: count() })
        .from(universitiesTable)
        .where(whereClause)
        .execute();
        
      [results, totalResults] = await Promise.all([dataPromise, countPromise]);
    } else {
      // Without filters
      const dataPromise = db.select()
        .from(universitiesTable)
        .orderBy(desc(universitiesTable.created_at))
        .limit(input.limit)
        .offset(offset)
        .execute();
        
      const countPromise = db.select({ count: count() })
        .from(universitiesTable)
        .execute();
        
      [results, totalResults] = await Promise.all([dataPromise, countPromise]);
    }
    
    return {
      data: results,
      total: totalResults[0].count,
      page: input.page,
      limit: input.limit,
    };
  } catch (error) {
    console.error('Get universities failed:', error);
    throw error;
  }
}

export async function getUniversityById(id: number): Promise<University | null> {
  try {
    const results = await db.select()
      .from(universitiesTable)
      .where(eq(universitiesTable.id, id))
      .limit(1)
      .execute();
    
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Get university by ID failed:', error);
    throw error;
  }
}

export async function getUniversityBySlug(slug: string): Promise<University | null> {
  try {
    const results = await db.select()
      .from(universitiesTable)
      .where(eq(universitiesTable.slug, slug))
      .limit(1)
      .execute();
    
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Get university by slug failed:', error);
    throw error;
  }
}

export async function getUniversitiesByCountry(countryId: number): Promise<University[]> {
  try {
    const results = await db.select()
      .from(universitiesTable)
      .where(eq(universitiesTable.country_id, countryId))
      .orderBy(desc(universitiesTable.created_at))
      .execute();
    
    return results;
  } catch (error) {
    console.error('Get universities by country failed:', error);
    throw error;
  }
}

export async function createUniversity(input: CreateUniversityInput): Promise<University> {
  try {
    // Verify that the country exists
    const country = await db.select()
      .from(countriesTable)
      .where(eq(countriesTable.id, input.country_id))
      .limit(1)
      .execute();
    
    if (country.length === 0) {
      throw new Error(`Country with ID ${input.country_id} does not exist`);
    }
    
    // Insert university record
    const result = await db.insert(universitiesTable)
      .values({
        name_ar: input.name_ar,
        name_en: input.name_en,
        name_tr: input.name_tr,
        name_ms: input.name_ms,
        slug: input.slug,
        country_id: input.country_id,
        global_ranking: input.global_ranking,
        local_ranking: input.local_ranking,
        teaching_language_ar: input.teaching_language_ar,
        teaching_language_en: input.teaching_language_en,
        teaching_language_tr: input.teaching_language_tr,
        teaching_language_ms: input.teaching_language_ms,
        description_ar: input.description_ar,
        description_en: input.description_en,
        description_tr: input.description_tr,
        description_ms: input.description_ms,
        image_url: input.image_url,
        gallery_images: input.gallery_images,
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
    console.error('University creation failed:', error);
    throw error;
  }
}

export async function updateUniversity(input: UpdateUniversityInput): Promise<University | null> {
  try {
    // Check if university exists
    const existing = await getUniversityById(input.id);
    if (!existing) {
      return null;
    }
    
    // If country_id is being updated, verify the new country exists
    if (input.country_id !== undefined) {
      const country = await db.select()
        .from(countriesTable)
        .where(eq(countriesTable.id, input.country_id))
        .limit(1)
        .execute();
      
      if (country.length === 0) {
        throw new Error(`Country with ID ${input.country_id} does not exist`);
      }
    }
    
    // Build update object with only provided fields
    const updateData: Partial<typeof universitiesTable.$inferInsert> = {};
    
    if (input.name_ar !== undefined) updateData.name_ar = input.name_ar;
    if (input.name_en !== undefined) updateData.name_en = input.name_en;
    if (input.name_tr !== undefined) updateData.name_tr = input.name_tr;
    if (input.name_ms !== undefined) updateData.name_ms = input.name_ms;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.country_id !== undefined) updateData.country_id = input.country_id;
    if (input.global_ranking !== undefined) updateData.global_ranking = input.global_ranking;
    if (input.local_ranking !== undefined) updateData.local_ranking = input.local_ranking;
    if (input.teaching_language_ar !== undefined) updateData.teaching_language_ar = input.teaching_language_ar;
    if (input.teaching_language_en !== undefined) updateData.teaching_language_en = input.teaching_language_en;
    if (input.teaching_language_tr !== undefined) updateData.teaching_language_tr = input.teaching_language_tr;
    if (input.teaching_language_ms !== undefined) updateData.teaching_language_ms = input.teaching_language_ms;
    if (input.description_ar !== undefined) updateData.description_ar = input.description_ar;
    if (input.description_en !== undefined) updateData.description_en = input.description_en;
    if (input.description_tr !== undefined) updateData.description_tr = input.description_tr;
    if (input.description_ms !== undefined) updateData.description_ms = input.description_ms;
    if (input.image_url !== undefined) updateData.image_url = input.image_url;
    if (input.gallery_images !== undefined) updateData.gallery_images = input.gallery_images;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.meta_title_ar !== undefined) updateData.meta_title_ar = input.meta_title_ar;
    if (input.meta_title_en !== undefined) updateData.meta_title_en = input.meta_title_en;
    if (input.meta_title_tr !== undefined) updateData.meta_title_tr = input.meta_title_tr;
    if (input.meta_title_ms !== undefined) updateData.meta_title_ms = input.meta_title_ms;
    if (input.meta_description_ar !== undefined) updateData.meta_description_ar = input.meta_description_ar;
    if (input.meta_description_en !== undefined) updateData.meta_description_en = input.meta_description_en;
    if (input.meta_description_tr !== undefined) updateData.meta_description_tr = input.meta_description_tr;
    if (input.meta_description_ms !== undefined) updateData.meta_description_ms = input.meta_description_ms;
    
    // Update the record
    const result = await db.update(universitiesTable)
      .set(updateData)
      .where(eq(universitiesTable.id, input.id))
      .returning()
      .execute();
    
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('University update failed:', error);
    throw error;
  }
}

export async function deleteUniversity(id: number): Promise<boolean> {
  try {
    const result = await db.delete(universitiesTable)
      .where(eq(universitiesTable.id, id))
      .execute();
    
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('University deletion failed:', error);
    throw error;
  }
}