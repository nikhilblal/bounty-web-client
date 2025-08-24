// Demo bounties creation script
// Run with: node scripts/createDemoBounties.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyA6DUo0zuGhJ_okPctOppXsPRW_v3j-F_g",
  authDomain: "bounty-c6d39.firebaseapp.com",
  projectId: "bounty-c6d39",
  storageBucket: "bounty-c6d39.firebasestorage.app",
  messagingSenderId: "626150282077",
  appId: "1:626150282077:web:944861a7716a07af400eb4",
  measurementId: "G-4JNXCXPVCH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const demoBounties = [
  {
    title: "Clean Up Community Garden",
    description: "Our neighborhood garden needs some TLC! Help remove weeds, dead plants, and litter. Bring gardening gloves and basic tools. Perfect for those who want to make our community space beautiful again.",
    bounty: 25,
    originalBounty: 15,
    bountyContributors: [
      {
        userId: "neighbor-1",
        userName: "Maria Santos",
        userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
        amount: 10,
        timestamp: new Date('2024-01-15T10:00:00Z')
      }
    ],
    category: "physical",
    location: "Elm Street Community Garden, Oakland",
    posterId: "demo-user-1",
    posterName: "Sarah Chen",
    posterAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b515?w=100&h=100&fit=crop&crop=face",
    status: "open",
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop"
  },
  {
    title: "Deliver Groceries to Elderly Neighbor",
    description: "Mrs. Johnson (82) can't drive to the store anymore. Help her by picking up groceries from her list at Safeway and delivering them to her apartment. She's so grateful for community support!",
    bounty: 40,
    originalBounty: 20,
    bountyContributors: [
      {
        userId: "neighbor-2",
        userName: "Tom Wilson",
        userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        amount: 10,
        timestamp: new Date('2024-01-16T14:30:00Z')
      },
      {
        userId: "neighbor-3",
        userName: "Linda Davis",
        userAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
        amount: 10,
        timestamp: new Date('2024-01-16T15:45:00Z')
      }
    ],
    category: "physical",
    location: "Sunset Apartments, Berkeley",
    posterId: "demo-user-2",
    posterName: "Marcus Rodriguez",
    posterAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    status: "claimed",
    doerId: "demo-user-4",
    doerName: "James Kim",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=600&fit=crop"
  },
  {
    title: "Paint Over Graffiti on School Wall",
    description: "Local elementary school has fresh graffiti that's inappropriate for kids to see. Help paint over it with primer and matching paint. School will provide all supplies. Make our kids' space welcoming again!",
    bounty: 50,
    category: "physical",
    location: "Roosevelt Elementary, San Francisco",
    posterId: "demo-user-3",
    posterName: "Emily Watson",
    posterAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    status: "completed",
    doerId: "demo-user-5",
    doerName: "Lisa Park",
    proofImages: [
      "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&h=300&fit=crop"
    ],
    imageUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=600&fit=crop"
  },
  {
    title: "Walk Dogs at Animal Shelter",
    description: "Paws & Hearts shelter needs volunteers to walk 6 dogs this Saturday morning. Dogs need exercise and socialization. Perfect for dog lovers! Shelter provides leashes and poop bags.",
    bounty: 35,
    originalBounty: 25,
    bountyContributors: [
      {
        userId: "dog-lover-1",
        userName: "Alex Kim",
        userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        amount: 10,
        timestamp: new Date('2024-01-17T09:15:00Z')
      }
    ],
    category: "physical",
    location: "Paws & Hearts Shelter, Richmond",
    posterId: "demo-user-6",
    posterName: "Alex Thompson",
    posterAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    status: "open",
    imageUrl: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=600&fit=crop"
  },
  {
    title: "Help Set Up Community Food Drive",
    description: "Annual food drive needs volunteers to set up tables, sort donations, and organize canned goods. Help feed families in need in our community. Event is at the community center this Sunday.",
    bounty: 30,
    category: "physical",
    location: "Civic Center, San Mateo",
    posterId: "demo-user-7",
    posterName: "Rachel Green",
    posterAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
    status: "open",
    imageUrl: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=600&fit=crop"
  },
  {
    title: "Shovel Snow for Disabled Veteran",
    description: "Mr. Rodriguez, a disabled veteran, needs help clearing his driveway and walkway after the snowstorm. He has mobility issues and can't do it himself. Bring a shovel and warm clothes!",
    bounty: 45,
    category: "physical",
    location: "Pine Street, Tahoe",
    posterId: "demo-user-8",
    posterName: "David Lee",
    posterAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    status: "validated",
    doerId: "demo-user-9",
    doerName: "Maya Singh",
    validatorId: "demo-user-8",
    proofImages: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
    ],
    imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop"
  },
  {
    title: "Read to Kids at Library Story Time",
    description: "Public library needs someone to fill in for story time this Thursday. Read 3 picture books to kids ages 3-7. Books provided, just bring enthusiasm and a love for kids! Help spark joy in reading.",
    bounty: 25,
    category: "other",
    location: "Main Branch Library, Fremont",
    posterId: "demo-user-10",
    posterName: "Sophie Chen",
    posterAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    status: "open",
    imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop"
  },
  {
    title: "Fix Broken Bench in Neighborhood Park",
    description: "The bench by the playground has a loose board that's unsafe for families. Need someone handy with basic tools to tighten screws and replace one board. Hardware store nearby has materials.",
    bounty: 60,
    originalBounty: 30,
    bountyContributors: [
      {
        userId: "parent-1",
        userName: "Jennifer Walsh",
        userAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
        amount: 15,
        timestamp: new Date('2024-01-18T12:00:00Z')
      },
      {
        userId: "parent-2",
        userName: "Mike Torres",
        userAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face",
        amount: 15,
        timestamp: new Date('2024-01-18T13:30:00Z')
      }
    ],
    category: "physical",
    location: "Sunset Park, Alameda",
    posterId: "demo-user-11",
    posterName: "Jennifer Walsh",
    posterAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    status: "open",
    imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop"
  },
  {
    title: "Teach Senior Citizens Basic Phone Skills",
    description: "Community center seniors need help learning smartphone basics - texting, calling family, using apps. Spend 2 hours helping 4-5 seniors connect better with their families. Patience required!",
    bounty: 40,
    category: "other",
    location: "Golden Years Center, Palo Alto",
    posterId: "demo-user-12",
    posterName: "Chris Johnson",
    posterAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face",
    status: "open",
    imageUrl: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=600&fit=crop"
  },
  {
    title: "Plant Flowers in Front of Senior Center",
    description: "Brighten up the entrance to our senior center! Plant colorful flowers in the front garden beds. Flowers and soil provided - just need someone with a green thumb to make it beautiful for our elders.",
    bounty: 35,
    category: "physical",
    location: "Sunshine Senior Center, Hayward",
    posterId: "demo-user-13",
    posterName: "Rosa Martinez",
    posterAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b515?w=100&h=100&fit=crop&crop=face",
    status: "open",
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop"
  }
];

async function createDemoBounties() {
  console.log('Creating demo bounties...');
  
  try {
    for (let i = 0; i < demoBounties.length; i++) {
      const bounty = demoBounties[i];
      await addDoc(collection(db, 'tasks'), {
        ...bounty,
        createdAt: serverTimestamp()
      });
      console.log(`Created bounty ${i + 1}: ${bounty.title}`);
    }
    
    console.log(`\n✅ Successfully created ${demoBounties.length} demo bounties!`);
    console.log('You can now view them in your app at http://localhost:3000');
  } catch (error) {
    console.error('Error creating demo bounties:', error);
  }
}

createDemoBounties();