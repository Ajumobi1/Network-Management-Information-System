import { fetchTable, fetchSingle, insertRow, updateRow, upsertRow, useMockData } from '../common';
import { apiMocks } from '../../mocks';
import { Json, SettingsRow } from '../../lib/supabase/database.types';
import { invokeSecureRpc } from '../contracts/secureRpcRepository';

export interface CapitationSettings {
  settingKey: string;
  rate: number;
  description: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

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

export async function getCapitationSettings(): Promise<CapitationSettings> {
  if (useMockData) {
    return {
      settingKey: 'capitation_fee_per_enrollee',
      rate: 750,
      description: 'Monthly capitation payment per active enrollee in Nigerian Naira',
      updatedAt: null,
      updatedBy: null,
    };
  }

  return invokeSecureRpc<CapitationSettings>('nmis_get_capitation_settings');
}

export async function updateCapitationRate(rate: number): Promise<CapitationSettings> {
  if (useMockData) {
    return {
      settingKey: 'capitation_fee_per_enrollee',
      rate,
      description: 'Monthly capitation payment per active enrollee in Nigerian Naira',
      updatedAt: new Date().toISOString(),
      updatedBy: null,
    };
  }

  return invokeSecureRpc<CapitationSettings>('nmis_update_capitation_rate', { p_rate: rate });
}
