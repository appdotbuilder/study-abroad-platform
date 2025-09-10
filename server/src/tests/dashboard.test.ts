import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  countriesTable,
  universitiesTable,
  majorsTable,
  articlesTable,
  studentInquiriesTable
} from '../db/schema';
import { getDashboardStats } from '../handlers/dashboard';
import { eq } from 'drizzle-orm';

describe('getDashboardStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty dashboard stats when no data exists', async () => {
    const result = await getDashboardStats();

    expect(result.total_countries).toEqual(0);
    expect(result.total_universities).toEqual(0);
    expect(result.total_majors).toEqual(0);
    expect(result.total_articles).toEqual(0);
    expect(result.total_inquiries).toEqual(0);
    expect(result.new_inquiries_today).toEqual(0);
    expect(result.inquiries_by_status).toEqual({});
    expect(result.inquiries_by_language).toEqual({});
    expect(result.recent_inquiries).toHaveLength(0);
  });

  it('should count total entities correctly', async () => {
    // Create test data
    await db.insert(countriesTable).values([
      {
        name_ar: 'تركيا',
        name_en: 'Turkey',
        name_tr: 'Türkiye',
        name_ms: 'Turki',
        slug: 'turkey',
        status: 'ACTIVE'
      },
      {
        name_ar: 'ماليزيا',
        name_en: 'Malaysia',
        name_tr: 'Malezya',
        name_ms: 'Malaysia',
        slug: 'malaysia',
        status: 'ACTIVE'
      }
    ]).execute();

    const countries = await db.select().from(countriesTable).execute();
    
    await db.insert(universitiesTable).values([
      {
        name_ar: 'جامعة اسطنبول',
        name_en: 'Istanbul University',
        name_tr: 'İstanbul Üniversitesi',
        name_ms: 'Universiti Istanbul',
        slug: 'istanbul-university',
        country_id: countries[0].id,
        status: 'ACTIVE'
      }
    ]).execute();

    await db.insert(majorsTable).values([
      {
        name_ar: 'هندسة الحاسوب',
        name_en: 'Computer Engineering',
        name_tr: 'Bilgisayar Mühendisliği',
        name_ms: 'Kejuruteraan Komputer',
        slug: 'computer-engineering',
        status: 'ACTIVE'
      },
      {
        name_ar: 'الطب',
        name_en: 'Medicine',
        name_tr: 'Tıp',
        name_ms: 'Perubatan',
        slug: 'medicine',
        status: 'ACTIVE'
      }
    ]).execute();

    await db.insert(articlesTable).values([
      {
        title_ar: 'مقال تجريبي',
        title_en: 'Test Article',
        title_tr: 'Test Makalesi',
        title_ms: 'Artikel Ujian',
        slug: 'test-article',
        status: 'ACTIVE',
        is_featured: false
      }
    ]).execute();

    const result = await getDashboardStats();

    expect(result.total_countries).toEqual(2);
    expect(result.total_universities).toEqual(1);
    expect(result.total_majors).toEqual(2);
    expect(result.total_articles).toEqual(1);
  });

  it('should count inquiries correctly with grouping by status and language', async () => {
    // Create test inquiries with different statuses and languages
    await db.insert(studentInquiriesTable).values([
      {
        full_name: 'Ahmed Ali',
        email: 'ahmed@example.com',
        phone: '+90123456789',
        language_code: 'ar',
        status: 'NEW'
      },
      {
        full_name: 'John Smith',
        email: 'john@example.com',
        phone: '+90123456790',
        language_code: 'en',
        status: 'NEW'
      },
      {
        full_name: 'Mehmet Yılmaz',
        email: 'mehmet@example.com',
        phone: '+90123456791',
        language_code: 'tr',
        status: 'CONTACTED'
      },
      {
        full_name: 'Ahmad Hassan',
        email: 'ahmad@example.com',
        phone: '+90123456792',
        language_code: 'ar',
        status: 'COMPLETED'
      }
    ]).execute();

    const result = await getDashboardStats();

    expect(result.total_inquiries).toEqual(4);
    expect(result.inquiries_by_status['NEW']).toEqual(2);
    expect(result.inquiries_by_status['CONTACTED']).toEqual(1);
    expect(result.inquiries_by_status['COMPLETED']).toEqual(1);
    expect(result.inquiries_by_language['ar']).toEqual(2);
    expect(result.inquiries_by_language['en']).toEqual(1);
    expect(result.inquiries_by_language['tr']).toEqual(1);
  });

  it('should count today inquiries correctly', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Create inquiry from today
    await db.insert(studentInquiriesTable).values({
      full_name: 'Today User',
      email: 'today@example.com',
      phone: '+90123456789',
      language_code: 'en',
      status: 'NEW'
    }).execute();

    // Create inquiry from yesterday by updating its created_at
    const yesterdayInquiry = await db.insert(studentInquiriesTable).values({
      full_name: 'Yesterday User',
      email: 'yesterday@example.com',
      phone: '+90123456790',
      language_code: 'en',
      status: 'NEW'
    }).returning().execute();

    // Update the created_at to yesterday
    await db.update(studentInquiriesTable)
      .set({ created_at: yesterday })
      .where(eq(studentInquiriesTable.id, yesterdayInquiry[0].id))
      .execute();

    const result = await getDashboardStats();

    expect(result.total_inquiries).toEqual(2);
    expect(result.new_inquiries_today).toEqual(1);
  });

  it('should return recent inquiries in correct order', async () => {
    // Create multiple inquiries
    const inquiries = [];
    for (let i = 1; i <= 12; i++) {
      inquiries.push({
        full_name: `User ${i}`,
        email: `user${i}@example.com`,
        phone: `+9012345678${i}`,
        language_code: 'en' as const,
        status: 'NEW' as const
      });
    }

    await db.insert(studentInquiriesTable).values(inquiries).execute();

    const result = await getDashboardStats();

    // Should return only 10 most recent inquiries
    expect(result.recent_inquiries).toHaveLength(10);
    
    // Should be ordered by most recent first
    for (let i = 0; i < result.recent_inquiries.length - 1; i++) {
      expect(result.recent_inquiries[i].created_at >= result.recent_inquiries[i + 1].created_at).toBe(true);
    }

    // Most recent should be User 12 (last created)
    expect(result.recent_inquiries[0].full_name).toEqual('User 12');
    expect(result.recent_inquiries[0].email).toEqual('user12@example.com');
  });

  it('should handle mixed data scenarios correctly', async () => {
    // Create country first for university foreign key
    const country = await db.insert(countriesTable).values({
      name_ar: 'تركيا',
      name_en: 'Turkey',
      name_tr: 'Türkiye',
      name_ms: 'Turki',
      slug: 'turkey',
      status: 'ACTIVE'
    }).returning().execute();

    // Create mixed data
    await db.insert(universitiesTable).values({
      name_ar: 'جامعة اسطنبول',
      name_en: 'Istanbul University',
      name_tr: 'İstanbul Üniversitesi',
      name_ms: 'Universiti Istanbul',
      slug: 'istanbul-university',
      country_id: country[0].id,
      status: 'INACTIVE'
    }).execute();

    await db.insert(majorsTable).values({
      name_ar: 'هندسة الحاسوب',
      name_en: 'Computer Engineering',
      name_tr: 'Bilgisayar Mühendisliği',
      name_ms: 'Kejuruteraan Komputer',
      slug: 'computer-engineering',
      status: 'ACTIVE'
    }).execute();

    await db.insert(studentInquiriesTable).values([
      {
        full_name: 'Multi User 1',
        email: 'multi1@example.com',
        phone: '+90123456789',
        language_code: 'ms',
        status: 'ARCHIVED'
      },
      {
        full_name: 'Multi User 2',
        email: 'multi2@example.com',
        phone: '+90123456790',
        language_code: 'ms',
        status: 'ARCHIVED'
      }
    ]).execute();

    const result = await getDashboardStats();

    expect(result.total_countries).toEqual(1);
    expect(result.total_universities).toEqual(1);
    expect(result.total_majors).toEqual(1);
    expect(result.total_inquiries).toEqual(2);
    expect(result.inquiries_by_status['ARCHIVED']).toEqual(2);
    expect(result.inquiries_by_language['ms']).toEqual(2);
    expect(result.recent_inquiries).toHaveLength(2);
  });

  it('should validate all fields are present in response', async () => {
    const result = await getDashboardStats();

    // Verify all required fields exist
    expect(result).toHaveProperty('total_countries');
    expect(result).toHaveProperty('total_universities');
    expect(result).toHaveProperty('total_majors');
    expect(result).toHaveProperty('total_articles');
    expect(result).toHaveProperty('total_inquiries');
    expect(result).toHaveProperty('new_inquiries_today');
    expect(result).toHaveProperty('inquiries_by_status');
    expect(result).toHaveProperty('inquiries_by_language');
    expect(result).toHaveProperty('recent_inquiries');

    // Verify correct types
    expect(typeof result.total_countries).toBe('number');
    expect(typeof result.total_universities).toBe('number');
    expect(typeof result.total_majors).toBe('number');
    expect(typeof result.total_articles).toBe('number');
    expect(typeof result.total_inquiries).toBe('number');
    expect(typeof result.new_inquiries_today).toBe('number');
    expect(typeof result.inquiries_by_status).toBe('object');
    expect(typeof result.inquiries_by_language).toBe('object');
    expect(Array.isArray(result.recent_inquiries)).toBe(true);
  });
});