import { getApiClient, handleSupabaseError } from './client';
import { KpiMetric, DashboardAction, ActivityItem, NotificationItem, AiInsight, PerformanceGauge } from '../types/dashboard/dashboardTypes';

export async function fetchDashboardSummary() {
  const supabase = getApiClient();
  try {
    const { data, error } = await supabase.from('dashboard_summary').select('*').single();
    if (error) throw handleSupabaseError(error);
    return data as { greeting: string; userName: string; organization: string; dateLabel: string; todayFocus: string; quickActions: DashboardAction[] };
  } catch (error) {
    throw error;
  }
}

export async function fetchKpis() {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('dashboard_kpis').select('*');
  if (error) throw handleSupabaseError(error);
  return data as KpiMetric[];
}

export async function fetchDashboardActivities() {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('dashboard_activities').select('*').order('created_at', { ascending: false });
  if (error) throw handleSupabaseError(error);
  return data as ActivityItem[];
}

export async function fetchNotifications() {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('dashboard_notifications').select('*').order('created_at', { ascending: false });
  if (error) throw handleSupabaseError(error);
  return data as NotificationItem[];
}

export async function fetchAiInsights() {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('dashboard_insights').select('*').order('created_at', { ascending: false });
  if (error) throw handleSupabaseError(error);
  return data as AiInsight[];
}

export async function fetchPerformanceGauges() {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('dashboard_performance_gauges').select('*');
  if (error) throw handleSupabaseError(error);
  return data as PerformanceGauge[];
}
