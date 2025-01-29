import { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';

const ChatBox = ({ username }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on('chatMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('chatMessage');
    };
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    socket.emit('guess', { user: username, message: input });
    setInput('');
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className="message text-sm">
            <span className="font-bold text-indigo-600">{msg.user}: </span>
            <span className="text-gray-700">{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="border-t p-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your guess..."
            className="flex-1 px-2 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button 
            type="submit" 
            disabled={!input.trim()} 
            className="bg-indigo-600 text-white px-3 py-1 text-sm rounded-lg disabled:opacity-50 hover:bg-indigo-700"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
