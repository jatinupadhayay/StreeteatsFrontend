function SocketMonitor() {
  const { socket, isConnected } = useSocket();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!socket) return;

    const eventListener = (eventName: string, data: any) => {
      setEvents(prev => [{
        name: eventName,
        data: JSON.stringify(data, null, 2),
        timestamp: new Date().toISOString()
      }, ...prev].slice(0, 20));
    };

    // Listen to all events
    socket.onAny(eventListener);

    return () => {
      socket.offAny(eventListener);
    };
  }, [socket]);

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 shadow-lg rounded-lg max-h-80 overflow-auto">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span>Socket Status: {isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>
      <div className="space-y-2">
        {events.map((event, i) => (
          <div key={i} className="p-2 border rounded">
            <div className="font-mono text-sm">
              [{new Date(event.timestamp).toLocaleTimeString()}] {event.name}
            </div>
            <pre className="text-xs mt-1 overflow-x-auto">{event.data}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}