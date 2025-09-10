import { db } from '../db';
import { faqsTable } from '../db/schema';
import { 
  type FAQ, 
  type CreateFAQInput 
} from '../schema';
import { eq, and, asc } from 'drizzle-orm';

export async function getFAQs(category?: string): Promise<FAQ[]> {
  try {
    const baseQuery = db.select().from(faqsTable);

    if (category) {
      const results = await baseQuery
        .where(eq(faqsTable.category, category))
        .orderBy(asc(faqsTable.order_index))
        .execute();
      return results;
    } else {
      const results = await baseQuery
        .orderBy(asc(faqsTable.order_index))
        .execute();
      return results;
    }
  } catch (error) {
    console.error('Get FAQs failed:', error);
    throw error;
  }
}

export async function getFAQById(id: number): Promise<FAQ | null> {
  try {
    const results = await db.select()
      .from(faqsTable)
      .where(eq(faqsTable.id, id))
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Get FAQ by ID failed:', error);
    throw error;
  }
}

export async function getActiveFAQs(category?: string): Promise<FAQ[]> {
  try {
    const baseQuery = db.select().from(faqsTable);

    if (category) {
      const results = await baseQuery
        .where(and(
          eq(faqsTable.status, 'ACTIVE'),
          eq(faqsTable.category, category)
        ))
        .orderBy(asc(faqsTable.order_index))
        .execute();
      return results;
    } else {
      const results = await baseQuery
        .where(eq(faqsTable.status, 'ACTIVE'))
        .orderBy(asc(faqsTable.order_index))
        .execute();
      return results;
    }
  } catch (error) {
    console.error('Get active FAQs failed:', error);
    throw error;
  }
}

export async function createFAQ(input: CreateFAQInput): Promise<FAQ> {
  try {
    const result = await db.insert(faqsTable)
      .values({
        question_ar: input.question_ar,
        question_en: input.question_en,
        question_tr: input.question_tr,
        question_ms: input.question_ms,
        answer_ar: input.answer_ar,
        answer_en: input.answer_en,
        answer_tr: input.answer_tr,
        answer_ms: input.answer_ms,
        order_index: input.order_index,
        category: input.category || null,
        status: input.status,
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('FAQ creation failed:', error);
    throw error;
  }
}

export async function updateFAQ(id: number, input: Partial<CreateFAQInput>): Promise<FAQ | null> {
  try {
    const updateData: any = {
      updated_at: new Date(),
    };

    // Only include fields that are provided in the input
    if (input.question_ar !== undefined) updateData['question_ar'] = input.question_ar;
    if (input.question_en !== undefined) updateData['question_en'] = input.question_en;
    if (input.question_tr !== undefined) updateData['question_tr'] = input.question_tr;
    if (input.question_ms !== undefined) updateData['question_ms'] = input.question_ms;
    if (input.answer_ar !== undefined) updateData['answer_ar'] = input.answer_ar;
    if (input.answer_en !== undefined) updateData['answer_en'] = input.answer_en;
    if (input.answer_tr !== undefined) updateData['answer_tr'] = input.answer_tr;
    if (input.answer_ms !== undefined) updateData['answer_ms'] = input.answer_ms;
    if (input.order_index !== undefined) updateData['order_index'] = input.order_index;
    if (input.category !== undefined) updateData['category'] = input.category;
    if (input.status !== undefined) updateData['status'] = input.status;

    const results = await db.update(faqsTable)
      .set(updateData)
      .where(eq(faqsTable.id, id))
      .returning()
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('FAQ update failed:', error);
    throw error;
  }
}

export async function deleteFAQ(id: number): Promise<boolean> {
  try {
    const results = await db.delete(faqsTable)
      .where(eq(faqsTable.id, id))
      .returning()
      .execute();

    return results.length > 0;
  } catch (error) {
    console.error('FAQ deletion failed:', error);
    throw error;
  }
}

export async function reorderFAQs(faqOrderMap: { id: number; order_index: number }[]): Promise<boolean> {
  try {
    if (faqOrderMap.length === 0) {
      return true;
    }

    // Use a transaction to ensure all updates succeed or fail together
    const results = await Promise.all(
      faqOrderMap.map(({ id, order_index }) =>
        db.update(faqsTable)
          .set({ 
            order_index,
            updated_at: new Date()
          })
          .where(eq(faqsTable.id, id))
          .returning()
          .execute()
      )
    );

    // Check if all updates were successful (each result should have length > 0)
    return results.every(result => result.length > 0);
  } catch (error) {
    console.error('FAQ reordering failed:', error);
    throw error;
  }
}