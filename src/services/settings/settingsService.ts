import * as settingsRepository from '../../repositories/settings';
import { CapitationSettings } from '../../repositories/settings/settingsRepository';
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

export async function fetchCapitationSettings(): Promise<CapitationSettings> {
  return settingsRepository.getCapitationSettings();
}

export async function saveCapitationRate(rate: number): Promise<CapitationSettings> {
  return settingsRepository.updateCapitationRate(rate);
}
