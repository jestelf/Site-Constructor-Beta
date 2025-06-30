import { useDraggable } from '@dnd-kit/core';
import { useBuilder } from '../store/useBuilderStore';

type PaletteType = 'text' | 'image';

const PaletteItem = ({ type }: { type: PaletteType }) => {
  const { addBlock } = useBuilder();
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `palette-${type}`,
    data: { type },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => addBlock(type)}
      className="p-2 my-1 bg-slate-200 rounded cursor-grab active:cursor-grabbing select-none"
    >
      {type === 'text' ? 'Текстовый блок' : 'Картинка'}
    </div>
  );
};

export const Sidebar = () => (
  <aside className="w-56 p-4 border-r shrink-0">
    <h2 className="font-bold mb-2">Библиотека</h2>
    <PaletteItem type="text" />
    <PaletteItem type="image" />
  </aside>
);
