import { startServer } from "./app.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

startServer(PORT).catch(console.error);
