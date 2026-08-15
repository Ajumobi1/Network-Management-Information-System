const SUPPORTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

type DirectoryDataTransferItem = DataTransferItem & {
  webkitGetAsEntry?: () => FileSystemEntry | null;
};

export function filterSupportedUploadFiles(files: File[]): File[] {
  const seen = new Set<string>();
  return files.filter(file => {
    const name = (file.name || '').toLowerCase();
    if (!SUPPORTED_EXTENSIONS.some(extension => name.endsWith(extension))) return false;

    const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const identity = `${relativePath}|${file.size}|${file.lastModified}`;
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

function readFileEntry(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject));
}

function readDirectoryEntries(entry: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const reader = entry.createReader();
    const entries: FileSystemEntry[] = [];
    const readNextBatch = () => {
      reader.readEntries(batch => {
        if (batch.length === 0) {
          resolve(entries);
          return;
        }
        entries.push(...batch);
        readNextBatch();
      }, reject);
    };
    readNextBatch();
  });
}

async function walkEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) return [await readFileEntry(entry as FileSystemFileEntry)];
  if (!entry.isDirectory) return [];

  const children = await readDirectoryEntries(entry as FileSystemDirectoryEntry);
  const nested = await Promise.all(children.map(child => walkEntry(child)));
  return nested.flat();
}

export async function collectFilesFromDrop(dataTransfer: DataTransfer): Promise<File[]> {
  const entries = Array.from(dataTransfer.items)
    .map(item => (item as DirectoryDataTransferItem).webkitGetAsEntry?.())
    .filter((entry): entry is FileSystemEntry => Boolean(entry));

  if (entries.length === 0) {
    return filterSupportedUploadFiles(Array.from(dataTransfer.files));
  }

  const nestedFiles = (await Promise.all(entries.map(entry => walkEntry(entry)))).flat();
  return filterSupportedUploadFiles(nestedFiles);
}
