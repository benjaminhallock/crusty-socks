import { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import confetti from 'canvas-confetti';

const ChatBox = ({ username }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on('chatMessage', (message) => {
      setMessages(prev => [...prev, { ...message, type: 'chat' }]);
    });

    socket.on('correctGuess', ({ winner, word }) => {
      setMessages(prev => [...prev, {
        user: 'System',
        message: `${winner} correctly guessed the word: ${word}!`,
        timestamp: Date.now(),
        type: 'success'
      }]);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
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

  const getMessageStyle = (type) => {
    switch(type) {
      case 'success':
        return 'bg-green-100 animate-bounce-in';
      case 'chat':
        return 'animate-bounce-in';
      default:
        return '';
    }
  };

  return (
    <div className="h-full border-4 border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 p-2 rounded ${getMessageStyle(msg.type)} dark:bg-gray-700`}>
            <span className={`font-bold ${
              msg.user === 'System' 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-indigo-600 dark:text-indigo-400'
            }`}>
              {msg.user}:
            </span>
            <span className="ml-2 dark:text-gray-200">{msg.message}</span>
          </div>
        ))}
        {typing.length > 0 && (
          <div className="flex items-center space-x-2 text-gray-400 dark:text-gray-500">
            <span className="text-sm">{typing.join(', ')} typing</span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-gray-900">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            placeholder="Type your guess..."
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-700"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
