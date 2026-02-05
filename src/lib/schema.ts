export interface BlockStyles {
  padding?: string;
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  fontFamily?: string;
  lineHeight?: string;
  margin?: string;
  border?: string;
  borderRadius?: string;
  width?: string;
  height?: string;
  maxWidth?: string;
  minHeight?: string;
  display?: string;
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  gap?: string;
}

export interface Block {
  id: string;
  type: 'text' | 'image' | 'button' | 'divider' | 'spacer' | 'container' | 'column' | 'row';
  content?: string;
  src?: string;
  alt?: string;
  href?: string;
  styles?: BlockStyles;
  children?: Block[];
  parentId?: string;
  order?: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  blocks: Block[];
  globalStyles?: {
    backgroundColor?: string;
    fontFamily?: string;
    fontSize?: string;
    color?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface BuilderState {
  // Template data
  template: EmailTemplate;
  
  // UI state
  selectedBlockId: string | null;
  isPreviewMode: boolean;
  isMobilePreview: boolean;
  
  // History for undo/redo
  history: EmailTemplate[];
  historyIndex: number;
  
  // Actions
  addBlock: (block: Omit<Block, 'id'>, parentId?: string) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  moveBlock: (id: string, newParentId: string | null, newIndex: number) => void;
  selectBlock: (id: string | null) => void;
  
  // Template actions
  updateTemplate: (updates: Partial<EmailTemplate>) => void;
  clearTemplate: () => void;
  loadTemplate: (template: EmailTemplate) => void;
  
  // History actions
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  
  // UI actions
  togglePreview: () => void;
  toggleMobilePreview: () => void;
  exportHTML: () => string;
}

export const BLOCK_TYPES = {
  text: {
    name: 'Text',
    icon: '📝',
    defaultContent: 'Your text here',
    defaultStyles: {
      fontSize: '16px',
      color: '#000000',
      textAlign: 'left' as const,
      padding: '10px',
    }
  },
  image: {
    name: 'Image',
    icon: '🖼️',
    defaultContent: '',
    defaultStyles: {
      width: '100%',
      maxWidth: '600px',
      padding: '10px',
    }
  },
  button: {
    name: 'Button',
    icon: '🔘',
    defaultContent: 'Click me',
    defaultStyles: {
      backgroundColor: '#007bff',
      color: '#ffffff',
      padding: '12px 24px',
      borderRadius: '4px',
      textAlign: 'center' as const,
      fontSize: '16px',
      fontWeight: 'bold' as const,
    }
  },
  divider: {
    name: 'Divider',
    icon: '➖',
    defaultContent: '',
    defaultStyles: {
      height: '1px',
      backgroundColor: '#e0e0e0',
      margin: '20px 0',
    }
  },
  spacer: {
    name: 'Spacer',
    icon: '📏',
    defaultContent: '',
    defaultStyles: {
      height: '20px',
      backgroundColor: 'transparent',
    }
  },
  container: {
    name: 'Container',
    icon: '📦',
    defaultContent: '',
    defaultStyles: {
      backgroundColor: '#ffffff',
      padding: '20px',
      maxWidth: '600px',
      margin: '0 auto',
    }
  },
  column: {
    name: 'Column',
    icon: '📄',
    defaultContent: '',
    defaultStyles: {
      flex: '1',
      padding: '10px',
      minHeight: '50px',
    }
  },
  row: {
    name: 'Row',
    icon: '📋',
    defaultContent: '',
    defaultStyles: {
      display: 'flex',
      flexDirection: 'row' as const,
      gap: '10px',
      padding: '10px',
    }
  }
} as const;
