
import app from "./app.js";
import { env } from "./config/env.js";
import { redisClient } from "./lib/redis.js";



app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});


