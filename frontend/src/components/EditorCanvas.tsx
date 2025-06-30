import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBuilder } from '../store/useBuilderStore';
import { TextBlock } from './blocks/TextBlock';
import { ImageBlock } from './blocks/ImageBlock';

const SortableBlockWrapper = ({ id, children }: { id: string; children: JSX.Element }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

export const EditorCanvas = () => {
  const sensors = useSensors(useSensor(PointerSensor));
  const { blocks, addBlock, moveBlock, select } = useBuilder();

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;

    // добавление из палетки
    if (active.id.toString().startsWith('palette-')) {
      addBlock(active.data.current?.type);
      return;
    }

    // сортировка на холсте
    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      moveBlock(active.id as string, newIndex);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <main
        className="flex-1 overflow-y-auto p-10 bg-gray-50"
        onClick={() => select(undefined)}
      >
        {blocks.length === 0 && (
          <p className="text-gray-400 text-center select-none mt-20">
            Перетащите блок или кликните по&nbsp;палетке
          </p>
        )}

        <SortableContext
          items={blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {blocks
            .sort((a, b) => a.position - b.position)
            .map((b) => (
              <SortableBlockWrapper key={b.id} id={b.id}>
                {b.type === 'text' ? (
                  <TextBlock block={b} />
                ) : (
                  <ImageBlock block={b} />
                )}
              </SortableBlockWrapper>
            ))}
        </SortableContext>
      </main>
    </DndContext>
  );
};
