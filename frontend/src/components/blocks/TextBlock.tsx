import { Block, useBuilder } from '../../store/useBuilderStore';
import { useRef } from 'react';

export const TextBlock = ({ block }: { block: Block }) => {
  const { selectedId, setContent, select, updateBlock } = useBuilder();
  const ref = useRef<HTMLDivElement>(null);

  // drag-resize
  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startW = ref.current?.offsetWidth || 400;

    const move = (m: MouseEvent) => {
      const dx = m.clientX - startX;
      updateBlock(block.id, { w: Math.max(200, startW + dx) });
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <div
      ref={ref}
      className={`relative my-2 p-2 border ${
        selectedId === block.id ? 'border-blue-500' : 'border-transparent'
      }`}
      style={{ width: block.w }}
      onClick={(e) => {
        e.stopPropagation();
        select(block.id);
      }}
    >
      <textarea
        value={block.content}
        onChange={(e) => setContent(block.id, e.target.value)}
        className="w-full bg-transparent outline-none resize-none"
      />

      {/* resizer */}
      <div
        className="absolute w-4 h-4 bg-blue-400 bottom-0 right-0 cursor-se-resize"
        onMouseDown={onMouseDown}
      />
    </div>
  );
};
