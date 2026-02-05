'use client';

import { useBuilderStore } from '@/store/useBuilderStore';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Undo, 
  Redo, 
  Eye, 
  Download, 
  Trash2, 
  Smartphone,
  Monitor
} from 'lucide-react';
import { useState } from 'react';

export default function Toolbar() {
  const {
    template,
    isPreviewMode,
    isMobilePreview,
    togglePreview,
    toggleMobilePreview,
    clearTemplate,
    undo,
    redo,
    history,
    historyIndex,
    exportHTML,
  } = useBuilderStore();

  const [isExporting, setIsExporting] = useState(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const html = exportHTML();
      
      // Create blob and download
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.replace(/\s+/g, '-')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleNew = () => {
    if (confirm('Are you sure you want to create a new template? This will clear all current work.')) {
      clearTemplate();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleNew}
          className="flex items-center space-x-1"
        >
          <FileText className="w-4 h-4" />
          <span>New</span>
        </Button>

        <div className="h-6 w-px bg-gray-300" />

        <Button
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={!canUndo}
          className="flex items-center space-x-1"
        >
          <Undo className="w-4 h-4" />
          <span>Undo</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={redo}
          disabled={!canRedo}
          className="flex items-center space-x-1"
        >
          <Redo className="w-4 h-4" />
          <span>Redo</span>
        </Button>

        <div className="h-6 w-px bg-gray-300" />

        <Button
          variant="outline"
          size="sm"
          onClick={togglePreview}
          className={`flex items-center space-x-1 ${isPreviewMode ? 'bg-blue-50 text-blue-600' : ''}`}
        >
          <Eye className="w-4 h-4" />
          <span>Preview</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleMobilePreview}
          className={`flex items-center space-x-1 ${isMobilePreview ? 'bg-blue-50 text-blue-600' : ''}`}
        >
          {isMobilePreview ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          <span>{isMobilePreview ? 'Desktop' : 'Mobile'}</span>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center space-x-1"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Exporting...' : 'Export HTML'}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={clearTemplate}
          className="flex items-center space-x-1 text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear All</span>
        </Button>
      </div>
    </div>
  );
}
