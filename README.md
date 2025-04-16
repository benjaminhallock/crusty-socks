# Pixel Party

version 1.2

## Crusty Socks Studios

Benjamin Burton - Scrum Master  

Benjamin Hallock - Product Manager  

Luis Reyes - Developer  

Vincenzo Montefusco - Developer  


Donovan Capet - Product Owner  


## About

A multiplayer drawing and guessing game inspired by Pictionary and scribbl.io. Built with React, Socket.io, Express.js, and a MongoDB-powered backend.  


Original Music by Benjamin Burton  

Official tracks can be found at (PUT LINK HERE)  



## Project Structure

This project consists of two main parts:

- **Client**: React application built with Vite
- **Server**: Express.js backend with Socket.io for real-time communication

## Development

### Prerequisites

- Node.js >= 18
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/benjaminhallock/crusty-socks.git
cd crustysocks
```

2. Install dependencies for both client and server:
```bash
npm install
```

3. Set up environment variables:
   - Copy `server/config.env.example` to `server/config.env` and update values
   - Copy `client/.env.local.example` to `client/.env.local` and update values

### Running in Development Mode

Start both the client and server concurrently:
```bash
npm run dev
```

Or run them separately:
```bash
npm run dev:client
npm run dev:server
```

- Client will run on: http://localhost:5174
- Server will run on: http://localhost:3001

## Deployment

### Deploying to Vercel

This project is configured for seamless deployment to Vercel.

1. Create a new project on Vercel and link your GitHub repository
2. Vercel will automatically detect the configuration from `vercel.json`
3. Add the following environment variables in Vercel:
   - `ATLAS_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure string for JWT token signing
   - `NODE_ENV`: Set to `production`
   - `CLIENT_URL`: URL of your deployed client

### Manual Deployment

To build the application for production:

```bash
npm run build
```

This will build the client application, ready to be served by the server.

## Environment Variables

### Server

- `ATLAS_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT token signing
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)
- `CLIENT_URL`: URL of the client application

### Client

- `VITE_API_URL`: URL of the backend API
- `VITE_SOCKET_URL`: URL for Socket.io connection

## Features

- Real-time multiplayer drawing and guessing gameplay
- User authentication and profiles
- Leaderboard for competitive rankings
- Player chat system
- Admin controls for moderation
- Responsive design for desktop and mobile
