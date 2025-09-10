import { db } from '../db';
import { settingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { 
  type Settings, 
  type UpdateSettingsInput 
} from '../schema';

export async function getAllSettings(): Promise<Settings[]> {
  try {
    const result = await db.select()
      .from(settingsTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch all settings:', error);
    throw error;
  }
}

export async function getSettingByKey(key: string): Promise<Settings | null> {
  try {
    const result = await db.select()
      .from(settingsTable)
      .where(eq(settingsTable.key, key))
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Failed to fetch setting by key:', error);
    throw error;
  }
}

export async function getSettingsByCategory(category: string): Promise<Settings[]> {
  try {
    const result = await db.select()
      .from(settingsTable)
      .where(eq(settingsTable.category, category))
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch settings by category:', error);
    throw error;
  }
}

export async function updateSetting(input: UpdateSettingsInput): Promise<Settings | null> {
  try {
    // Try to update existing setting first
    const updateResult = await db.update(settingsTable)
      .set({
        value: input.value,
        updated_at: new Date(),
      })
      .where(eq(settingsTable.key, input.key))
      .returning()
      .execute();

    if (updateResult.length > 0) {
      return updateResult[0];
    }

    // If no existing setting found, create new one
    const insertResult = await db.insert(settingsTable)
      .values({
        key: input.key,
        value: input.value,
      })
      .returning()
      .execute();

    return insertResult[0];
  } catch (error) {
    console.error('Failed to update setting:', error);
    throw error;
  }
}

export async function updateMultipleSettings(settings: UpdateSettingsInput[]): Promise<boolean> {
  try {
    // Use transaction to update multiple settings atomically
    await db.transaction(async (tx) => {
      for (const setting of settings) {
        // Try to update existing setting first
        const updateResult = await tx.update(settingsTable)
          .set({
            value: setting.value,
            updated_at: new Date(),
          })
          .where(eq(settingsTable.key, setting.key))
          .returning()
          .execute();

        // If no existing setting found, create new one
        if (updateResult.length === 0) {
          await tx.insert(settingsTable)
            .values({
              key: setting.key,
              value: setting.value,
            })
            .execute();
        }
      }
    });

    return true;
  } catch (error) {
    console.error('Failed to update multiple settings:', error);
    throw error;
  }
}

export async function getSupportedLanguages(): Promise<string[]> {
  try {
    const setting = await getSettingByKey('supported_languages');
    
    if (setting) {
      try {
        const languages = JSON.parse(setting.value);
        return Array.isArray(languages) ? languages : ['ar', 'en', 'tr', 'ms'];
      } catch {
        // If parsing fails, return default languages
        return ['ar', 'en', 'tr', 'ms'];
      }
    }

    // Return default languages if setting doesn't exist
    return ['ar', 'en', 'tr', 'ms'];
  } catch (error) {
    console.error('Failed to fetch supported languages:', error);
    throw error;
  }
}

export async function getEmailSettings(): Promise<Settings[]> {
  try {
    return await getSettingsByCategory('email');
  } catch (error) {
    console.error('Failed to fetch email settings:', error);
    throw error;
  }
}

export async function getSEOSettings(): Promise<Settings[]> {
  try {
    return await getSettingsByCategory('seo');
  } catch (error) {
    console.error('Failed to fetch SEO settings:', error);
    throw error;
  }
}