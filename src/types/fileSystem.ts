// Types for virtual file system

export interface ProjectFile {
  path: string;
  content: string;
}

export interface FileSystemNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileSystemNode[];
  content?: string;
  language?: string;
}

export interface AIGeneratedProject {
  files: ProjectFile[];
  entryPoint?: string; // Main file to display first
  description?: string;
}

