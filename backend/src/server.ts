
import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});




app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  });
}); 