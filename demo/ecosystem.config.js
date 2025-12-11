module.exports = {
  apps: [
    {
      name: "demo-backend",
      cwd: "./backend",
      script: "uv",
      args: "run python main.py",
      interpreter: "none",
      env: {
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      },
    },
    {
      name: "demo-frontend",
      cwd: "./frontend",
      script: "npm",
      args: "run dev -- -p 3001",
      interpreter: "none",
    },
  ],
};