import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { settingsTable } from '../db/schema';
import { type UpdateSettingsInput } from '../schema';
import { eq } from 'drizzle-orm';
import {
  getAllSettings,
  getSettingByKey,
  getSettingsByCategory,
  updateSetting,
  updateMultipleSettings,
  getSupportedLanguages,
  getEmailSettings,
  getSEOSettings,
} from '../handlers/settings';

describe('Settings Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('getAllSettings', () => {
    it('should return empty array when no settings exist', async () => {
      const result = await getAllSettings();
      expect(result).toEqual([]);
    });

    it('should return all settings', async () => {
      // Create test settings
      await db.insert(settingsTable)
        .values([
          { key: 'site_name', value: 'Test Site', category: 'general' },
          { key: 'smtp_host', value: 'smtp.test.com', category: 'email' },
        ])
        .execute();

      const result = await getAllSettings();
      
      expect(result).toHaveLength(2);
      expect(result.some(s => s.key === 'site_name')).toBe(true);
      expect(result.some(s => s.key === 'smtp_host')).toBe(true);
    });
  });

  describe('getSettingByKey', () => {
    it('should return null for non-existent setting', async () => {
      const result = await getSettingByKey('non_existent_key');
      expect(result).toBeNull();
    });

    it('should return setting by key', async () => {
      // Create test setting
      await db.insert(settingsTable)
        .values({
          key: 'site_name',
          value: 'Test Site',
          description: 'Site name setting',
          category: 'general',
        })
        .execute();

      const result = await getSettingByKey('site_name');
      
      expect(result).not.toBeNull();
      expect(result?.key).toBe('site_name');
      expect(result?.value).toBe('Test Site');
      expect(result?.description).toBe('Site name setting');
      expect(result?.category).toBe('general');
      expect(result?.created_at).toBeInstanceOf(Date);
      expect(result?.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('getSettingsByCategory', () => {
    it('should return empty array for non-existent category', async () => {
      const result = await getSettingsByCategory('non_existent');
      expect(result).toEqual([]);
    });

    it('should return settings by category', async () => {
      // Create test settings
      await db.insert(settingsTable)
        .values([
          { key: 'smtp_host', value: 'smtp.test.com', category: 'email' },
          { key: 'smtp_port', value: '587', category: 'email' },
          { key: 'site_name', value: 'Test Site', category: 'general' },
        ])
        .execute();

      const emailSettings = await getSettingsByCategory('email');
      
      expect(emailSettings).toHaveLength(2);
      expect(emailSettings.every(s => s.category === 'email')).toBe(true);
      expect(emailSettings.some(s => s.key === 'smtp_host')).toBe(true);
      expect(emailSettings.some(s => s.key === 'smtp_port')).toBe(true);
    });

    it('should handle null category', async () => {
      // Create setting with null category
      await db.insert(settingsTable)
        .values({
          key: 'uncategorized_setting',
          value: 'test_value',
          category: null,
        })
        .execute();

      const result = await getSettingsByCategory('null');
      expect(result).toEqual([]);
    });
  });

  describe('updateSetting', () => {
    it('should create new setting when key does not exist', async () => {
      const input: UpdateSettingsInput = {
        key: 'new_setting',
        value: 'new_value',
      };

      const result = await updateSetting(input);
      
      expect(result).not.toBeNull();
      expect(result?.key).toBe('new_setting');
      expect(result?.value).toBe('new_value');
      expect(result?.created_at).toBeInstanceOf(Date);
      expect(result?.updated_at).toBeInstanceOf(Date);

      // Verify it was saved to database
      const saved = await db.select()
        .from(settingsTable)
        .where(eq(settingsTable.key, 'new_setting'))
        .execute();

      expect(saved).toHaveLength(1);
      expect(saved[0].value).toBe('new_value');
    });

    it('should update existing setting', async () => {
      // Create existing setting
      await db.insert(settingsTable)
        .values({
          key: 'existing_setting',
          value: 'old_value',
          category: 'test',
        })
        .execute();

      const input: UpdateSettingsInput = {
        key: 'existing_setting',
        value: 'updated_value',
      };

      const result = await updateSetting(input);
      
      expect(result).not.toBeNull();
      expect(result?.key).toBe('existing_setting');
      expect(result?.value).toBe('updated_value');
      expect(result?.category).toBe('test'); // Should preserve existing category

      // Verify database was updated
      const updated = await db.select()
        .from(settingsTable)
        .where(eq(settingsTable.key, 'existing_setting'))
        .execute();

      expect(updated).toHaveLength(1);
      expect(updated[0].value).toBe('updated_value');
    });
  });

  describe('updateMultipleSettings', () => {
    it('should update multiple settings successfully', async () => {
      // Create one existing setting
      await db.insert(settingsTable)
        .values({
          key: 'existing_key',
          value: 'old_value',
        })
        .execute();

      const settings: UpdateSettingsInput[] = [
        { key: 'existing_key', value: 'updated_value' },
        { key: 'new_key_1', value: 'value_1' },
        { key: 'new_key_2', value: 'value_2' },
      ];

      const result = await updateMultipleSettings(settings);
      
      expect(result).toBe(true);

      // Verify all settings were updated/created
      const allSettings = await db.select()
        .from(settingsTable)
        .execute();

      expect(allSettings).toHaveLength(3);
      
      const existingKey = allSettings.find(s => s.key === 'existing_key');
      expect(existingKey?.value).toBe('updated_value');
      
      const newKey1 = allSettings.find(s => s.key === 'new_key_1');
      expect(newKey1?.value).toBe('value_1');
      
      const newKey2 = allSettings.find(s => s.key === 'new_key_2');
      expect(newKey2?.value).toBe('value_2');
    });

    it('should handle empty settings array', async () => {
      const result = await updateMultipleSettings([]);
      expect(result).toBe(true);
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return default languages when setting does not exist', async () => {
      const result = await getSupportedLanguages();
      expect(result).toEqual(['ar', 'en', 'tr', 'ms']);
    });

    it('should return languages from setting when exists', async () => {
      // Create supported languages setting
      await db.insert(settingsTable)
        .values({
          key: 'supported_languages',
          value: JSON.stringify(['en', 'ar', 'fr']),
        })
        .execute();

      const result = await getSupportedLanguages();
      expect(result).toEqual(['en', 'ar', 'fr']);
    });

    it('should return default languages when setting value is invalid JSON', async () => {
      // Create setting with invalid JSON
      await db.insert(settingsTable)
        .values({
          key: 'supported_languages',
          value: 'invalid json',
        })
        .execute();

      const result = await getSupportedLanguages();
      expect(result).toEqual(['ar', 'en', 'tr', 'ms']);
    });

    it('should return default languages when setting value is not an array', async () => {
      // Create setting with non-array JSON
      await db.insert(settingsTable)
        .values({
          key: 'supported_languages',
          value: JSON.stringify({ languages: ['en', 'ar'] }),
        })
        .execute();

      const result = await getSupportedLanguages();
      expect(result).toEqual(['ar', 'en', 'tr', 'ms']);
    });
  });

  describe('getEmailSettings', () => {
    it('should return empty array when no email settings exist', async () => {
      const result = await getEmailSettings();
      expect(result).toEqual([]);
    });

    it('should return email category settings', async () => {
      // Create mixed settings
      await db.insert(settingsTable)
        .values([
          { key: 'smtp_host', value: 'smtp.test.com', category: 'email' },
          { key: 'smtp_port', value: '587', category: 'email' },
          { key: 'site_name', value: 'Test Site', category: 'general' },
        ])
        .execute();

      const result = await getEmailSettings();
      
      expect(result).toHaveLength(2);
      expect(result.every(s => s.category === 'email')).toBe(true);
      expect(result.some(s => s.key === 'smtp_host')).toBe(true);
      expect(result.some(s => s.key === 'smtp_port')).toBe(true);
    });
  });

  describe('getSEOSettings', () => {
    it('should return empty array when no SEO settings exist', async () => {
      const result = await getSEOSettings();
      expect(result).toEqual([]);
    });

    it('should return SEO category settings', async () => {
      // Create mixed settings
      await db.insert(settingsTable)
        .values([
          { key: 'meta_title', value: 'Default Title', category: 'seo' },
          { key: 'meta_description', value: 'Default Description', category: 'seo' },
          { key: 'site_name', value: 'Test Site', category: 'general' },
        ])
        .execute();

      const result = await getSEOSettings();
      
      expect(result).toHaveLength(2);
      expect(result.every(s => s.category === 'seo')).toBe(true);
      expect(result.some(s => s.key === 'meta_title')).toBe(true);
      expect(result.some(s => s.key === 'meta_description')).toBe(true);
    });
  });

  describe('Edge cases and data validation', () => {
    it('should handle settings with all required and optional fields', async () => {
      const setting = {
        key: 'complex_setting',
        value: 'complex_value',
        description: 'A complex setting for testing',
        category: 'test_category',
      };

      await db.insert(settingsTable)
        .values(setting)
        .execute();

      const result = await getSettingByKey('complex_setting');
      
      expect(result).not.toBeNull();
      expect(result?.key).toBe(setting.key);
      expect(result?.value).toBe(setting.value);
      expect(result?.description).toBe(setting.description);
      expect(result?.category).toBe(setting.category);
      expect(result?.id).toBeDefined();
      expect(result?.created_at).toBeInstanceOf(Date);
      expect(result?.updated_at).toBeInstanceOf(Date);
    });

    it('should preserve existing fields when updating setting value only', async () => {
      // Create setting with all fields
      await db.insert(settingsTable)
        .values({
          key: 'preserve_test',
          value: 'original_value',
          description: 'Original description',
          category: 'original_category',
        })
        .execute();

      // Update only the value
      const result = await updateSetting({
        key: 'preserve_test',
        value: 'new_value',
      });

      expect(result?.key).toBe('preserve_test');
      expect(result?.value).toBe('new_value');
      expect(result?.description).toBe('Original description');
      expect(result?.category).toBe('original_category');
    });
  });
});