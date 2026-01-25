import { io } from "socket.io-client";

export const socket = io("http://localhost:8003", {
  autoConnect: false,  
  withCredentials: true,
   transports: ["websocket", "polling"],
});

socket.on("connect_error", (err) => {
  console.log("Socket connection error:", err.message);

   
  alert(`Socket Error: ${err.message}`);
});