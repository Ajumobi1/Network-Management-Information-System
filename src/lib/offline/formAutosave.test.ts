import { describe, expect, it, beforeEach } from 'vitest';
import { isFormActive, readFormAutosave, removeFormAutosave, setActiveForm, writeFormAutosave } from './formAutosave';

describe('form autosave', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('writes and restores an autosave envelope', () => {
    expect(writeFormAutosave('draft', { name: 'Facility' })).toBe(true);
    expect(readFormAutosave<{ name: string }>('draft')?.data).toEqual({ name: 'Facility' });
    expect(readFormAutosave<{ name: string }>('draft')?.version).toBe(1);
  });

  it('reads the previous direct-snapshot format for migration', () => {
    localStorage.setItem('legacy', JSON.stringify({ step: 2, profile: { facility_name: 'Old Facility' }, savedAt: '2026-10-01T00:00:00.000Z' }));
    expect(readFormAutosave<{ step: number; profile: { facility_name: string } }>('legacy')?.data.profile.facility_name).toBe('Old Facility');
  });

  it('tracks active forms for deployment update deferral', () => {
    expect(isFormActive()).toBe(false);
    setActiveForm(true);
    expect(isFormActive()).toBe(true);
    setActiveForm(false);
    expect(isFormActive()).toBe(false);
  });

  it('removes a completed draft', () => {
    writeFormAutosave('completed', { done: true });
    removeFormAutosave('completed');
    expect(readFormAutosave('completed')).toBeNull();
  });
});
