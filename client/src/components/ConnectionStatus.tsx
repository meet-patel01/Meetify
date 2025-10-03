interface ConnectionStatusProps {
  message: string;
}

export default function ConnectionStatus({ message }: ConnectionStatusProps) {
  return (
    <div className="fixed bottom-4 left-4 meeting-card text-white px-4 py-2 rounded-lg shadow-lg meeting-border border">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
}
