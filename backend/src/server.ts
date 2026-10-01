
import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});




app.get("/health", (req, res) => {
  res.send("Hello, World!");
}); 