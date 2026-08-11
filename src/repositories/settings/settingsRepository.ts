import { fetchTable, fetchSingle, insertRow, updateRow, upsertRow, useMockData } from '../common';
import { apiMocks } from '../../mocks';
import { Json, SettingsRow } from '../../lib/supabase/database.types';

export async function getSettings() {
  if (useMockData) {
    return apiMocks.getSettings();
  }

  return fetchTable<SettingsRow>('settings');
}

export async function getSettingByKey(key: string) {
  if (useMockData) {
    return apiMocks.getSettingByKey(key);
  }

  return fetchSingle<SettingsRow>('settings', 'key', key);
}

export async function updateSetting(key: string, value: Json) {
  if (useMockData) {
    return apiMocks.updateSetting(key, value);
  }

  return upsertRow<SettingsRow>('settings', { key, value });
}
