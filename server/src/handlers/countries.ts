import { db } from '../db';
import { countriesTable, universitiesTable, articlesTable } from '../db/schema';
import { 
  type Country, 
  type CreateCountryInput, 
  type UpdateCountryInput,
  type GetCountriesInput 
} from '../schema';
import { eq, and, ilike, or, count, SQL, desc } from 'drizzle-orm';

export async function getCountries(input: GetCountriesInput): Promise<{
  data: Country[];
  total: number;
  page: number;
  limit: number;
}> {
  try {
    const offset = (input.page - 1) * input.limit;
    
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];
    
    if (input.status) {
      conditions.push(eq(countriesTable.status, input.status));
    }
    
    if (input.search) {
      const searchCondition = or(
        ilike(countriesTable.name_ar, `%${input.search}%`),
        ilike(countriesTable.name_en, `%${input.search}%`),
        ilike(countriesTable.name_tr, `%${input.search}%`),
        ilike(countriesTable.name_ms, `%${input.search}%`),
        ilike(countriesTable.slug, `%${input.search}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }
    
    // Build query with conditions
    const whereClause = conditions.length === 0 ? undefined : 
      (conditions.length === 1 ? conditions[0] : and(...conditions));
    
    let results;
    if (whereClause) {
      results = await db.select()
        .from(countriesTable)
        .where(whereClause)
        .orderBy(desc(countriesTable.created_at))
        .limit(input.limit)
        .offset(offset)
        .execute();
    } else {
      results = await db.select()
        .from(countriesTable)
        .orderBy(desc(countriesTable.created_at))
        .limit(input.limit)
        .offset(offset)
        .execute();
    }
    
    // Get total count with same conditions
    let totalResult;
    if (whereClause) {
      totalResult = await db.select({ count: count() })
        .from(countriesTable)
        .where(whereClause)
        .execute();
    } else {
      totalResult = await db.select({ count: count() })
        .from(countriesTable)
        .execute();
    }
    
    const total = totalResult[0]?.count || 0;
    
    return {
      data: results,
      total,
      page: input.page,
      limit: input.limit,
    };
  } catch (error) {
    console.error('Get countries failed:', error);
    throw error;
  }
}

export async function getCountryById(id: number): Promise<Country | null> {
  try {
    const results = await db.select()
      .from(countriesTable)
      .where(eq(countriesTable.id, id))
      .execute();
    
    return results[0] || null;
  } catch (error) {
    console.error('Get country by ID failed:', error);
    throw error;
  }
}

export async function getCountryBySlug(slug: string): Promise<Country | null> {
  try {
    const results = await db.select()
      .from(countriesTable)
      .where(eq(countriesTable.slug, slug))
      .execute();
    
    return results[0] || null;
  } catch (error) {
    console.error('Get country by slug failed:', error);
    throw error;
  }
}

export async function createCountry(input: CreateCountryInput): Promise<Country> {
  try {
    const result = await db.insert(countriesTable)
      .values({
        name_ar: input.name_ar,
        name_en: input.name_en,
        name_tr: input.name_tr,
        name_ms: input.name_ms,
        slug: input.slug,
        description_ar: input.description_ar || null,
        description_en: input.description_en || null,
        description_tr: input.description_tr || null,
        description_ms: input.description_ms || null,
        image_url: input.image_url || null,
        status: input.status,
        meta_title_ar: input.meta_title_ar || null,
        meta_title_en: input.meta_title_en || null,
        meta_title_tr: input.meta_title_tr || null,
        meta_title_ms: input.meta_title_ms || null,
        meta_description_ar: input.meta_description_ar || null,
        meta_description_en: input.meta_description_en || null,
        meta_description_tr: input.meta_description_tr || null,
        meta_description_ms: input.meta_description_ms || null,
      })
      .returning()
      .execute();
    
    return result[0];
  } catch (error) {
    console.error('Create country failed:', error);
    throw error;
  }
}

export async function updateCountry(input: UpdateCountryInput): Promise<Country | null> {
  try {
    // Build update object with only defined fields
    const updateData: any = {
      updated_at: new Date(),
    };
    
    if (input.name_ar !== undefined) updateData.name_ar = input.name_ar;
    if (input.name_en !== undefined) updateData.name_en = input.name_en;
    if (input.name_tr !== undefined) updateData.name_tr = input.name_tr;
    if (input.name_ms !== undefined) updateData.name_ms = input.name_ms;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.description_ar !== undefined) updateData.description_ar = input.description_ar;
    if (input.description_en !== undefined) updateData.description_en = input.description_en;
    if (input.description_tr !== undefined) updateData.description_tr = input.description_tr;
    if (input.description_ms !== undefined) updateData.description_ms = input.description_ms;
    if (input.image_url !== undefined) updateData.image_url = input.image_url;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.meta_title_ar !== undefined) updateData.meta_title_ar = input.meta_title_ar;
    if (input.meta_title_en !== undefined) updateData.meta_title_en = input.meta_title_en;
    if (input.meta_title_tr !== undefined) updateData.meta_title_tr = input.meta_title_tr;
    if (input.meta_title_ms !== undefined) updateData.meta_title_ms = input.meta_title_ms;
    if (input.meta_description_ar !== undefined) updateData.meta_description_ar = input.meta_description_ar;
    if (input.meta_description_en !== undefined) updateData.meta_description_en = input.meta_description_en;
    if (input.meta_description_tr !== undefined) updateData.meta_description_tr = input.meta_description_tr;
    if (input.meta_description_ms !== undefined) updateData.meta_description_ms = input.meta_description_ms;
    
    const results = await db.update(countriesTable)
      .set(updateData)
      .where(eq(countriesTable.id, input.id))
      .returning()
      .execute();
    
    return results[0] || null;
  } catch (error) {
    console.error('Update country failed:', error);
    throw error;
  }
}

export async function deleteCountry(id: number): Promise<boolean> {
  try {
    // Check for dependencies before deleting
    const universityCount = await db.select({ count: count() })
      .from(universitiesTable)
      .where(eq(universitiesTable.country_id, id))
      .execute();
    
    const articleCount = await db.select({ count: count() })
      .from(articlesTable)
      .where(eq(articlesTable.country_id, id))
      .execute();
    
    const hasUniversities = universityCount[0]?.count > 0;
    const hasArticles = articleCount[0]?.count > 0;
    
    if (hasUniversities || hasArticles) {
      throw new Error('Cannot delete country with existing universities or articles');
    }
    
    const result = await db.delete(countriesTable)
      .where(eq(countriesTable.id, id))
      .execute();
    
    return (result.rowCount || 0) > 0;
  } catch (error) {
    console.error('Delete country failed:', error);
    throw error;
  }
}