import { db } from '../db';
import { 
  countriesTable,
  universitiesTable,
  majorsTable,
  articlesTable,
  studentInquiriesTable
} from '../db/schema';
import { 
  type DashboardStats 
} from '../schema';
import { count, eq, gte, desc } from 'drizzle-orm';

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get today's date for filtering today's inquiries
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total counts for all main entities
    const [
      countriesCount,
      universitiesCount,
      majorsCount,
      articlesCount,
      inquiriesCount,
      todayInquiriesCount
    ] = await Promise.all([
      // Total countries
      db.select({ count: count() }).from(countriesTable).execute(),
      // Total universities
      db.select({ count: count() }).from(universitiesTable).execute(),
      // Total majors
      db.select({ count: count() }).from(majorsTable).execute(),
      // Total articles
      db.select({ count: count() }).from(articlesTable).execute(),
      // Total inquiries
      db.select({ count: count() }).from(studentInquiriesTable).execute(),
      // Today's new inquiries
      db.select({ count: count() })
        .from(studentInquiriesTable)
        .where(gte(studentInquiriesTable.created_at, today))
        .execute()
    ]);

    // Get inquiries grouped by status
    const inquiriesByStatusResults = await db.select({
      status: studentInquiriesTable.status,
      count: count()
    })
    .from(studentInquiriesTable)
    .groupBy(studentInquiriesTable.status)
    .execute();

    // Get inquiries grouped by language
    const inquiriesByLanguageResults = await db.select({
      language: studentInquiriesTable.language_code,
      count: count()
    })
    .from(studentInquiriesTable)
    .groupBy(studentInquiriesTable.language_code)
    .execute();

    // Get recent inquiries (last 10)
    const recentInquiriesResults = await db.select()
      .from(studentInquiriesTable)
      .orderBy(desc(studentInquiriesTable.created_at))
      .limit(10)
      .execute();

    // Transform grouped results into records
    const inquiries_by_status: Record<string, number> = {};
    inquiriesByStatusResults.forEach(item => {
      inquiries_by_status[item.status] = item.count;
    });

    const inquiries_by_language: Record<string, number> = {};
    inquiriesByLanguageResults.forEach(item => {
      inquiries_by_language[item.language] = item.count;
    });

    return {
      total_countries: countriesCount[0].count,
      total_universities: universitiesCount[0].count,
      total_majors: majorsCount[0].count,
      total_articles: articlesCount[0].count,
      total_inquiries: inquiriesCount[0].count,
      new_inquiries_today: todayInquiriesCount[0].count,
      inquiries_by_status,
      inquiries_by_language,
      recent_inquiries: recentInquiriesResults
    };
  } catch (error) {
    console.error('Dashboard stats fetch failed:', error);
    throw error;
  }
}

export async function getVisitorAnalytics(days: number = 30): Promise<{
  total_visits: number;
  unique_visitors: number;
  page_views: number;
  bounce_rate: number;
  top_pages: Array<{ path: string; views: number }>;
  traffic_by_language: Record<string, number>;
}> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is fetching website visitor analytics for the specified period
  return {
    total_visits: 0,
    unique_visitors: 0,
    page_views: 0,
    bounce_rate: 0,
    top_pages: [],
    traffic_by_language: {},
  };
}

export async function getContentStats(): Promise<{
  active_countries: number;
  inactive_countries: number;
  active_universities: number;
  inactive_universities: number;
  active_majors: number;
  inactive_majors: number;
  published_articles: number;
  draft_articles: number;
  featured_articles: number;
}> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is fetching content statistics broken down by status
  return {
    active_countries: 0,
    inactive_countries: 0,
    active_universities: 0,
    inactive_universities: 0,
    active_majors: 0,
    inactive_majors: 0,
    published_articles: 0,
    draft_articles: 0,
    featured_articles: 0,
  };
}

export async function getInquiryTrends(days: number = 30): Promise<Array<{
  date: string;
  count: number;
  new_count: number;
  completed_count: number;
}>> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is fetching inquiry trends over the specified period
  return [];
}