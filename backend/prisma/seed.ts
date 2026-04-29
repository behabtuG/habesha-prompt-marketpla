// prisma/seed.ts
import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import * as CryptoJS from 'crypto-js';

// In Prisma 5.9.1, just create PrismaClient normally
const prisma = new PrismaClient();

// Your Telegram ID
const YOUR_TELEGRAM_ID = 361650959;

async function main() {
  console.log('🌱 Seeding database...');

  try {
    // First, check if tables exist
    console.log('🔍 Checking database connection...');

    // Try a simple query to see if tables exist
    try {
      const tableCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      console.log(`📊 Tables in database: ${tableCount[0].count}`);
    } catch (error) {
      console.log('⚠️  Database might not have tables yet');
    }

    // First, ensure your user exists and is admin
    console.log(`🛠️  Setting Telegram ID ${YOUR_TELEGRAM_ID} as admin...`);

    const adminUser = await prisma.user.upsert({
      where: { telegramId: BigInt(YOUR_TELEGRAM_ID) },
      update: {
        username: 'begetm',
        firstName: 'Behabtu',
        isAdmin: true,
        role: UserRole.ADMIN,
        telegramData: {
          id: YOUR_TELEGRAM_ID,
          first_name: 'Behabtu',
          username: 'begetm',
        },
      },
      create: {
        telegramId: BigInt(YOUR_TELEGRAM_ID),
        username: 'begetm',
        firstName: 'Behabtu',
        isAdmin: true,
        role: UserRole.ADMIN,
        telegramData: {
          id: YOUR_TELEGRAM_ID,
          first_name: 'Behabtu',
          username: 'begetm',
        },
      },
    });

    console.log('✅ Admin user set!');

    // Check if we should seed sample prompts
    const existingPrompts = await prisma.prompt.count();

    if (existingPrompts > 0) {
      console.log(
        `📝 ${existingPrompts} prompts already exist. Skipping prompt creation.`,
      );
    } else {
      console.log('📝 Creating sample prompts...');
      await createSamplePrompts(adminUser.id);
    }

    console.log('🎉 Seeding completed successfully!');
  } catch (error: any) {
    console.error('❌ Seeding failed:', error);

    // Check specific errors
    if (error.code === 'P2021' || error.message.includes('does not exist')) {
      console.log('\n⚠️  Database tables do not exist yet!');
      console.log('👉 Run these commands first:');
      console.log('   npx prisma db push');
      console.log('   or');
      console.log('   npx prisma migrate dev --name init');
    }
    throw error;
  }
}

async function createSamplePrompts(creatorId: string) {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY is not set in environment variables');
  }

  const prompts = [
    {
      title: 'Modern React Dashboard',
      slug: `react-dashboard-${Date.now()}`,
      description:
        'Create a beautiful admin dashboard with React and Tailwind CSS',
      category: 'UI_UX',
      previewContent:
        'Build a responsive admin dashboard with sidebar navigation, interactive charts, and data tables. Perfect for SaaS applications and admin panels.',
      fullContent:
        'Create a React dashboard with the following components:\n\n1. Sidebar Navigation:\n   - Logo section\n   - Menu items with icons\n   - Collapsible submenus\n   - Active state highlighting\n\n2. Header:\n   - User profile dropdown\n   - Search bar\n   - Notifications bell\n   - Theme toggle (dark/light mode)\n\n3. Main Content:\n   - Stats cards with numbers and trends\n   - Interactive charts using Recharts\n   - Data tables with sorting and pagination\n   - Recent activity feed\n\n4. Responsive Design:\n   - Mobile-friendly sidebar toggle\n   - Grid layout using Tailwind CSS\n   - Dark mode support\n\nTech Stack: React 18, TypeScript, Tailwind CSS, Recharts, React Query.',
      priceStars: 299,
      priceTon: 5.0,
      priceLocal: 299.0,
      tags: ['react', 'dashboard', 'tailwind', 'typescript'],
    },
    {
      title: 'AI Image Generation Prompts',
      slug: `ai-image-prompts-${Date.now()}`,
      description: 'Midjourney and DALL-E prompts for stunning digital art',
      category: 'Images',
      previewContent:
        'Collection of professional prompts for generating AI art. Includes styles, lighting, composition tips.',
      fullContent:
        'Here are premium Midjourney prompts:\n\n1. **Fantasy Landscape:**\n   "epic fantasy landscape, mystical forest with glowing mushrooms, ancient ruins, misty atmosphere, digital painting, art by Greg Rutkowski and Thomas Kinkade, 8k, detailed" --ar 16:9 --v 6.0\n\n2. **Cyberpunk City:**\n   "neon-lit cyberpunk city street at night, rain reflections, flying cars, holographic advertisements, Blade Runner style, cinematic lighting, futuristic, 8k" --ar 2:3 --v 6.0\n\n3. **Portrait Photography:**\n   "professional portrait photography, beautiful woman with freckles, natural lighting, shallow depth of field, film grain, shot on Portra 400, 85mm lens, bokeh background" --ar 4:5 --v 6.0\n\n4. **Product Visualization:**\n   "product photography, modern smartphone on marble surface, studio lighting, clean background, commercial shot, sharp focus, advertising quality" --ar 1:1 --v 6.0\n\nTips:\n- Use --ar for aspect ratio\n- --v for version (6.0 recommended)\n- Combine multiple artists for unique styles\n- Add lighting keywords: cinematic, golden hour, rim light\n- Use quality parameters: 8k, ultra detailed, professional',
      priceStars: 199,
      priceTon: 3.5,
      priceLocal: 199.0,
      tags: ['ai', 'midjourney', 'dalle', 'art', 'prompts'],
    },
    {
      title: 'Python Data Analysis Script',
      slug: `python-data-analysis-${Date.now()}`,
      description:
        'Complete Python script for data cleaning, visualization, and ML',
      category: 'Code',
      previewContent:
        'Automated data pipeline with pandas, matplotlib, and scikit-learn. From raw data to insights.',
      fullContent:
        '# Complete Data Analysis Pipeline\n\n```python\nimport pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\nimport seaborn as sns\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.ensemble import RandomForestClassifier\nfrom sklearn.metrics import classification_report, confusion_matrix\n\n# ... (full content as before) ...\n```',
      priceStars: 349,
      priceTon: 6.0,
      priceLocal: 349.0,
      tags: [
        'python',
        'data-science',
        'machine-learning',
        'pandas',
        'scikit-learn',
      ],
    },
  ];

  for (const promptData of prompts) {
    try {
      // Encrypt full content
      const encryptedContent = CryptoJS.AES.encrypt(
        promptData.fullContent,
        encryptionKey,
      ).toString();

      // Create or find tags
      const tagPromises = promptData.tags.map((tagName) =>
        prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        }),
      );
      const tags = await Promise.all(tagPromises);

      // Create prompt
      const prompt = await prisma.prompt.create({
        data: {
          title: promptData.title,
          slug: promptData.slug,
          description: promptData.description,
          category: promptData.category,
          previewContent: promptData.previewContent,
          fullContent: encryptedContent,
          priceStars: promptData.priceStars,
          priceTon: promptData.priceTon,
          priceLocal: promptData.priceLocal,
          creatorId: creatorId,
          isActive: true,
          tags: {
            connect: tags.map((tag) => ({ id: tag.id })),
          },
        },
      });

      console.log(`✅ Created: ${promptData.title} with ${tags.length} tags`);
    } catch (error: any) {
      console.error(`❌ Error creating ${promptData.title}:`, error.message);
      // Continue with other prompts even if one fails
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
