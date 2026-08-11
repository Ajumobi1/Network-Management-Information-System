import * as settingsRepository from '../../repositories/settings';
import { Json, SettingsRow } from '../../lib/supabase/database.types';

export async function fetchSettings(): Promise<SettingsRow[]> {
  return settingsRepository.getSettings();
}

export async function fetchSettingByKey(key: string): Promise<SettingsRow> {
  return settingsRepository.getSettingByKey(key);
}

export async function upsertSetting(key: string, value: Json): Promise<SettingsRow> {
  return settingsRepository.updateSetting(key, value);
}
