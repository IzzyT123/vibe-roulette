import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  File, 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown,
  FileCode,
  FileJson,
  FileText,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

interface FileTreeProps {
  files: FileNode[];
  onFileSelect: (path: string) => void;
  selectedFile?: string;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
    case 'ts':
    case 'jsx':
    case 'js':
      return FileCode;
    case 'json':
      return FileJson;
    case 'md':
      return FileText;
    case 'png':
    case 'jpg':
    case 'svg':
      return ImageIcon;
    default:
      return File;
  }
};

const getFileColor = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
    case 'jsx':
      return 'var(--neon-orange)';
    case 'ts':
    case 'js':
      return 'var(--mint-glow)';
    case 'json':
      return 'var(--orchid-electric)';
    case 'css':
      return '#3B82F6';
    case 'md':
      return 'var(--ticket-cream)';
    default:
      return 'var(--ticket-cream)';
  }
};

function FileTreeNode({ 
  node, 
  onFileSelect, 
  selectedFile, 
  depth = 0 
}: { 
  node: FileNode; 
  onFileSelect: (path: string) => void; 
  selectedFile?: string;
  depth?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const [isHovered, setIsHovered] = useState(false);
  const isSelected = selectedFile === node.path;
  const Icon = node.type === 'folder' 
    ? (isExpanded ? FolderOpen : Folder)
    : getFileIcon(node.name);
  const fileColor = getFileColor(node.name);

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect(node.path);
    }
  };

  return (
    <div>
      <motion.div
        className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer relative overflow-hidden"
        style={{
          paddingLeft: `${depth * 12 + 8}px`,
          background: isSelected 
            ? 'rgba(81, 255, 196, 0.15)' 
            : isHovered 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'transparent',
          borderLeft: isSelected ? '2px solid var(--mint-glow)' : '2px solid transparent',
        }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Hover glow effect */}
        {(isHovered || isSelected) && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: isSelected 
                ? 'linear-gradient(90deg, rgba(81, 255, 196, 0.1) 0%, transparent 100%)'
                : 'linear-gradient(90deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)',
            }}
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
        
        {node.type === 'folder' && (
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight size={14} color="var(--ticket-cream)" opacity={0.6} />
          </motion.div>
        )}
        
        <motion.div
          animate={{
            rotate: isHovered && node.type === 'file' ? [0, -5, 5, 0] : 0,
            scale: isSelected ? 1.1 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <Icon 
            size={16} 
            color={node.type === 'folder' ? 'var(--orchid-electric)' : fileColor}
          />
        </motion.div>
        
        <span 
          className="text-sm flex-1"
          style={{ 
            color: isSelected ? 'var(--mint-glow)' : 'var(--ticket-cream)',
            opacity: isSelected ? 1 : 0.9
          }}
        >
          {node.name}
        </span>
        
        {isSelected && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
          >
            <Sparkles size={12} color="var(--mint-glow)" />
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {node.type === 'folder' && isExpanded && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FileTree({ files, onFileSelect, selectedFile }: FileTreeProps) {
  return (
    <div className="py-2">
      {files.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          onFileSelect={onFileSelect}
          selectedFile={selectedFile}
          depth={0}
        />
      ))}
    </div>
  );
}

