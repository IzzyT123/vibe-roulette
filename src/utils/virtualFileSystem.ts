// Virtual File System - Store multiple files and folders in memory
// Like Bolt.new and Lovable.dev

export interface VirtualFile {
  path: string;
  name: string;
  content: string;
  type: 'file';
  language?: string;
}

export interface VirtualFolder {
  path: string;
  name: string;
  type: 'folder';
  children: (VirtualFile | VirtualFolder)[];
}

export type VirtualNode = VirtualFile | VirtualFolder;

export class VirtualFileSystem {
  private files: Map<string, string> = new Map(); // path -> content
  
  constructor() {
    // Start completely empty - AI will create everything
  }
  
  // Get file content by path
  getFile(path: string): string | undefined {
    return this.files.get(path);
  }
  
  // Set/update file content
  setFile(path: string, content: string): void {
    this.files.set(path, content);
  }
  
  // Delete file
  deleteFile(path: string): void {
    this.files.delete(path);
  }
  
  // Check if file exists
  hasFile(path: string): boolean {
    return this.files.has(path);
  }
  
  // Get all files as array
  getAllFiles(): Array<{ path: string; content: string }> {
    return Array.from(this.files.entries()).map(([path, content]) => ({
      path,
      content
    }));
  }
  
  // Get file tree structure for FileTree component
  getFileTree(): VirtualNode[] {
    const paths = Array.from(this.files.keys()).sort();
    const root: Map<string, any> = new Map();
    
    for (const path of paths) {
      const parts = path.split('/').filter(p => p);
      let current = root;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;
        
        if (!current.has(part)) {
          if (isFile) {
            current.set(part, {
              type: 'file',
              path: path,
              name: part,
              content: this.files.get(path),
              language: this.getLanguageFromPath(path)
            });
          } else {
            current.set(part, {
              type: 'folder',
              path: '/' + parts.slice(0, i + 1).join('/'),
              name: part,
              children: new Map()
            });
          }
        }
        
        if (!isFile) {
          current = current.get(part).children;
        }
      }
    }
    
    return this.mapToTree(root);
  }
  
  private mapToTree(map: Map<string, any>): VirtualNode[] {
    const result: VirtualNode[] = [];
    
    for (const node of map.values()) {
      if (node.type === 'file') {
        result.push({
          path: node.path,
          name: node.name,
          content: node.content,
          type: 'file',
          language: node.language
        });
      } else {
        result.push({
          path: node.path,
          name: node.name,
          type: 'folder',
          children: this.mapToTree(node.children)
        });
      }
    }
    
    return result.sort((a, b) => {
      // Folders first, then files
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }
  
  private getLanguageFromPath(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
      case 'ts':
        return 'typescript';
      case 'jsx':
      case 'js':
        return 'javascript';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'plaintext';
    }
  }
  
  // Create folder (ensures parent folders exist)
  createFolder(_path: string): void {
    // Folders are implicit - just marker
  }
  
  // Bulk import files (for AI-generated projects)
  importFiles(files: Array<{ path: string; content: string }>): void {
    this.files.clear(); // Clear existing
    for (const file of files) {
      this.setFile(file.path, file.content);
    }
  }
  
  // Export project as ZIP-ready structure
  exportProject(): Array<{ path: string; content: string }> {
    return this.getAllFiles();
  }
  
  // Get file count
  getFileCount(): number {
    return this.files.size;
  }
  
  // Clear all files
  clear(): void {
    this.files.clear();
  }
}

// Singleton instance
export const vfs = new VirtualFileSystem();

