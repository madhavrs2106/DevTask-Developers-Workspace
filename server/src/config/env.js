import "dotenv/config";

function withDefault(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

export const env = {
  nodeEnv: withDefault("NODE_ENV", "development"),
  port: Number(withDefault("PORT", 5000)),
  jwtSecret: withDefault("JWT_SECRET", "devtask-dev-secret-change-me"),
  jwtExpiresIn: withDefault("JWT_EXPIRES_IN", "7d"),
  clientOrigins: withDefault("CLIENT_ORIGIN", "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};

if (env.nodeEnv === "production" && env.jwtSecret === "devtask-dev-secret-change-me") {
  console.warn("⚠️  WARNING: using the default JWT secret in production is unsafe.");
}
