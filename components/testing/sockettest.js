function SocketTester() {
  const { socket } = useSocket();

  const sendTestEvent = () => {
    if (!socket) return;
    
    socket.emit("test-event", { 
      message: "This is a test",
      timestamp: new Date().toISOString()
    });
  };

  return (
    <Button onClick={sendTestEvent}>
      Send Test Event
    </Button>
  );
}