'use client';

import { useBuilderStore } from '@/store/useBuilderStore';
import { Block, BlockStyles, BLOCK_TYPES } from '@/lib/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Type, 
  Palette, 
  Layout, 
  Link,
  Image as ImageIcon,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function PropertyPanel() {
  const { selectedBlockId, template, updateBlock } = useBuilderStore();
  const { addBlock } = useBuilderStore();
  const [localStyles, setLocalStyles] = useState<BlockStyles>({});
  const [fontSizeInput, setFontSizeInput] = useState<string>('');
  const [numericInputs, setNumericInputs] = useState<Record<string, string>>({});
  const SHOW_EXTRA_SECTIONS = false; // hide Border/Spacing duplicates for now
  const textEditorRef = useRef<HTMLDivElement | null>(null);

  const selectedBlock = selectedBlockId 
    ? findBlockById(template.blocks, selectedBlockId)
    : null;

  useEffect(() => {
    if (selectedBlock) {
      const styles = selectedBlock.styles || {};
      setLocalStyles(styles);
      const initial = styles.fontSize ? parseInt(styles.fontSize as string, 10) : 16;
      setFontSizeInput(String(isNaN(initial) ? 16 : initial));
      const extractNum = (v?: any) => {
        if (v == null) return '';
        const m = String(v).match(/\d+/);
        return m ? m[0] : '';
      };
      setNumericInputs({
        width: extractNum(styles.width),
        height: extractNum(styles.height),
        padding: extractNum(styles.padding),
        margin: extractNum(styles.margin),
        gap: extractNum((styles as any)?.gap),
        imgWidth: extractNum(styles.width),
        imgHeight: extractNum(styles.height),
      });
      // keep inline editor in sync without resetting cursor when not focused
      if (textEditorRef.current && selectedBlock.type === 'text') {
        const editor = textEditorRef.current;
        const next = selectedBlock.content || '';
        if (editor.innerHTML !== next && document.activeElement !== editor) {
          editor.innerHTML = next;
        }
      }
    }
  }, [selectedBlock]);

  function findBlockById(blocks: Block[], id: string): Block | null {
    for (const block of blocks) {
      if (block.id === id) return block;
      if (block.children) {
        const found = findBlockById(block.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  const handleStyleChange = (key: keyof BlockStyles, value: string) => {
    const newStyles = { ...localStyles, [key]: value };
    setLocalStyles(newStyles);
    
    if (selectedBlock) {
      updateBlock(selectedBlock.id, { styles: newStyles });
    }
  };

  const setNumericStyle = (key: keyof BlockStyles, rawValue: string, unit: '%' | 'px') => {
    const digits = rawValue.replace(/[^0-9]/g, '');
    setNumericInputs((prev) => ({ ...prev, [key as string]: digits }));
    if (!selectedBlock) return;
    if (!digits) {
      const next = { ...localStyles } as any;
      delete next[key as string];
      setLocalStyles(next);
      updateBlock(selectedBlock.id, { styles: next });
      return;
    }
    handleStyleChange(key, `${digits}${unit}`);
  };

  const toggleStyle = (key: keyof BlockStyles, on: string, off: string) => {
    const current = (localStyles[key] as string) || off;
    const next = current === on ? off : on;
    handleStyleChange(key, next);
  };

  const handleFontSizeCommit = () => {
    const onlyDigits = fontSizeInput.replace(/[^0-9]/g, '');
    if (!onlyDigits) return;
    const numeric = Math.max(8, Math.min(96, parseInt(onlyDigits, 10)));
    setFontSizeInput(String(numeric));
    handleStyleChange('fontSize', `${numeric}px`);
  };

  const incrementFontSize = (delta: number) => {
    const current = parseInt(fontSizeInput || '16', 10) || 16;
    const next = Math.max(8, Math.min(96, current + delta));
    setFontSizeInput(String(next));
    handleStyleChange('fontSize', `${next}px`);
  };

  const handleContentChange = (key: string, value: string) => {
    if (selectedBlock) {
      updateBlock(selectedBlock.id, { [key]: value });
    }
  };

  const applyInlineFormat = (command: 'bold' | 'italic' | 'underline') => {
    // Do not steal focus from Canvas; operate on current selection if it's inside a Canvas text block
    const selection = window.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    const anchorNode = selection?.anchorNode as Node | null;
    const element = anchorNode && (anchorNode.nodeType === Node.TEXT_NODE ? (anchorNode.parentElement) : (anchorNode as HTMLElement));
    const canvasTextRoot = element ? (element as HTMLElement).closest('[data-block-id]') as HTMLElement | null : null;

    // If selection is inside Canvas text, execCommand directly and sync that block's HTML
    if (canvasTextRoot && canvasTextRoot.hasAttribute('data-block-id')) {
      document.execCommand(command, false);
      const affectedBlockId = canvasTextRoot.getAttribute('data-block-id')!;
      updateBlock(affectedBlockId, { content: canvasTextRoot.innerHTML });
      return;
    }

    // Otherwise, fallback to the local inline editor inside PropertyPanel (if used)
    if (textEditorRef.current) {
      textEditorRef.current.focus();
      document.execCommand(command, false);
      if (selectedBlock) {
        updateBlock(selectedBlock.id, { content: textEditorRef.current.innerHTML });
      }
    }
  };

  const resetToDefault = () => {
    if (selectedBlock) {
      updateBlock(selectedBlock.id, { styles: {} });
      setLocalStyles({});
    }
  };

  if (!selectedBlock) {
    return (
      <div className="w-80 bg-gray-50 border-l border-gray-200 p-4">
        <div className="text-center text-gray-500">
          <Layout className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-sm">Select a block to edit its properties</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            {selectedBlock.type.charAt(0).toUpperCase() + selectedBlock.type.slice(1)} Block
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefault}
            className="w-full"
          >
            Reset to Default
          </Button>
        </div>

        <Separator />

        {/* Quick Formatting (Word-like) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Type className="w-4 h-4" />
              <span>Formatting</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Row 1: Font family + size */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label className="text-xs">Font</Label>
                <Select
                  value={localStyles.fontFamily || 'Arial, sans-serif'}
                  onValueChange={(value) => handleStyleChange('fontFamily', value)}
                >
                  <SelectTrigger className="mt-1" title="Choose font family">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                    <SelectItem value="Courier New, monospace">Courier New</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-36">
                <Label className="text-xs">Size (px)</Label>
                <div className="mt-1 flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => incrementFontSize(-1)}
                    title="Decrease size"
                  >
                    -
                  </Button>
                  <Input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={fontSizeInput}
                    onChange={(e) => setFontSizeInput(e.target.value.replace(/[^0-9]/g, ''))}
                    onBlur={handleFontSizeCommit}
                    onKeyDown={(e) => e.key === 'Enter' && handleFontSizeCommit()}
                    placeholder="16"
                    className="text-center"
                    title="Font size in pixels"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => incrementFontSize(1)}
                    title="Increase size"
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            {/* Row 2: Bold / Italic / Underline */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (selectedBlock.type === 'text') {
                    applyInlineFormat('bold');
                  } else {
                    toggleStyle('fontWeight', 'bold', 'normal');
                  }
                }}
                title="Bold"
                className={localStyles.fontWeight === 'bold' ? 'bg-gray-100' : ''}
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (selectedBlock.type === 'text') {
                    applyInlineFormat('italic');
                  } else {
                    toggleStyle('fontStyle', 'italic', 'normal');
                  }
                }}
                title="Italic"
                className={localStyles.fontStyle === 'italic' ? 'bg-gray-100' : ''}
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (selectedBlock.type === 'text') {
                    applyInlineFormat('underline');
                  } else {
                    toggleStyle('textDecoration', 'underline', 'none');
                  }
                }}
                title="Underline"
                className={localStyles.textDecoration === 'underline' ? 'bg-gray-100' : ''}
              >
                <Underline className="w-4 h-4" />
              </Button>
            </div>

            {/* Row 3: Align */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStyleChange('textAlign', 'left')}
                title="Align Left"
                className={localStyles.textAlign === 'left' ? 'bg-gray-100' : ''}
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStyleChange('textAlign', 'center')}
                title="Align Center"
                className={localStyles.textAlign === 'center' ? 'bg-gray-100' : ''}
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStyleChange('textAlign', 'right')}
                title="Align Right"
                className={localStyles.textAlign === 'right' ? 'bg-gray-100' : ''}
              >
                <AlignRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Row 4: Colors */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Text color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="color"
                    value={localStyles.color || '#000000'}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="w-12 h-8 p-1"
                    title="Pick a text color"
                  />
                  <Input
                    value={localStyles.color || ''}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                    title="Enter a color (e.g. #000000)"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Background</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="color"
                    value={localStyles.backgroundColor || '#ffffff'}
                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                    className="w-12 h-8 p-1"
                    title="Pick a background color"
                  />
                  <Input
                    value={localStyles.backgroundColor || ''}
                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                    title="Enter a color (e.g. #ffffff)"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Button content controls */}
        {selectedBlock.type === 'button' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Button</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="button-content" className="text-xs">Button Text</Label>
                <Input
                  id="button-content"
                  value={selectedBlock.content || ''}
                  onChange={(e) => handleContentChange('content', e.target.value)}
                  placeholder="Click me"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="href" className="text-xs">Link URL</Label>
                <Input
                  id="href"
                  value={selectedBlock.href || ''}
                  onChange={(e) => handleContentChange('href', e.target.value)}
                  placeholder="https://example.com"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image content controls */}
        {selectedBlock.type === 'image' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="img-src" className="text-xs">Image URL</Label>
                <Input
                  id="img-src"
                  value={selectedBlock.src || ''}
                  onChange={(e) => handleContentChange('src', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="img-alt" className="text-xs">Alt Text</Label>
                <Input
                  id="img-alt"
                  value={selectedBlock.alt || ''}
                  onChange={(e) => handleContentChange('alt', e.target.value)}
                  placeholder="Description of image"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="img-width" className="text-xs">Width px</Label>
                  <Input
                    id="img-width"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={numericInputs.imgWidth || ''}
                    onChange={(e) => setNumericStyle('width', e.target.value, 'px')}
                    placeholder="300"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="img-height" className="text-xs">Height px</Label>
                  <Input
                    id="img-height"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={numericInputs.imgHeight || ''}
                    onChange={(e) => setNumericStyle('height', e.target.value, 'px')}
                    placeholder="200"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="img-href" className="text-xs">Link URL (optional)</Label>
                <Input
                  id="img-href"
                  value={selectedBlock.href || ''}
                  onChange={(e) => handleContentChange('href', e.target.value)}
                  placeholder="https://example.com"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content section removed as requested */}

        {/* Spacing & Layout (simple names) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Layout className="w-4 h-4" />
              <span>Spacing & Layout</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Column layout presets inside Container or Row */}
            {(selectedBlock.type === 'container' || selectedBlock.type === 'row') && (
              <div>
                <Label className="text-xs">Column layout presets</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    ['100%'],
                    ['50%','50%'],
                    ['33%','33%','33%'],
                    ['25%','25%','25%','25%'],
                    ['33%','67%'],
                    ['67%','33%'],
                  ].map((preset, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="justify-center"
                      title={`Set columns: ${preset.join(' / ')}`}
                      onClick={() => {
                        // Replace children with 'column' blocks of given widths
                        const columns = preset.map((w) => ({
                          id: uuidv4(),
                          type: 'column' as Block['type'],
                          styles: { 
                            ...BLOCK_TYPES.column.defaultStyles, 
                            width: w,
                            flex: `0 0 ${w}`,
                          },
                        } as Block));
                        // Ensure container behaves like a row
                        const parentStyles = {
                          ...(selectedBlock.styles || {}),
                          display: 'flex',
                          flexDirection: 'row',
                          gap: '0px',
                        } as BlockStyles;
                        updateBlock(selectedBlock.id, { children: columns, styles: parentStyles });
                      }}
                    >
                      {preset.join(' | ')}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {/* Row-specific controls */}
            {selectedBlock.type === 'row' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="row-gap" className="text-xs">Gap between columns</Label>
                    <Input
                      id="row-gap"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={numericInputs.gap || ''}
                      onChange={(e) => setNumericStyle('gap' as any, e.target.value, 'px')}
                      placeholder="10"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Justify (horizontal)</Label>
                    <Select
                      value={localStyles.justifyContent || 'flex-start'}
                      onValueChange={(v) => handleStyleChange('justifyContent', v)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flex-start">Start</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="flex-end">End</SelectItem>
                        <SelectItem value="space-between">Space between</SelectItem>
                        <SelectItem value="space-around">Space around</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Align (vertical)</Label>
                  <Select
                    value={localStyles.alignItems || 'stretch'}
                    onValueChange={(v) => handleStyleChange('alignItems', v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flex-start">Top</SelectItem>
                      <SelectItem value="center">Middle</SelectItem>
                      <SelectItem value="flex-end">Bottom</SelectItem>
                      <SelectItem value="stretch">Stretch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="padding" className="text-xs">Padding (inside) px</Label>
                <Input
                  id="padding"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={numericInputs.padding || ''}
                  onChange={(e) => setNumericStyle('padding', e.target.value, 'px')}
                  placeholder="10"
                  className="mt-1"
                  title="Space inside the block"
                />
              </div>
              <div>
                <Label htmlFor="margin" className="text-xs">Margin (outside) px</Label>
                <Input
                  id="margin"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={numericInputs.margin || ''}
                  onChange={(e) => setNumericStyle('margin', e.target.value, 'px')}
                  placeholder="0"
                  className="mt-1"
                  title="Space outside the block"
                />
              </div>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="width" className="text-xs">Width % {selectedBlock.type === 'column' ? '(column)' : ''}</Label>
                  <Input
                    id="width"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={numericInputs.width || ''}
                    onChange={(e) => setNumericStyle('width', e.target.value, '%')}
                    onBlur={(e) => {
                      const v = (e.target as HTMLInputElement).value.trim();
                      if (v) {
                        const parent = selectedBlock.parentId ? selectedBlock.parentId : null;
                        if (parent) {
                          updateBlock(parent, { styles: { ...(findBlockById(template.blocks, parent)?.styles || {}), display: 'flex', flexDirection: 'row', gap: (localStyles.gap || '10px') } });
                        }
                      }
                    }}
                    placeholder="100"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="height" className="text-xs">Height px</Label>
                  <Input
                    id="height"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={numericInputs.height || ''}
                    onChange={(e) => setNumericStyle('height', e.target.value, 'px')}
                    placeholder="auto"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="lineHeight" className="text-xs">Line height</Label>
                <Input
                  id="lineHeight"
                  value={localStyles.lineHeight || ''}
                  onChange={(e) => handleStyleChange('lineHeight', e.target.value)}
                  placeholder="1.5"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="borderRadius" className="text-xs">Corners (radius)</Label>
                <Input
                  id="borderRadius"
                  value={localStyles.borderRadius || ''}
                  onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                  placeholder="4px"
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Border Section (simple) - temporarily hidden */}
        {SHOW_EXTRA_SECTIONS && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Palette className="w-4 h-4" />
                <span>Border</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="border" className="text-xs">Border</Label>
                <Input
                  id="border"
                  value={localStyles.border || ''}
                  onChange={(e) => handleStyleChange('border', e.target.value)}
                  placeholder="1px solid #ccc"
                  className="mt-1"
                  title="CSS border value (e.g. 1px solid #ccc)"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Spacing Section - temporarily hidden */}
        {SHOW_EXTRA_SECTIONS && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Layout className="w-4 h-4" />
                <span>Spacing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="padding" className="text-xs">Padding</Label>
                  <Input
                    id="padding"
                    value={localStyles.padding || ''}
                    onChange={(e) => handleStyleChange('padding', e.target.value)}
                    placeholder="10px"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="margin" className="text-xs">Margin</Label>
                  <Input
                    id="margin"
                    value={localStyles.margin || ''}
                    onChange={(e) => handleStyleChange('margin', e.target.value)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="width" className="text-xs">Width</Label>
                  <Input
                    id="width"
                    value={localStyles.width || ''}
                    onChange={(e) => handleStyleChange('width', e.target.value)}
                    placeholder="100%"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="height" className="text-xs">Height</Label>
                  <Input
                    id="height"
                    value={localStyles.height || ''}
                    onChange={(e) => handleStyleChange('height', e.target.value)}
                    placeholder="auto"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Border Section - temporarily hidden */}
        {SHOW_EXTRA_SECTIONS && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Layout className="w-4 h-4" />
                <span>Border</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="border" className="text-xs">Border</Label>
                <Input
                  id="border"
                  value={localStyles.border || ''}
                  onChange={(e) => handleStyleChange('border', e.target.value)}
                  placeholder="1px solid #ccc"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="borderRadius" className="text-xs">Border Radius</Label>
                <Input
                  id="borderRadius"
                  value={localStyles.borderRadius || ''}
                  onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                  placeholder="4px"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
