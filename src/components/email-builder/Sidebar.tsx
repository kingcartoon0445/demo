'use client';

import { BLOCK_TYPES } from '@/lib/schema';
import { useBuilderStore } from '@/store/useBuilderStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Type, 
  Image, 
  MousePointer, 
  Minus, 
  Square, 
  Package, 
  Columns,
  Layout
} from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';

const BLOCK_ICONS = {
  text: Type,
  image: Image,
  button: MousePointer,
  divider: Minus,
  spacer: Square,
  container: Package,
  column: Columns,
  row: Layout,
};

interface DraggableBlockProps {
  type: keyof typeof BLOCK_TYPES;
  config: typeof BLOCK_TYPES[keyof typeof BLOCK_TYPES];
  index: number;
}

function DraggableBlock({ type, config, index }: DraggableBlockProps) {
  const { addBlock, template } = useBuilderStore();
  const Icon = BLOCK_ICONS[type];

  const handleClick = () => {
    addBlock({
      type,
      content: config.defaultContent,
      styles: { 
        ...config.defaultStyles
      },
    });
  };

  return (
    <Draggable draggableId={`sidebar-${type}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
            snapshot.isDragging ? 'opacity-50' : ''
          }`}
        >
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <Button
                variant="ghost"
                className="w-full justify-start h-auto p-0"
                onClick={handleClick}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="flex-shrink-0">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {config.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {type === 'text' && 'Add text content'}
                      {type === 'image' && 'Add an image'}
                      {type === 'button' && 'Add a call-to-action button'}
                      {type === 'divider' && 'Add a horizontal line'}
                      {type === 'spacer' && 'Add empty space'}
                      {type === 'container' && 'Group content together'}
                      {type === 'column' && 'Add a column layout'}
                      {type === 'row' && 'Add a row layout'}
                    </div>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}

export default function Sidebar() {
  const HIDDEN_TYPES = new Set(['column', 'row']);
  return (
    <div className="w-64 h-screen overflow-y-auto bg-gray-50 border-r border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Blocks</h3>
      
      <Droppable droppableId="sidebar">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
          >
            {Object.entries(BLOCK_TYPES)
              .filter(([type]) => !HIDDEN_TYPES.has(type))
              .map(([type, config], index) => (
                <DraggableBlock
                  key={type}
                  type={type as keyof typeof BLOCK_TYPES}
                  config={config}
                  index={index}
                />
              ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <div className="mt-6">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Tips
        </h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>• Click any block to add it to your email</p>
          <p>• Drag blocks to reorder them</p>
          <p>• Select a block to edit its properties</p>
          <p>• Use containers to group related content</p>
        </div>
      </div>
    </div>
  );
}
