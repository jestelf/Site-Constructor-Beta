import { useBuilder } from '../store/useBuilderStore';

export const Toolbar = () => {
  const { selectedId, blocks, setContent, removeBlock } = useBuilder();
  const block = blocks.find((b) => b.id === selectedId);

  if (!block) return <aside className="w-0" />;

  return (
    <aside className="w-64 p-4 border-l shrink-0">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-bold">Свойства</h2>
        <button
          className="text-red-500"
          onClick={() => removeBlock(block.id)}
          title="Удалить блок"
        >
          🗑
        </button>
      </div>

      {block.type === 'text' && (
        <>
          <label className="text-xs text-gray-600">Текст</label>
          <textarea
            value={block.content}
            onChange={(e) => setContent(block.id, e.target.value)}
            className="w-full border p-1"
          />
        </>
      )}

      {block.type === 'image' && (
        <>
          <label className="text-xs text-gray-600">URL картинки</label>
          <input
            type="text"
            value={block.content}
            onChange={(e) => setContent(block.id, e.target.value)}
            className="w-full border p-1"
          />
        </>
      )}
    </aside>
  );
};
