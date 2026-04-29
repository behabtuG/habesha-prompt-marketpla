Write-Host "=== Telegram Prompt Marketplace Setup ===" -ForegroundColor Cyan
Write-Host "Starting setup process..." -ForegroundColor Yellow

# Step 1: Install dependencies
Write-Host "`n1. Installing dependencies..." -ForegroundColor Green
npm install

# Step 2: Start Docker services
Write-Host "`n2. Starting Docker services..." -ForegroundColor Green
docker-compose up -d

Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 3: Generate Prisma client
Write-Host "`n3. Generating Prisma client..." -ForegroundColor Green
npx prisma generate

# Step 4: Run database migrations
Write-Host "`n4. Running database migrations..." -ForegroundColor Green
npx prisma migrate dev --name init

# Step 5: Seed database with sample data
Write-Host "`n5. Seeding database..." -ForegroundColor Green
@'
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample prompts
  const prompts = [
    {
      slug: 'react-dashboard',
      title: 'Modern React Dashboard',
      description: 'Create a beautiful admin dashboard with React and Tailwind CSS',
      category: 'UI_UX',
      previewContent: 'Create a React dashboard with sidebar navigation, charts, and data tables...',
      fullContent: 'Here is the complete prompt for creating a React dashboard...',
      exampleOutput: { images: [], code: '// React code here', previewUrl: '' },
      priceStars: 299,
      priceTon: 5.0,
      priceLocal: 2.99,
    },
    {
      slug: 'nodejs-api',
      title: 'Node.js REST API',
      description: 'Build a secure REST API with Node.js, Express, and JWT authentication',
      category: 'CODE',
      previewContent: 'Create a Node.js API with user authentication, CRUD operations...',
      fullContent: 'Here is the complete prompt for building a Node.js API...',
      exampleOutput: { images: [], code: '// Node.js code here', previewUrl: '' },
      priceStars: 399,
      priceTon: 7.5,
      priceLocal: 3.99,
    },
    {
      slug: 'midjourney-prompt',
      title: 'AI Art Generation Prompt',
      description: 'Generate stunning digital art with detailed Midjourney prompts',
      category: 'IMAGE',
      previewContent: 'Create a prompt for generating fantasy landscape art with...',
      fullContent: 'Here is the complete Midjourney prompt for fantasy art...',
      exampleOutput: { images: ['sample-art.jpg'], code: '', previewUrl: '' },
      priceStars: 199,
      priceTon: 3.5,
      priceLocal: 1.99,
    },
  ];

  for (const prompt of prompts) {
    await prisma.prompt.upsert({
      where: { slug: prompt.slug },
      update: {},
      create: prompt,
    });
  }

  console.log('✅ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
'@ | Out-File -FilePath seed.ts -Encoding UTF8

npx ts-node seed.ts
Remove-Item seed.ts -Force

# Step 6: Build the project
Write-Host "`n6. Building project..." -ForegroundColor Green
npm run build

Write-Host "`n✅ Setup completed successfully!" -ForegroundColor Green
Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Start the development server:" -ForegroundColor White
Write-Host "   npm run start:dev" -ForegroundColor Yellow
Write-Host "`n2. Test the API endpoints:" -ForegroundColor White
Write-Host "   Health check: http://localhost:3000/api/health" -ForegroundColor Yellow
Write-Host "   Prompts: http://localhost:3000/api/prompts" -ForegroundColor Yellow
Write-Host "`n3. Open Prisma Studio to view data:" -ForegroundColor White
Write-Host "   npm run prisma:studio" -ForegroundColor Yellow
Write-Host "`n4. Update .env file with your Telegram bot token" -ForegroundColor White