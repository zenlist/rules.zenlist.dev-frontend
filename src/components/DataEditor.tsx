export const DataEditor: React.FC<{
  name: string;
  data: string;
  onUpdate: (newData: string) => void;
}> = ({ name, data, onUpdate }) => {
  const lines = data.split("\n").length + 2;
  return (
    <textarea
      rows={lines}
      onChange={(event) => onUpdate(event.target.value)}
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      value={data}
    />
  );
};
