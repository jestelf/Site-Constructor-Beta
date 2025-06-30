import { create } from 'zustand';
import { v4 as uuid } from 'uuid';

export type BlockType = 'text' | 'image';

export type Block = {
  id: string;
  type: BlockType;
  content: string;
  position: number;
  x?: number;          // для свободного перемещения
  y?: number;
  w?: number;          // ширина (для текстового)
};

type State = {
  blocks: Block[];
  selectedId?: string;
  addBlock: (type: BlockType) => void;
  moveBlock: (id: string, toIndex: number) => void;
  setContent: (id: string, content: string) => void;
  updateBlock: (id: string, patch: Partial<Block>) => void;
  removeBlock: (id: string) => void;
  select: (id?: string) => void;
};

export const useBuilder = create<State>((set) => ({
  blocks: [],
  addBlock: (type) =>
    set((s) => ({
      blocks: [
        ...s.blocks,
        {
          id: uuid(),
          type,
          content: type === 'text' ? 'Текст' : '',
          position: s.blocks.length,
          w: 400,
          x: 0,
          y: 0,
        },
      ],
    })),
  moveBlock: (id, to) =>
    set((s) => {
      const arr = [...s.blocks].sort((a, b) => a.position - b.position);
      const from = arr.findIndex((b) => b.id === id);
      if (from === -1) return { blocks: s.blocks };
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return {
        blocks: arr.map((b, i) => ({ ...b, position: i })),
      };
    }),
  setContent: (id, content) =>
    set((s) => ({
      blocks: s.blocks.map((b) => (b.id === id ? { ...b, content } : b)),
    })),
  updateBlock: (id, patch) =>
    set((s) => ({
      blocks: s.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    })),
  removeBlock: (id) =>
    set((s) => ({
      blocks: s.blocks.filter((b) => b.id !== id),
      selectedId: s.selectedId === id ? undefined : s.selectedId,
    })),
  select: (id) => set({ selectedId: id }),
}));
