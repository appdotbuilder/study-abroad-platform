import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { faqsTable } from '../db/schema';
import { type CreateFAQInput } from '../schema';
import { 
  getFAQs, 
  getFAQById, 
  getActiveFAQs, 
  createFAQ, 
  updateFAQ, 
  deleteFAQ, 
  reorderFAQs 
} from '../handlers/faqs';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateFAQInput = {
  question_ar: 'ما هي متطلبات القبول؟',
  question_en: 'What are the admission requirements?',
  question_tr: 'Kabul gereksinimleri nelerdir?',
  question_ms: 'Apakah syarat kemasukan?',
  answer_ar: 'المتطلبات تشمل الشهادة الثانوية',
  answer_en: 'Requirements include high school certificate',
  answer_tr: 'Gereksinimler lise diploması içerir',
  answer_ms: 'Keperluan termasuk sijil sekolah menengah',
  order_index: 1,
  category: 'admission',
  status: 'ACTIVE',
};

const testInputWithDefaults: CreateFAQInput = {
  question_ar: 'سؤال آخر',
  question_en: 'Another question',
  question_tr: 'Başka bir soru',
  question_ms: 'Soalan lain',
  answer_ar: 'جواب آخر',
  answer_en: 'Another answer',
  answer_tr: 'Başka bir cevap',
  answer_ms: 'Jawapan lain',
  order_index: 2,
  status: 'ACTIVE',
};

