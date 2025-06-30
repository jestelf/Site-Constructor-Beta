import { Block, useBuilder } from '../../store/useBuilderStore';

export const ImageBlock = ({ block }: { block: Block }) => {
  const { selectedId, setContent, select } = useBuilder();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setContent(block.id, reader.result); // base64 для прототипа
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={`my-2 p-2 border ${
        selectedId === block.id ? 'border-blue-500' : 'border-transparent'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        select(block.id);
      }}
    >
      {block.content ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img src={block.content} className="max-w-full" />
      ) : (
        <label className="block cursor-pointer text-center py-8 bg-gray-100">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
          <span className="text-sm text-gray-500">Загрузить изображение</span>
        </label>
      )}
    </div>
  );
};
