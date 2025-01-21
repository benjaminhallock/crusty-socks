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

    socket.on('correctGuess', ({ winner, word }) => {
      setMessages(prev => [...prev, {
        user: 'System',
        message: `${winner} correctly guessed the word: ${word}!`,
        timestamp: Date.now()
      }]);
    });

    return () => {
      socket.off('chatMessage');
      socket.off('correctGuess');
    };
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    socket.emit('guess', { user: username, message: input });
    setInput('');
  };

  return (
    <div className="h-full border-4 border-indigo-300 bg-white rounded-lg shadow-lg flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i} className="mb-2">
            <span className="font-bold text-indigo-600">{msg.user}: </span>
            <span>{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t bg-indigo-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Type your guess..."
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