describe('FAQ Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createFAQ', () => {
    it('should create a FAQ with all fields', async () => {
      const result = await createFAQ(testInput);

      expect(result.question_ar).toEqual('ما هي متطلبات القبول؟');
      expect(result.question_en).toEqual('What are the admission requirements?');
      expect(result.question_tr).toEqual('Kabul gereksinimleri nelerdir?');
      expect(result.question_ms).toEqual('Apakah syarat kemasukan?');
      expect(result.answer_ar).toEqual('المتطلبات تشمل الشهادة الثانوية');
      expect(result.answer_en).toEqual('Requirements include high school certificate');
      expect(result.answer_tr).toEqual('Gereksinimler lise diploması içerir');
      expect(result.answer_ms).toEqual('Keperluan termasuk sijil sekolah menengah');
      expect(result.order_index).toEqual(1);
      expect(result.category).toEqual('admission');
      expect(result.status).toEqual('ACTIVE');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a FAQ with default values', async () => {
      const result = await createFAQ(testInputWithDefaults);

      expect(result.question_ar).toEqual('سؤال آخر');
      expect(result.order_index).toEqual(2);
      expect(result.category).toBeNull();
      expect(result.status).toEqual('ACTIVE');
      expect(result.id).toBeDefined();
    });

    it('should save FAQ to database', async () => {
      const result = await createFAQ(testInput);

      const faqs = await db.select()
        .from(faqsTable)
        .where(eq(faqsTable.id, result.id))
        .execute();

      expect(faqs).toHaveLength(1);
      expect(faqs[0].question_en).toEqual('What are the admission requirements?');
      expect(faqs[0].category).toEqual('admission');
      expect(faqs[0].status).toEqual('ACTIVE');
    });
  });

  describe('getFAQById', () => {
    it('should get FAQ by ID', async () => {
      const created = await createFAQ(testInput);
      const result = await getFAQById(created.id);

      expect(result).toBeDefined();
      expect(result!.id).toEqual(created.id);
      expect(result!.question_en).toEqual('What are the admission requirements?');
      expect(result!.category).toEqual('admission');
    });

    it('should return null for non-existent FAQ', async () => {
      const result = await getFAQById(999);
      expect(result).toBeNull();
    });
  });

  describe('getFAQs', () => {
    it('should get all FAQs ordered by index', async () => {
      const faq1 = await createFAQ({ ...testInput, order_index: 3 });
      const faq2 = await createFAQ({ ...testInputWithDefaults, order_index: 1 });
      const faq3 = await createFAQ({ ...testInput, question_en: 'Third FAQ', order_index: 2, category: 'general' });

      const results = await getFAQs();

      expect(results).toHaveLength(3);
      expect(results[0].id).toEqual(faq2.id); // order_index 1
      expect(results[1].id).toEqual(faq3.id); // order_index 2
      expect(results[2].id).toEqual(faq1.id); // order_index 3
    });

    it('should filter FAQs by category', async () => {
      await createFAQ({ ...testInput, category: 'admission' });
      await createFAQ({ ...testInput, question_en: 'General FAQ', category: 'general' });
      await createFAQ({ ...testInput, question_en: 'Another admission FAQ', category: 'admission' });

      const results = await getFAQs('admission');

      expect(results).toHaveLength(2);
      results.forEach(faq => {
        expect(faq.category).toEqual('admission');
      });
    });

    it('should return empty array when no FAQs match category', async () => {
      await createFAQ({ ...testInput, category: 'admission' });

      const results = await getFAQs('nonexistent');

      expect(results).toHaveLength(0);
    });
  });

  describe('getActiveFAQs', () => {
    it('should get only active FAQs', async () => {
      await createFAQ({ ...testInput, status: 'ACTIVE' });
      await createFAQ({ ...testInputWithDefaults, status: 'INACTIVE' });
      await createFAQ({ ...testInput, question_en: 'Third FAQ', status: 'ACTIVE' });

      const results = await getActiveFAQs();

      expect(results).toHaveLength(2);
      results.forEach(faq => {
        expect(faq.status).toEqual('ACTIVE');
      });
    });

    it('should filter active FAQs by category', async () => {
      await createFAQ({ ...testInput, category: 'admission', status: 'ACTIVE' });
      await createFAQ({ ...testInput, question_en: 'General FAQ', category: 'general', status: 'ACTIVE' });
      await createFAQ({ ...testInput, question_en: 'Inactive admission FAQ', category: 'admission', status: 'INACTIVE' });

      const results = await getActiveFAQs('admission');

      expect(results).toHaveLength(1);
      expect(results[0].category).toEqual('admission');
      expect(results[0].status).toEqual('ACTIVE');
    });

    it('should return active FAQs ordered by index', async () => {
      const faq1 = await createFAQ({ ...testInput, order_index: 5, status: 'ACTIVE' });
      const faq2 = await createFAQ({ ...testInputWithDefaults, order_index: 2, status: 'ACTIVE' });

      const results = await getActiveFAQs();

      expect(results).toHaveLength(2);
      expect(results[0].id).toEqual(faq2.id); // order_index 2
      expect(results[1].id).toEqual(faq1.id); // order_index 5
    });
  });

  describe('updateFAQ', () => {
    it('should update FAQ with partial data', async () => {
      const created = await createFAQ(testInput);

      const result = await updateFAQ(created.id, {
        question_en: 'Updated question',
        status: 'INACTIVE'
      });

      expect(result).toBeDefined();
      expect(result!.question_en).toEqual('Updated question');
      expect(result!.status).toEqual('INACTIVE');
      expect(result!.question_ar).toEqual(testInput.question_ar); // Unchanged
      expect(result!.updated_at).toBeInstanceOf(Date);
    });

    it('should update category to null', async () => {
      const created = await createFAQ(testInput);

      const result = await updateFAQ(created.id, {
        category: null
      });

      expect(result).toBeDefined();
      expect(result!.category).toBeNull();
    });

    it('should return null for non-existent FAQ', async () => {
      const result = await updateFAQ(999, {
        question_en: 'Updated question'
      });

      expect(result).toBeNull();
    });

    it('should save updated data to database', async () => {
      const created = await createFAQ(testInput);

      await updateFAQ(created.id, {
        question_en: 'Database updated question',
        order_index: 99
      });

      const faqs = await db.select()
        .from(faqsTable)
        .where(eq(faqsTable.id, created.id))
        .execute();

      expect(faqs).toHaveLength(1);
      expect(faqs[0].question_en).toEqual('Database updated question');
      expect(faqs[0].order_index).toEqual(99);
    });
  });

  describe('deleteFAQ', () => {
    it('should delete existing FAQ', async () => {
      const created = await createFAQ(testInput);

      const result = await deleteFAQ(created.id);
      expect(result).toBe(true);

      // Verify deletion
      const faqs = await db.select()
        .from(faqsTable)
        .where(eq(faqsTable.id, created.id))
        .execute();

      expect(faqs).toHaveLength(0);
    });

    it('should return false for non-existent FAQ', async () => {
      const result = await deleteFAQ(999);
      expect(result).toBe(false);
    });
  });

  describe('reorderFAQs', () => {
    it('should reorder multiple FAQs', async () => {
      const faq1 = await createFAQ({ ...testInput, order_index: 1 });
      const faq2 = await createFAQ({ ...testInputWithDefaults, order_index: 2 });
      const faq3 = await createFAQ({ ...testInput, question_en: 'Third FAQ', order_index: 3 });

      const orderMap = [
        { id: faq1.id, order_index: 10 },
        { id: faq2.id, order_index: 20 },
        { id: faq3.id, order_index: 5 },
      ];

      const result = await reorderFAQs(orderMap);
      expect(result).toBe(true);

      // Verify the new order
      const faqs = await getFAQs();
      expect(faqs).toHaveLength(3);
      expect(faqs[0].id).toEqual(faq3.id); // order_index 5
      expect(faqs[1].id).toEqual(faq1.id); // order_index 10
      expect(faqs[2].id).toEqual(faq2.id); // order_index 20
    });

    it('should handle empty order map', async () => {
      const result = await reorderFAQs([]);
      expect(result).toBe(true);
    });

    it('should handle reordering with non-existent FAQ IDs', async () => {
      const faq1 = await createFAQ(testInput);

      const orderMap = [
        { id: faq1.id, order_index: 10 },
        { id: 999, order_index: 20 }, // Non-existent
      ];

      const result = await reorderFAQs(orderMap);
      expect(result).toBe(false); // Should fail because one FAQ doesn't exist
    });

    it('should update updated_at timestamp during reorder', async () => {
      const faq = await createFAQ(testInput);
      const originalUpdatedAt = faq.updated_at;

      // Add small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await reorderFAQs([{ id: faq.id, order_index: 99 }]);

      const updatedFaq = await getFAQById(faq.id);
      expect(updatedFaq!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      expect(updatedFaq!.order_index).toEqual(99);
    });
  });
});