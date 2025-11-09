import JSZip from 'jszip';
import { vfs } from './virtualFileSystem';

/**
 * Download project as a git repository (ZIP file)
 * Creates proper git structure with .git folder and all project files
 */
export async function downloadAsGitRepo(sessionId: string, projectName?: string): Promise<void> {
  const zip = new JSZip();
  const repoName = projectName || `vibe-roulette-${sessionId.slice(0, 8)}`;

  // Get all files from VFS
  const allFiles = vfs.getAllFiles();

  // Add all project files
  allFiles.forEach((file) => {
    // Skip .git folder files (we'll create those separately)
    if (file.path.startsWith('.git/')) {
      return;
    }
    zip.file(file.path, file.content);
  });

  // Create .git folder structure
  const gitFolder = zip.folder('.git');
  if (!gitFolder) {
    throw new Error('Failed to create .git folder');
  }

  // .git/config
  gitFolder.file('config', `[core]
	repositoryformatversion = 0
	filemode = true
	bare = false
	logallrefupdates = true
[remote "origin"]
	url = https://github.com/user/${repoName}.git
	fetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
	remote = origin
	merge = refs/heads/main
`);

  // .git/HEAD
  gitFolder.file('HEAD', 'ref: refs/heads/main\n');

  // .git/refs/heads/main
  const refsFolder = gitFolder.folder('refs');
  if (refsFolder) {
    const headsFolder = refsFolder.folder('heads');
    if (headsFolder) {
      // Create a simple commit hash (in real git this would be a SHA-1)
      const commitHash = generateCommitHash();
      headsFolder.file('main', commitHash + '\n');
    }
  }

  // .git/objects (empty but structure exists)
  gitFolder.folder('objects');
  gitFolder.folder('refs/tags');

  // .gitignore
  if (!allFiles.find(f => f.path === '.gitignore')) {
    zip.file('.gitignore', `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
build/
dist/

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*
`);
  }

  // README.md
  if (!allFiles.find(f => f.path === 'README.md')) {
    zip.file('README.md', `# ${repoName}

Generated with Vibe Roulette 🎮

## Session Info
- Session ID: ${sessionId}
- Created: ${new Date().toLocaleString()}

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Project Structure

${allFiles.map(f => `- ${f.path}`).join('\n')}

---

Built collaboratively with Vibe Roulette - Arcade pairing for tiny code remixes ✨
`);
  }

  // Generate ZIP file
  const blob = await zip.generateAsync({ type: 'blob' });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${repoName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate a simple commit hash (40 character hex string)
 * In a real git repo, this would be a SHA-1 hash of the commit object
 */
function generateCommitHash(): string {
  // Generate a random 40-character hex string (like a git commit hash)
  return Array.from({ length: 40 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

