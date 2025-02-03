import { createContext, useContext, useEffect, useState } from 'react';
import { socket } from '../socket';
import { useParams, useNavigate } from 'react-router-dom';

const ChatroomContext = createContext(null);

export const ChatroomProvider = ({ children }) => {
  const [room, setRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { roomId } = useParams();

  useEffect(() => {
    const username = localStorage.getItem('username');
    if (!roomId || !username) {
      navigate('/');
      return;
    }
    // Join the specific room
    socket.emit('joinRoom', { roomId });

    socket.on('roomJoined', (roomData) => {
      setRoom(roomData);
      setUsers(roomData.users);
      setIsHost(roomData.hostId === socket.id);
      setError(null);
    });

    socket.on('roomNotFound', () => {
      setError('Room not found');
      navigate('/');
    });

    socket.on('userJoined', (userData) => {
      setUsers(prev => [...prev.filter(u => u.id !== userData.id), userData]);
    });

    socket.on('userLeft', (userId) => {
      setUsers(prev => prev.filter(user => user.id !== userId));
    });

    socket.on('hostChanged', (newHostId) => {
      setIsHost(newHostId === socket.id);
    });

    return () => {
      socket.emit('leaveLobby', { roomId });
      socket.off('roomJoined');
      socket.off('roomNotFound');
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('hostChanged');
    };
  }, [roomId, navigate]);

  const value = {
    room,
    users,
    isHost,
    error,
    roomUrl: roomId ? `${window.location.origin}/lobby/${roomId}` : null
  };

  return (
    <ChatroomContext.Provider value={value}>
      {children}
    </ChatroomContext.Provider>
  );
};

export const useChatroom = () => {
  const context = useContext(ChatroomContext);
  if (!context) {
    throw new Error('useChatroom must be used within a ChatroomProvider');
  }
  return context;
};
