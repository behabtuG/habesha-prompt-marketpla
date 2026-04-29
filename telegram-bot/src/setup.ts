// telegram-bot/src/setup.ts
import fs from "fs";
import path from "path";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🤖 Telegram Bot Setup Wizard");
console.log("============================");

const questions = [
  {
    name: "token",
    question: "Enter your Bot Token from @BotFather: ",
    validate: (input: string) => input.length > 10,
  },
  {
    name: "username",
    question: "Enter your Bot Username (without @): ",
    validate: (input: string) => input.includes("bot"),
  },
  {
    name: "webAppUrl",
    question: "Enter your Web App URL [http://localhost:3000]: ",
    default: "http://localhost:3000",
  },
  {
    name: "apiUrl",
    question: "Enter your Backend API URL [http://localhost:4060/api]: ",
    default: "http://localhost:4060/api",
  },
];

async function askQuestion(q: any): Promise<string> {
  return new Promise((resolve) => {
    rl.question(q.question, (answer) => {
      if (!answer && q.default) {
        answer = q.default;
      }
      if (q.validate && !q.validate(answer)) {
        console.log("❌ Invalid input. Please try again.");
        askQuestion(q).then(resolve);
      } else {
        resolve(answer);
      }
    });
  });
}

async function setup() {
  console.log("\n📝 Let's set up your Telegram Bot...\n");

  const answers: any = {};

  for (const q of questions) {
    answers[q.name] = await askQuestion(q);
  }

  // Create .env content
  const envContent = `TELEGRAM_BOT_TOKEN=${answers.token}
TELEGRAM_BOT_USERNAME=${answers.username}
WEB_APP_URL=${answers.webAppUrl}
API_URL=${answers.apiUrl}
NODE_ENV=development
`;

  // Write to .env file
  fs.writeFileSync(path.join(__dirname, "..", ".env"), envContent);

  console.log("\n✅ .env file created successfully!");
  console.log("\n📁 File location: telegram-bot/.env");
  console.log("\n🚀 Next steps:");
  console.log("1. Run: npm run dev");
  console.log("2. Open Telegram and find your bot: @" + answers.username);
  console.log("3. Send /start to test");

  rl.close();
}

setup().catch(console.error);
