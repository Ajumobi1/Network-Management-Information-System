import { supabase } from './supabaseClient';

export async function uploadDocument(bucket: string, file: File, path: string) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getDocumentUrl(bucket: string, path: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error) {
    throw new Error(error.message);
  }
  return data.signedUrl;
}

export async function deleteDocument(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    throw new Error(error.message);
  }
  return true;
}
