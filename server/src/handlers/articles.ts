import { db } from '../db';
import { articlesTable, countriesTable, majorsTable } from '../db/schema';
import { 
  type Article, 
  type CreateArticleInput, 
  type UpdateArticleInput,
  type GetArticlesInput 
} from '../schema';
import { eq, desc, asc, and, or, like, count, ne, sql, type SQL } from 'drizzle-orm';

export async function getArticles(input: GetArticlesInput): Promise<{
  data: Article[];
  total: number;
  page: number;
  limit: number;
}> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    if (input.country_id !== undefined) {
      conditions.push(eq(articlesTable.country_id, input.country_id));
    }

    if (input.major_id !== undefined) {
      conditions.push(eq(articlesTable.major_id, input.major_id));
    }

    if (input.category) {
      conditions.push(eq(articlesTable.category, input.category));
    }

    if (input.status) {
      conditions.push(eq(articlesTable.status, input.status));
    }

    if (input.is_featured !== undefined) {
      conditions.push(eq(articlesTable.is_featured, input.is_featured));
    }

    if (input.search) {
      const searchTerm = `%${input.search}%`;
      const searchCondition = or(
        like(articlesTable.title_ar, searchTerm),
        like(articlesTable.title_en, searchTerm),
        like(articlesTable.title_tr, searchTerm),
        like(articlesTable.title_ms, searchTerm),
        like(articlesTable.content_ar, searchTerm),
        like(articlesTable.content_en, searchTerm),
        like(articlesTable.content_tr, searchTerm),
        like(articlesTable.content_ms, searchTerm)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Calculate offset
    const offset = (input.page - 1) * input.limit;

    // Execute queries with proper conditional handling
    let articlesQuery, countQuery;

    if (conditions.length > 0) {
      const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
      
      articlesQuery = db.select()
        .from(articlesTable)
        .where(whereCondition)
        .orderBy(desc(articlesTable.created_at))
        .limit(input.limit)
        .offset(offset);

      countQuery = db.select({ count: count() })
        .from(articlesTable)
        .where(whereCondition);
    } else {
      articlesQuery = db.select()
        .from(articlesTable)
        .orderBy(desc(articlesTable.created_at))
        .limit(input.limit)
        .offset(offset);

      countQuery = db.select({ count: count() })
        .from(articlesTable);
    }

    // Execute both queries
    const [articles, totalResult] = await Promise.all([
      articlesQuery.execute(),
      countQuery.execute()
    ]);

    const total = totalResult[0].count;

    return {
      data: articles,
      total,
      page: input.page,
      limit: input.limit,
    };
  } catch (error) {
    console.error('Get articles failed:', error);
    throw error;
  }
}

export async function getArticleById(id: number): Promise<Article | null> {
  try {
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, id))
      .execute();

    return articles.length > 0 ? articles[0] : null;
  } catch (error) {
    console.error('Get article by ID failed:', error);
    throw error;
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const articles = await db.select()
      .from(articlesTable)
      .where(and(
        eq(articlesTable.slug, slug),
        eq(articlesTable.status, 'ACTIVE')
      ))
      .execute();

    return articles.length > 0 ? articles[0] : null;
  } catch (error) {
    console.error('Get article by slug failed:', error);
    throw error;
  }
}

export async function getFeaturedArticles(limit: number = 5): Promise<Article[]> {
  try {
    const articles = await db.select()
      .from(articlesTable)
      .where(and(
        eq(articlesTable.is_featured, true),
        eq(articlesTable.status, 'ACTIVE')
      ))
      .orderBy(desc(articlesTable.created_at))
      .limit(limit)
      .execute();

    return articles;
  } catch (error) {
    console.error('Get featured articles failed:', error);
    throw error;
  }
}

export async function getRelatedArticles(articleId: number, limit: number = 5): Promise<Article[]> {
  try {
    // First get the article to find its country_id and major_id
    const targetArticle = await getArticleById(articleId);
    if (!targetArticle) {
      return [];
    }

    // Build conditions for related articles
    const baseConditions: SQL<unknown>[] = [
      ne(articlesTable.id, articleId), // Exclude the current article
      eq(articlesTable.status, 'ACTIVE')
    ];

    // Add conditions based on country or major
    const relatedConditions: SQL<unknown>[] = [];
    if (targetArticle.country_id) {
      relatedConditions.push(eq(articlesTable.country_id, targetArticle.country_id));
    }
    if (targetArticle.major_id) {
      relatedConditions.push(eq(articlesTable.major_id, targetArticle.major_id));
    }

    // Build final conditions array
    const finalConditions = [...baseConditions];
    if (relatedConditions.length > 0) {
      const relatedOr = or(...relatedConditions);
      if (relatedOr) {
        finalConditions.push(relatedOr);
      }
    }

    const whereCondition = finalConditions.length === 1 
      ? finalConditions[0] 
      : and(...finalConditions);

    const articles = await db.select()
      .from(articlesTable)
      .where(whereCondition)
      .orderBy(desc(articlesTable.created_at))
      .limit(limit)
      .execute();

    return articles;
  } catch (error) {
    console.error('Get related articles failed:', error);
    throw error;
  }
}

export async function getArticlesByCountry(countryId: number, limit?: number): Promise<Article[]> {
  try {
    const baseQuery = db.select()
      .from(articlesTable)
      .where(and(
        eq(articlesTable.country_id, countryId),
        eq(articlesTable.status, 'ACTIVE')
      ))
      .orderBy(desc(articlesTable.created_at));

    const query = limit ? baseQuery.limit(limit) : baseQuery;
    const articles = await query.execute();
    return articles;
  } catch (error) {
    console.error('Get articles by country failed:', error);
    throw error;
  }
}

