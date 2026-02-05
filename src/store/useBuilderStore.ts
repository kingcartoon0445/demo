import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Block, EmailTemplate, BuilderState, BLOCK_TYPES } from '@/lib/schema';
import { generateHTML } from '@/lib/renderer';

const createEmptyTemplate = (): EmailTemplate => ({
  id: uuidv4(),
  name: 'Untitled Template',
  subject: 'Your Email Subject',
  blocks: [],
  globalStyles: {
    backgroundColor: '#f8f9fa',
    fontFamily: 'Arial, sans-serif',
    fontSize: '16px',
    color: '#333333',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set, get) => ({
      template: createEmptyTemplate(),
      selectedBlockId: null,
      isPreviewMode: false,
      isMobilePreview: false,
      history: [createEmptyTemplate()],
      historyIndex: 0,

      addBlock: (blockData, parentId) => {
        console.log('Adding block:', blockData, 'parentId:', parentId);
        
        const newBlock: Block = {
          id: uuidv4(),
          ...blockData,
          styles: {
            ...BLOCK_TYPES[blockData.type].defaultStyles,
            ...blockData.styles,
          },
          parentId,
          order: 0,
        };
        
        console.log('New block created:', newBlock);

        set((state) => {
          const newTemplate = { ...state.template };
          
          if (parentId) {
            // Add to parent block
            console.log('Adding block to parent:', parentId);
            const addToParent = (blocks: Block[]): Block[] => {
              return blocks.map(block => {
                if (block.id === parentId) {
                  console.log('Found parent block:', block);
                  const updatedBlock = {
                    ...block,
                    children: [...(block.children || []), newBlock],
                  };
                  console.log('Updated parent block:', updatedBlock);
                  return updatedBlock;
                }
                if (block.children) {
                  return {
                    ...block,
                    children: addToParent(block.children),
                  };
                }
                return block;
              });
            };
            newTemplate.blocks = addToParent(newTemplate.blocks);
          } else {
            // Add to root level
            newBlock.order = newTemplate.blocks.length;
            newTemplate.blocks = [...newTemplate.blocks, newBlock];
          }

          newTemplate.updatedAt = new Date();
          return {
            template: newTemplate,
            selectedBlockId: newBlock.id,
          };
        });

        get().saveToHistory();
      },

      updateBlock: (id, updates) => {
        set((state) => {
          const newTemplate = { ...state.template };
          
          const updateBlockInTree = (blocks: Block[]): Block[] => {
            return blocks.map(block => {
              if (block.id === id) {
                return { ...block, ...updates };
              }
              if (block.children) {
                return {
                  ...block,
                  children: updateBlockInTree(block.children),
                };
              }
              return block;
            });
          };

          newTemplate.blocks = updateBlockInTree(newTemplate.blocks);
          newTemplate.updatedAt = new Date();
          
          return { template: newTemplate };
        });

        get().saveToHistory();
      },

      deleteBlock: (id) => {
        set((state) => {
          const newTemplate = { ...state.template };
          
          const removeFromTree = (blocks: Block[]): Block[] => {
            return blocks
              .filter(block => block.id !== id)
              .map(block => {
                if (block.children) {
                  return {
                    ...block,
                    children: removeFromTree(block.children),
                  };
                }
                return block;
              });
          };

          newTemplate.blocks = removeFromTree(newTemplate.blocks);
          newTemplate.updatedAt = new Date();
          
          return {
            template: newTemplate,
            selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
          };
        });

        get().saveToHistory();
      },

      duplicateBlock: (id) => {
        set((state) => {
          const newTemplate = { ...state.template };
          
          const duplicateInTree = (blocks: Block[]): Block[] => {
            return blocks.map(block => {
              if (block.id === id) {
                const duplicatedBlock: Block = {
                  ...block,
                  id: uuidv4(),
                  order: (block.order || 0) + 1,
                };
                return [block, duplicatedBlock];
              }
              if (block.children) {
                return {
                  ...block,
                  children: duplicateInTree(block.children).flat(),
                };
              }
              return block;
            }).flat();
          };

          newTemplate.blocks = duplicateInTree(newTemplate.blocks);
          newTemplate.updatedAt = new Date();
          
          return { template: newTemplate };
        });

        get().saveToHistory();
      },

      moveBlock: (id, newParentId, newIndex) => {
        set((state) => {
          const newTemplate = { ...state.template };
          
          // Find and remove the block from its current position
          let blockToMove: Block | null = null;
          const removeFromTree = (blocks: Block[]): Block[] => {
            return blocks.filter(block => {
              if (block.id === id) {
                blockToMove = block;
                return false;
              }
              if (block.children) {
                block.children = removeFromTree(block.children);
              }
              return true;
            });
          };

          newTemplate.blocks = removeFromTree(newTemplate.blocks);
          
          // Add the block to its new position
          if (blockToMove) {
            (blockToMove as Block).parentId = newParentId || undefined;
            (blockToMove as Block).order = newIndex;
            
            if (newParentId) {
              const addToParent = (blocks: Block[]): Block[] => {
                return blocks.map(block => {
                  if (block.id === newParentId) {
                    const children = [...(block.children || [])];
                    children.splice(newIndex, 0, blockToMove!);
                    return { ...block, children };
                  }
                  if (block.children) {
                    return {
                      ...block,
                      children: addToParent(block.children),
                    };
                  }
                  return block;
                });
              };
              newTemplate.blocks = addToParent(newTemplate.blocks);
            } else {
              newTemplate.blocks.splice(newIndex, 0, blockToMove);
            }
          }

          newTemplate.updatedAt = new Date();
          return { template: newTemplate };
        });

        get().saveToHistory();
      },

      selectBlock: (id) => {
        set({ selectedBlockId: id });
      },

      updateTemplate: (updates) => {
        set((state) => ({
          template: {
            ...state.template,
            ...updates,
            updatedAt: new Date(),
          },
        }));
        get().saveToHistory();
      },

      clearTemplate: () => {
        const emptyTemplate = createEmptyTemplate();
        set({
          template: emptyTemplate,
          selectedBlockId: null,
          history: [emptyTemplate],
          historyIndex: 0,
        });
      },

      loadTemplate: (template) => {
        set({
          template,
          selectedBlockId: null,
          history: [template],
          historyIndex: 0,
        });
      },

      undo: () => {
        set((state) => {
          if (state.historyIndex > 0) {
            const newIndex = state.historyIndex - 1;
            return {
              template: state.history[newIndex],
              historyIndex: newIndex,
              selectedBlockId: null,
            };
          }
          return state;
        });
      },

      redo: () => {
        set((state) => {
          if (state.historyIndex < state.history.length - 1) {
            const newIndex = state.historyIndex + 1;
            return {
              template: state.history[newIndex],
              historyIndex: newIndex,
              selectedBlockId: null,
            };
          }
          return state;
        });
      },

      saveToHistory: () => {
        set((state) => {
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(state.template);
          
          // Limit history to 50 entries
          if (newHistory.length > 50) {
            newHistory.shift();
          } else {
            return {
              history: newHistory,
              historyIndex: newHistory.length - 1,
            };
          }
          
          return {
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      togglePreview: () => {
        set((state) => ({ isPreviewMode: !state.isPreviewMode }));
      },

      toggleMobilePreview: () => {
        set((state) => ({ isMobilePreview: !state.isMobilePreview }));
      },

      exportHTML: () => {
        const { template } = get();
        return generateHTML(template);
      },
    }),
    {
      name: 'email-builder-store',
      partialize: (state) => ({
        template: state.template,
        history: state.history,
        historyIndex: state.historyIndex,
      }),
    }
  )
);
