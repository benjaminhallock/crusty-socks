import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Chat from '../models/chat';
import Lobby from '../models/lobby';
import app from '../server';

describe('Chat Integration Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Chat.deleteMany({});
    await Lobby.deleteMany({});
  });

  describe('Chat Model', () => {
    it('should require username field', async () => {
      const chatWithoutUsername = new Chat({
        lobbyObjectId: new mongoose.Types.ObjectId(),
        message: 'test message'
      });

      await expect(chatWithoutUsername.save()).rejects.toThrow('Chat validation failed: username: Path `username` is required.');
    });

    it('should create chat message with valid data', async () => {
      const validChat = new Chat({
        lobbyObjectId: new mongoose.Types.ObjectId(),
        username: 'testUser',
        message: 'test message'
      });

      const savedChat = await validChat.save();
      expect(savedChat.username).toBe('testUser');
      expect(savedChat.message).toBe('test message');
    });
  });
});
