import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentInquiriesTable } from '../db/schema';
import { type GetStudentInquiriesInput } from '../schema';
import { getStudentInquiries } from '../handlers/student-inquiries';

// Simple helper function that creates test inquiries directly with database types
async function createSimpleTestInquiry(
  full_name: string,
  email: string, 
  phone: string,
  language_code: 'ar' | 'en' | 'tr' | 'ms',
  status: 'NEW' | 'CONTACTED' | 'COMPLETED' | 'ARCHIVED' = 'NEW'
) {
  const result = await db.insert(studentInquiriesTable)
    .values({
      full_name,
      email,
      phone,
      whatsapp: null,
      desired_country: null,
      study_level: null,
      desired_major: null,
      message: null,
      source_page: null,
      language_code,
      status,
      notes: null
    })
    .returning()
    .execute();
  
  return result[0];
}

describe('getStudentInquiries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty results when no inquiries exist', async () => {
    const input: GetStudentInquiriesInput = {
      page: 1,
      limit: 20
    };

    const result = await getStudentInquiries(input);

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should return all inquiries with default pagination', async () => {
    await createSimpleTestInquiry('John Doe', 'john.doe@example.com', '+1234567890', 'en');
    await createSimpleTestInquiry('Jane Smith', 'jane.smith@example.com', '+1234567891', 'tr');
    await createSimpleTestInquiry('Ahmed Ali', 'ahmed.ali@example.com', '+1234567892', 'ar');

    const input: GetStudentInquiriesInput = {
      page: 1,
      limit: 20
    };

    const result = await getStudentInquiries(input);

    expect(result.data).toHaveLength(3);
    expect(result.total).toBe(3);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    
    // Verify inquiries are ordered by created_at desc (most recent first)
    expect(result.data[0].full_name).toBe('Ahmed Ali'); // Last created
    expect(result.data[1].full_name).toBe('Jane Smith');
    expect(result.data[2].full_name).toBe('John Doe'); // First created
  });

  it('should handle pagination correctly', async () => {
    // Create 5 test inquiries
    await createSimpleTestInquiry('User 1', 'user1@example.com', '+1234567890', 'en');
    await createSimpleTestInquiry('User 2', 'user2@example.com', '+1234567891', 'tr');
    await createSimpleTestInquiry('User 3', 'user3@example.com', '+1234567892', 'ar');
    await createSimpleTestInquiry('User 4', 'user4@example.com', '+1234567893', 'en');
    await createSimpleTestInquiry('User 5', 'user5@example.com', '+1234567894', 'ms');

    // First page with limit 2
    const page1Result = await getStudentInquiries({ page: 1, limit: 2 });
    expect(page1Result.data).toHaveLength(2);
    expect(page1Result.total).toBe(5);

    // Second page with limit 2
    const page2Result = await getStudentInquiries({ page: 2, limit: 2 });
    expect(page2Result.data).toHaveLength(2);
    expect(page2Result.total).toBe(5);

    // Third page should have 1 item
    const page3Result = await getStudentInquiries({ page: 3, limit: 2 });
    expect(page3Result.data).toHaveLength(1);
    expect(page3Result.total).toBe(5);
  });

  it('should filter by status correctly', async () => {
    await createSimpleTestInquiry('John Doe', 'john.doe@example.com', '+1234567890', 'en', 'NEW');
    await createSimpleTestInquiry('Jane Smith', 'jane.smith@example.com', '+1234567891', 'tr', 'CONTACTED');
    await createSimpleTestInquiry('Ahmed Ali', 'ahmed.ali@example.com', '+1234567892', 'ar', 'COMPLETED');

    const result = await getStudentInquiries({
      page: 1,
      limit: 20,
      status: 'CONTACTED'
    });

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.data[0].full_name).toBe('Jane Smith');
    expect(result.data[0].status).toBe('CONTACTED');
  });

  it('should filter by language_code correctly', async () => {
    await createSimpleTestInquiry('John Doe', 'john.doe@example.com', '+1234567890', 'en');
    await createSimpleTestInquiry('Jane Smith', 'jane.smith@example.com', '+1234567891', 'tr');
    await createSimpleTestInquiry('Ahmed Ali', 'ahmed.ali@example.com', '+1234567892', 'ar');

    const result = await getStudentInquiries({
      page: 1,
      limit: 20,
      language_code: 'ar'
    });

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.data[0].full_name).toBe('Ahmed Ali');
    expect(result.data[0].language_code).toBe('ar');
  });

  it('should filter by date range correctly', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await createSimpleTestInquiry('John Doe', 'john.doe@example.com', '+1234567890', 'en');
    await createSimpleTestInquiry('Jane Smith', 'jane.smith@example.com', '+1234567891', 'tr');

    const result = await getStudentInquiries({
      page: 1,
      limit: 20,
      date_from: yesterday,
      date_to: tomorrow
    });

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    
    result.data.forEach(inquiry => {
      expect(inquiry.created_at).toBeInstanceOf(Date);
      expect(inquiry.created_at >= yesterday).toBe(true);
      expect(inquiry.created_at <= tomorrow).toBe(true);
    });
  });

  it('should search by full_name correctly', async () => {
    await createSimpleTestInquiry('John Doe', 'john.doe@example.com', '+1234567890', 'en');
    await createSimpleTestInquiry('Jane Smith', 'jane.smith@example.com', '+1234567891', 'tr');
    await createSimpleTestInquiry('Ahmed Ali', 'ahmed.ali@example.com', '+1234567892', 'ar');

    const result = await getStudentInquiries({
      page: 1,
      limit: 20,
      search: 'john'
    });

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.data[0].full_name).toBe('John Doe');
  });

  it('should handle case-insensitive search', async () => {
    await createSimpleTestInquiry('John Doe', 'john.doe@example.com', '+1234567890', 'en');
    await createSimpleTestInquiry('Jane Smith', 'jane.smith@example.com', '+1234567891', 'tr');

    const result = await getStudentInquiries({
      page: 1,
      limit: 20,
      search: 'JANE'
    });

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.data[0].full_name).toBe('Jane Smith');
  });

  it('should combine multiple filters correctly', async () => {
    await createSimpleTestInquiry('John Doe', 'john.doe@example.com', '+1234567890', 'en', 'NEW');
    await createSimpleTestInquiry('Jane Smith', 'jane.smith@example.com', '+1234567891', 'tr', 'CONTACTED');
    await createSimpleTestInquiry('Ahmed Ali', 'ahmed.ali@example.com', '+1234567892', 'ar', 'NEW');

    const result = await getStudentInquiries({
      page: 1,
      limit: 20,
      status: 'NEW',
      language_code: 'en',
      search: 'john'
    });

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.data[0].full_name).toBe('John Doe');
    expect(result.data[0].status).toBe('NEW');
    expect(result.data[0].language_code).toBe('en');
  });

  it('should return empty results when filters match nothing', async () => {
    await createSimpleTestInquiry('John Doe', 'john.doe@example.com', '+1234567890', 'en', 'NEW');
    await createSimpleTestInquiry('Jane Smith', 'jane.smith@example.com', '+1234567891', 'tr', 'CONTACTED');

    const result = await getStudentInquiries({
      page: 1,
      limit: 20,
      status: 'COMPLETED' // No inquiries with this status
    });

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should handle date_from filter only', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await createSimpleTestInquiry('John Doe', 'john.doe@example.com', '+1234567890', 'en');
    await createSimpleTestInquiry('Jane Smith', 'jane.smith@example.com', '+1234567891', 'tr');

    const result = await getStudentInquiries({
      page: 1,
      limit: 20,
      date_from: yesterday
    });

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    result.data.forEach(inquiry => {
      expect(inquiry.created_at >= yesterday).toBe(true);
    });
  });

  it('should handle date_to filter only', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await createSimpleTestInquiry('John Doe', 'john.doe@example.com', '+1234567890', 'en');
    await createSimpleTestInquiry('Jane Smith', 'jane.smith@example.com', '+1234567891', 'tr');

    const result = await getStudentInquiries({
      page: 1,
      limit: 20,
      date_to: tomorrow
    });

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    result.data.forEach(inquiry => {
      expect(inquiry.created_at <= tomorrow).toBe(true);
    });
  });

  it('should validate all returned fields are correct', async () => {
    await createSimpleTestInquiry('John Doe', 'john.doe@example.com', '+1234567890', 'en');

    const result = await getStudentInquiries({
      page: 1,
      limit: 20
    });

    expect(result.data).toHaveLength(1);
    const inquiry = result.data[0];

    expect(inquiry.id).toBeDefined();
    expect(inquiry.full_name).toBe('John Doe');
    expect(inquiry.email).toBe('john.doe@example.com');
    expect(inquiry.phone).toBe('+1234567890');
    expect(inquiry.whatsapp).toBeNull();
    expect(inquiry.desired_country).toBeNull();
    expect(inquiry.study_level).toBeNull();
    expect(inquiry.desired_major).toBeNull();
    expect(inquiry.message).toBeNull();
    expect(inquiry.source_page).toBeNull();
    expect(inquiry.language_code).toBe('en');
    expect(inquiry.status).toBe('NEW');
    expect(inquiry.notes).toBeNull();
    expect(inquiry.created_at).toBeInstanceOf(Date);
    expect(inquiry.updated_at).toBeInstanceOf(Date);
  });

  it('should handle complex inquiry data with proper types', async () => {
    // Create inquiry with complete data
    const result = await db.insert(studentInquiriesTable)
      .values({
        full_name: 'Ahmed Hassan',
        email: 'ahmed.hassan@example.com',
        phone: '+905551234567',
        whatsapp: '+905551234567',
        desired_country: 'Turkey',
        study_level: 'MASTER',
        desired_major: 'Computer Engineering',
        message: 'I want to study Computer Engineering in Turkey',
        source_page: '/programs/turkey/computer-engineering',
        language_code: 'ar',
        status: 'CONTACTED',
        notes: 'Follow up required'
      })
      .returning()
      .execute();

    const inquiry = await getStudentInquiries({
      page: 1,
      limit: 20
    });

    expect(inquiry.data).toHaveLength(1);
    const retrievedInquiry = inquiry.data[0];

    expect(retrievedInquiry.full_name).toBe('Ahmed Hassan');
    expect(retrievedInquiry.email).toBe('ahmed.hassan@example.com');
    expect(retrievedInquiry.phone).toBe('+905551234567');
    expect(retrievedInquiry.whatsapp).toBe('+905551234567');
    expect(retrievedInquiry.desired_country).toBe('Turkey');
    expect(retrievedInquiry.study_level).toBe('MASTER');
    expect(retrievedInquiry.desired_major).toBe('Computer Engineering');
    expect(retrievedInquiry.message).toBe('I want to study Computer Engineering in Turkey');
    expect(retrievedInquiry.source_page).toBe('/programs/turkey/computer-engineering');
    expect(retrievedInquiry.language_code).toBe('ar');
    expect(retrievedInquiry.status).toBe('CONTACTED');
    expect(retrievedInquiry.notes).toBe('Follow up required');
  });
});