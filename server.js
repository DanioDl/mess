const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// --- база в памяти ---
let usersDB = {};       // username: password
let onlineUsers = {};   // socket.id: username
let messages = [];      // все сообщения

// Регистрация
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ success: false, message: "Введите логин и пароль" });
  if (usersDB[username]) return res.json({ success: false, message: "Пользователь уже существует" });

  usersDB[username] = password;
  return res.json({ success: true });
});

// Логин
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (usersDB[username] === password) return res.json({ success: true });
  return res.json({ success: false, message: "Неверный логин или пароль" });
});

// --- Socket.io ---
io.on("connection", (socket) => {
  console.log("Подключился пользователь");

  socket.on("join", (username) => {
    onlineUsers[socket.id] = username;

    // обновляем список онлайн
    io.emit("users", Object.values(onlineUsers));

    // загружаем прошлые сообщения
    socket.emit("load-messages", messages);
  });

  socket.on("send-message", (data) => {
    messages.push(data);
    io.emit("receive-message", data);
  });

  socket.on("disconnect", () => {
    delete onlineUsers[socket.id];
    io.emit("users", Object.values(onlineUsers));
  });
});

server.listen(3000, () => {
  console.log("Сервер с авторизацией запущен на порту 3000");
});