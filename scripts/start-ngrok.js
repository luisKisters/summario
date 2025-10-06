const { spawn } = require("child_process");
const fs = require("fs/promises");
const path = require("path");

const ENV_VAR = "NEXT_PUBLIC_APP_URL";
const PORT = 3000;
const NGROK_API = "http://127.0.0.1:4040/api/tunnels";
const RETRY_INTERVAL = 500;
const MAX_RETRIES = 10;

async function updateEnvFile(url) {
  const envPath = path.join(process.cwd(), ".env");
  let envContent = "";
  try {
    envContent = await fs.readFile(envPath, "utf-8");
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }

  const lines = envContent.split("\n");
  let found = false;
  const newLines = lines.map((line) => {
    if (line.startsWith(`${ENV_VAR}=`)) {
      found = true;
      return `${ENV_VAR}=${url}`;
    }
    return line;
  });

  if (!found) {
    newLines.push(`${ENV_VAR}=${url}`);
  }

  await fs.writeFile(envPath, newLines.join("\n"));
  console.log(`✅ Updated .env with ${ENV_VAR}=${url}`);
}

async function getNgrokUrl() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
      const response = await fetch(NGROK_API);
      const data = await response.json();
      const httpsTunnel = data.tunnels.find((t) => t.proto === "https");
      if (httpsTunnel) {
        return httpsTunnel.public_url;
      }
    } catch (error) {
      // Ignore and retry
    }
  }
  throw new Error("Could not get ngrok URL after multiple retries.");
}

(async () => {
  try {
    const url = await getNgrokUrl();
    await updateEnvFile(url);
  } catch (error) {
    console.error("❌ Failed to start ngrok and update .env file.");
    console.error(error);
    process.exit(1);
  }
})();