export async function getArticlesByMajor(majorId: number, limit?: number): Promise<Article[]> {
  try {
    const baseQuery = db.select()
      .from(articlesTable)
      .where(and(
        eq(articlesTable.major_id, majorId),
        eq(articlesTable.status, 'ACTIVE')
      ))
      .orderBy(desc(articlesTable.created_at));

    const query = limit ? baseQuery.limit(limit) : baseQuery;
    const articles = await query.execute();
    return articles;
  } catch (error) {
    console.error('Get articles by major failed:', error);
    throw error;
  }
}

export async function createArticle(input: CreateArticleInput): Promise<Article> {
  try {
    // Verify foreign key references if provided
    if (input.country_id) {
      const country = await db.select()
        .from(countriesTable)
        .where(eq(countriesTable.id, input.country_id))
        .execute();
      if (country.length === 0) {
        throw new Error(`Country with id ${input.country_id} not found`);
      }
    }

    if (input.major_id) {
      const major = await db.select()
        .from(majorsTable)
        .where(eq(majorsTable.id, input.major_id))
        .execute();
      if (major.length === 0) {
        throw new Error(`Major with id ${input.major_id} not found`);
      }
    }

    const result = await db.insert(articlesTable)
      .values({
        title_ar: input.title_ar,
        title_en: input.title_en,
        title_tr: input.title_tr,
        title_ms: input.title_ms,
        slug: input.slug,
        content_ar: input.content_ar || null,
        content_en: input.content_en || null,
        content_tr: input.content_tr || null,
        content_ms: input.content_ms || null,
        excerpt_ar: input.excerpt_ar || null,
        excerpt_en: input.excerpt_en || null,
        excerpt_tr: input.excerpt_tr || null,
        excerpt_ms: input.excerpt_ms || null,
        featured_image_url: input.featured_image_url || null,
        category: input.category || null,
        country_id: input.country_id || null,
        major_id: input.major_id || null,
        status: input.status,
        is_featured: input.is_featured,
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
    console.error('Article creation failed:', error);
    throw error;
  }
}

export async function updateArticle(input: UpdateArticleInput): Promise<Article | null> {
  try {
    // Verify foreign key references if provided
    if (input.country_id) {
      const country = await db.select()
        .from(countriesTable)
        .where(eq(countriesTable.id, input.country_id))
        .execute();
      if (country.length === 0) {
        throw new Error(`Country with id ${input.country_id} not found`);
      }
    }

    if (input.major_id) {
      const major = await db.select()
        .from(majorsTable)
        .where(eq(majorsTable.id, input.major_id))
        .execute();
      if (major.length === 0) {
        throw new Error(`Major with id ${input.major_id} not found`);
      }
    }

    // Build update data with only provided fields
    const updateData: any = {
      updated_at: sql`now()`,
    };

    if (input.title_ar !== undefined) updateData.title_ar = input.title_ar;
    if (input.title_en !== undefined) updateData.title_en = input.title_en;
    if (input.title_tr !== undefined) updateData.title_tr = input.title_tr;
    if (input.title_ms !== undefined) updateData.title_ms = input.title_ms;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.content_ar !== undefined) updateData.content_ar = input.content_ar;
    if (input.content_en !== undefined) updateData.content_en = input.content_en;
    if (input.content_tr !== undefined) updateData.content_tr = input.content_tr;
    if (input.content_ms !== undefined) updateData.content_ms = input.content_ms;
    if (input.excerpt_ar !== undefined) updateData.excerpt_ar = input.excerpt_ar;
    if (input.excerpt_en !== undefined) updateData.excerpt_en = input.excerpt_en;
    if (input.excerpt_tr !== undefined) updateData.excerpt_tr = input.excerpt_tr;
    if (input.excerpt_ms !== undefined) updateData.excerpt_ms = input.excerpt_ms;
    if (input.featured_image_url !== undefined) updateData.featured_image_url = input.featured_image_url;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.country_id !== undefined) updateData.country_id = input.country_id;
    if (input.major_id !== undefined) updateData.major_id = input.major_id;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.is_featured !== undefined) updateData.is_featured = input.is_featured;
    if (input.meta_title_ar !== undefined) updateData.meta_title_ar = input.meta_title_ar;
    if (input.meta_title_en !== undefined) updateData.meta_title_en = input.meta_title_en;
    if (input.meta_title_tr !== undefined) updateData.meta_title_tr = input.meta_title_tr;
    if (input.meta_title_ms !== undefined) updateData.meta_title_ms = input.meta_title_ms;
    if (input.meta_description_ar !== undefined) updateData.meta_description_ar = input.meta_description_ar;
    if (input.meta_description_en !== undefined) updateData.meta_description_en = input.meta_description_en;
    if (input.meta_description_tr !== undefined) updateData.meta_description_tr = input.meta_description_tr;
    if (input.meta_description_ms !== undefined) updateData.meta_description_ms = input.meta_description_ms;

    const result = await db.update(articlesTable)
      .set(updateData)
      .where(eq(articlesTable.id, input.id))
      .returning()
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Article update failed:', error);
    throw error;
  }
}

export async function deleteArticle(id: number): Promise<boolean> {
  try {
    const result = await db.delete(articlesTable)
      .where(eq(articlesTable.id, id))
      .execute();

    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Article deletion failed:', error);
    throw error;
  }
}