const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

let notifications = [];

app.prepare().then(() => {
	const server = createServer((req, res) => {
		const parsedUrl = parse(req.url, true);
		handle(req, res, parsedUrl);
	});

	const io = new Server(server);

	io.on("connection", (socket) => {
		console.log("New Socket.IO connection");

		// Send all current notifications to the new client
		socket.emit("initialNotifications", notifications);

		socket.on("sendNotification", (message, table) => {
			const newNotification = {
				id: Date.now(),
				message: message,
				table: table,
				timestamp: new Date().toISOString(),
			};
			notifications.push(newNotification);
			io.emit("newNotification", newNotification);
		});

		socket.on("deleteNotification", (id) => {
			notifications = notifications.filter((n) => n.id !== id);
			io.emit("deleteNotification", id);
		});

		socket.on("disconnect", () => {
			console.log("Socket.IO connection closed");
		});
	});

	server.listen(3000, (err) => {
		if (err) throw err;
		console.log("> Ready on http://localhost:3000");
	});
});
