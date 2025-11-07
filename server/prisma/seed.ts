import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultHobbies = [
  // Sports & Fitness
  { name: 'Running', category: 'Sports & Fitness', description: 'Jogging and running for fitness' },
  { name: 'Gym', category: 'Sports & Fitness', description: 'Weight training and fitness' },
  { name: 'Yoga', category: 'Sports & Fitness', description: 'Yoga and meditation' },
  { name: 'Cycling', category: 'Sports & Fitness', description: 'Biking and cycling' },
  { name: 'Swimming', category: 'Sports & Fitness', description: 'Swimming and water activities' },
  { name: 'Hiking', category: 'Sports & Fitness', description: 'Trail hiking and nature walks' },
  { name: 'Rock Climbing', category: 'Sports & Fitness', description: 'Indoor and outdoor climbing' },
  { name: 'Tennis', category: 'Sports & Fitness', description: 'Tennis and racquet sports' },
  { name: 'Soccer', category: 'Sports & Fitness', description: 'Football and soccer' },
  { name: 'Basketball', category: 'Sports & Fitness', description: 'Basketball and team sports' },

  // Arts & Culture
  { name: 'Photography', category: 'Arts & Culture', description: 'Photography and visual arts' },
  { name: 'Painting', category: 'Arts & Culture', description: 'Painting and drawing' },
  { name: 'Music', category: 'Arts & Culture', description: 'Playing instruments and music appreciation' },
  { name: 'Concerts', category: 'Arts & Culture', description: 'Live music events and festivals' },
  { name: 'Museums', category: 'Arts & Culture', description: 'Museums and art galleries' },
  { name: 'Theater', category: 'Arts & Culture', description: 'Theater and live performances' },
  { name: 'Dance', category: 'Arts & Culture', description: 'Dancing and dance classes' },
  { name: 'Film', category: 'Arts & Culture', description: 'Movies and filmmaking' },
  { name: 'Writing', category: 'Arts & Culture', description: 'Creative writing and literature' },
  { name: 'Poetry', category: 'Arts & Culture', description: 'Poetry and spoken word' },

  // Food & Drink
  { name: 'Cooking', category: 'Food & Drink', description: 'Cooking and culinary arts' },
  { name: 'Baking', category: 'Food & Drink', description: 'Baking and pastry arts' },
  { name: 'Wine', category: 'Food & Drink', description: 'Wine tasting and collecting' },
  { name: 'Craft Beer', category: 'Food & Drink', description: 'Craft beer and brewing' },
  { name: 'Coffee', category: 'Food & Drink', description: 'Coffee culture and brewing' },
  { name: 'Fine Dining', category: 'Food & Drink', description: 'Fine dining and restaurants' },
  { name: 'Vegetarian', category: 'Food & Drink', description: 'Vegetarian and plant-based cooking' },
  { name: 'BBQ', category: 'Food & Drink', description: 'Barbecue and grilling' },

  // Travel & Adventure
  { name: 'Travel', category: 'Travel & Adventure', description: 'Travel and exploring new places' },
  { name: 'Backpacking', category: 'Travel & Adventure', description: 'Backpacking and budget travel' },
  { name: 'Camping', category: 'Travel & Adventure', description: 'Camping and outdoor adventures' },
  { name: 'Road Trips', category: 'Travel & Adventure', description: 'Road trips and driving adventures' },
  { name: 'Beach', category: 'Travel & Adventure', description: 'Beach activities and coastal living' },
  { name: 'Mountains', category: 'Travel & Adventure', description: 'Mountain activities and skiing' },

  // Technology & Gaming
  { name: 'Gaming', category: 'Technology & Gaming', description: 'Video games and gaming culture' },
  { name: 'Board Games', category: 'Technology & Gaming', description: 'Board games and tabletop gaming' },
  { name: 'Tech', category: 'Technology & Gaming', description: 'Technology and gadgets' },
  { name: 'Coding', category: 'Technology & Gaming', description: 'Programming and software development' },
  { name: 'AI', category: 'Technology & Gaming', description: 'Artificial intelligence and machine learning' },

  // Lifestyle & Social
  { name: 'Reading', category: 'Lifestyle & Social', description: 'Books and reading' },
  { name: 'Podcasts', category: 'Lifestyle & Social', description: 'Podcasts and audio content' },
  { name: 'Volunteering', category: 'Lifestyle & Social', description: 'Community service and volunteering' },
  { name: 'Pets', category: 'Lifestyle & Social', description: 'Pet ownership and animal care' },
  { name: 'Gardening', category: 'Lifestyle & Social', description: 'Gardening and plants' },
  { name: 'Fashion', category: 'Lifestyle & Social', description: 'Fashion and style' },
  { name: 'Shopping', category: 'Lifestyle & Social', description: 'Shopping and retail therapy' },
  { name: 'Netflix', category: 'Lifestyle & Social', description: 'Binge-watching and streaming' },
  { name: 'Socializing', category: 'Lifestyle & Social', description: 'Social events and meeting people' },
  { name: 'Networking', category: 'Lifestyle & Social', description: 'Professional networking and events' },

  // Intellectual & Educational
  { name: 'Learning', category: 'Intellectual & Educational', description: 'Continuous learning and education' },
  { name: 'Languages', category: 'Intellectual & Educational', description: 'Language learning and translation' },
  { name: 'History', category: 'Intellectual & Educational', description: 'History and historical research' },
  { name: 'Science', category: 'Intellectual & Educational', description: 'Science and scientific discovery' },
  { name: 'Philosophy', category: 'Intellectual & Educational', description: 'Philosophy and deep thinking' },
  { name: 'Politics', category: 'Intellectual & Educational', description: 'Politics and current events' },

  // Wellness & Spirituality
  { name: 'Meditation', category: 'Wellness & Spirituality', description: 'Meditation and mindfulness' },
  { name: 'Spirituality', category: 'Wellness & Spirituality', description: 'Spiritual practices and beliefs' },
  { name: 'Self-care', category: 'Wellness & Spirituality', description: 'Self-care and personal wellness' },
  { name: 'Therapy', category: 'Wellness & Spirituality', description: 'Mental health and therapy' },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing hobbies
  await prisma.hobby.deleteMany();
  console.log('🗑️  Cleared existing hobbies');

  // Insert default hobbies
  const hobbies = await Promise.all(
    defaultHobbies.map(async (hobby) => {
      return await prisma.hobby.create({
        data: hobby,
      });
    })
  );

  console.log(`✅ Created ${hobbies.length} hobbies`);
  console.log('🎉 Database seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });