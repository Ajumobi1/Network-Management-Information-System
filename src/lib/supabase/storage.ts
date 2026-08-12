import { accessRestricted, trustedOperationRequired } from '../security/secureContracts';

/**
 * Generic browser Storage access is intentionally disabled. Provider documents
 * and ORANGHIS source files require separately approved classification,
 * retention, signing, and trusted-workflow contracts.
 */
export async function uploadDocument(_bucket: string, _file: File, _path: string): Promise<never> {
  throw trustedOperationRequired('secure document or source-file upload');
}

export async function getDocumentUrl(_bucket: string, _path: string): Promise<never> {
  throw accessRestricted('document URL');
}

export async function deleteDocument(_bucket: string, _path: string): Promise<never> {
  throw trustedOperationRequired('document retention or deletion');
}
