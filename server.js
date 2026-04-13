import express from "express";
import cors from "cors";
import connectDB from "./config/database.js";
import rootRouter from "./routes/index.js";
import ownerRoutes from "./routes/owner/owner.routes.js";
import tournamentRoutes from "./routes/owner/tournament.routes.js";
import adminRoutes from "./routes/admin/admin.routes.js";
import verifyOwnerToken from "./middleware/jwt/owner.middleware.js";
import dotenv from 'dotenv';
dotenv.config();

import { Server } from "socket.io";
import http from "http";

const app = express();
const server = http.createServer(app);
let io;

app.use(express.json());
app.use(cors());

// socket initialization
export const initIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // Adjust as per your security needs
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join", (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room: ${roomId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => io;

// routes
// routes
app.use("/api", rootRouter);
// app.use("/api/owner", ownerRoutes); - ownerRoutes is already in rootRouter, avoiding duplicate mounting or just keeping specific ones if needed.
// Tournament route is not in rootRouter, so keep it.
app.use("/api/owner/tournament", verifyOwnerToken, tournamentRoutes);
// app.use("/api/admin", adminRoutes); - adminRoutes is also in rootRouter

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const port = process.env.PORT || 1234;

// Function to start the server
const startServer = async () => {
  try {
    // First, connect to the database
    await connectDB();

    // Initialize Socket.io
    initIO(server);

    // If database connection is successful, start the server
    server.listen(port, () => {
      console.log(`Server is running on port http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Server failed to start:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
