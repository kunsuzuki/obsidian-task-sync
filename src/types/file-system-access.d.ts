// File System Access API の型定義
interface FileSystemHandlePermissionDescriptor {
  mode?: 'read' | 'readwrite';
}

interface DirectoryPickerOptions {
  id?: string;
  mode?: 'read' | 'readwrite';
  startIn?: string | FileSystemHandle;
}

interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
  queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
}

interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file';
  getFile(): Promise<File>;
  createWritable(options?: { keepExistingData?: boolean }): Promise<FileSystemWritableFileStream>;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory';
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  entries(): AsyncIterable<[string, FileSystemHandle]>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: FileSystemWriteChunkType): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

type FileSystemWriteChunkType = BufferSource | Blob | string;

interface Window {
  showOpenFilePicker(options?: any): Promise<FileSystemFileHandle[]>;
  showSaveFilePicker(options?: any): Promise<FileSystemFileHandle>;
  showDirectoryPicker(options?: DirectoryPickerOptions): Promise<FileSystemDirectoryHandle>;
}
