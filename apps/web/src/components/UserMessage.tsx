interface UserMessageProps {
  content: string;
}

export default function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-end mb-4 px-4">
      <div className="max-w-3xl">
        <div className="bg-cyan-500/20 border border-cyan-400/30 rounded-2xl rounded-tr-sm px-4 py-3 backdrop-blur-sm">
          <p className="text-gray-900 dark:text-white text-sm whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    </div>
  );
}

