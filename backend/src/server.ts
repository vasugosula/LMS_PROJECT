import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { Server as SocketIOServer } from "socket.io";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: "*", credentials: true } });

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
	res.json({ ok: true });
});

const DEFAULT_MONGO = "mongodb+srv://venky:venky123@cluster0.fbqkaj7.mongodb.net/feedback-app?retryWrites=true&w=majority&appName=Cluster0";
const MONGO_URI = (process.env.MONGO_URI as string) || DEFAULT_MONGO;
const PORT = Number(process.env.PORT || 4000);

mongoose
	.connect(MONGO_URI)
	.then(() => {
		console.log("MongoDB connected");
		server.listen(PORT, () => {
			console.log(`API listening on port ${PORT}`);
		});
	})
	.catch((err) => {
		console.error("MongoDB connection error:", err);
		process.exit(1);
	});

io.on("connection", (socket) => {
	console.log("socket connected", socket.id);
	socket.on("disconnect", () => console.log("socket disconnected", socket.id));
});
