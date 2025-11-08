require('dotenv').config();
const mongoose = require('mongoose');
const CommunitiesModel = require('../models/Communities');
const AmenitiesModel = require('../models/Amenities');
const EventsModel = require('../models/Events');
const AnnouncementsModel = require('../models/Announcements');
const UsersModel = require('../models/Users');

// Sample amenities data
const amenitiesData = [
    { name: 'Swimming Pool', category: 'Recreation', icon: '🏊', description: 'Olympic-sized swimming pool' },
    { name: 'Gym', category: 'Health', icon: '💪', description: 'Fully equipped fitness center' },
    { name: 'Playground', category: 'Recreation', icon: '🎮', description: 'Children\'s play area' },
    { name: 'Club House', category: 'Social', icon: '🏛️', description: 'Community gathering space' },
    { name: 'Security', category: 'Safety', icon: '🛡️', description: '24/7 security services' },
    { name: 'Parking', category: 'Convenience', icon: '🅿️', description: 'Covered parking facility' },
    { name: 'Garden', category: 'Recreation', icon: '🌳', description: 'Landscaped gardens' },
    { name: 'Jogging Track', category: 'Health', icon: '🏃', description: 'Outdoor jogging track' },
    { name: 'Tennis Court', category: 'Sports', icon: '🎾', description: 'Professional tennis court' },
    { name: 'Basketball Court', category: 'Sports', icon: '🏀', description: 'Outdoor basketball court' },
    { name: 'Yoga Center', category: 'Health', icon: '🧘', description: 'Dedicated yoga and meditation space' },
    { name: 'Library', category: 'Social', icon: '📚', description: 'Community library' }
];

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');

        // Connect to database
        const dbUrl = process.env.ENTRYTRACKING_DB_URL;
        await mongoose.connect(dbUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to database');

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await CommunitiesModel.deleteMany({});
        await AmenitiesModel.deleteMany({});
        await EventsModel.deleteMany({});
        await AnnouncementsModel.deleteMany({});
        console.log('✅ Cleared existing data');

        // Insert amenities
        console.log('📝 Inserting amenities...');
        const amenities = await AmenitiesModel.insertMany(amenitiesData);
        console.log(`✅ Inserted ${amenities.length} amenities`);

        // Get a sample user (or create one if needed)
        let user = await UsersModel.findOne({ role: 'SuperAdmin' });
        if (!user) {
            user = await UsersModel.findOne({ status: 'Active' });
        }
        
        if (!user) {
            console.log('⚠️  No active user found. Please create a user first.');
            process.exit(1);
        }

        // Sample communities
        const communitiesData = [
            {
                name: 'Green Valley Residency',
                description: 'Experience luxury living in the heart of the city with modern amenities and eco-friendly infrastructure.',
                shortDescription: 'Modern luxury living with eco-friendly infrastructure',
                location: {
                    address: '123 Green Valley Road',
                    city: 'Ahmedabad',
                    state: 'Gujarat',
                    zipCode: '380015',
                    coordinates: { lat: 23.0225, lng: 72.5714 }
                },
                isFeatured: true,
                highlights: ['Gated Community', 'Smart Homes', 'Green Building Certified', '24/7 Power Backup'],
                amenityIds: amenities.slice(0, 8).map(a => a._id),
                totalUnits: 200,
                occupiedUnits: 150,
                establishedYear: 2020,
                status: 'Active',
                createdBy: user._id
            },
            {
                name: 'Sunshine Apartments',
                description: 'Affordable housing with premium amenities located in a well-connected neighborhood.',
                shortDescription: 'Affordable premium living in prime location',
                location: {
                    address: '456 Sunshine Street',
                    city: 'Gandhinagar',
                    state: 'Gujarat',
                    zipCode: '382010',
                    coordinates: { lat: 23.2156, lng: 72.6369 }
                },
                isFeatured: true,
                highlights: ['Prime Location', 'Near Metro', 'Spacious Units', 'Community Events'],
                amenityIds: amenities.slice(0, 6).map(a => a._id),
                totalUnits: 150,
                occupiedUnits: 120,
                establishedYear: 2018,
                status: 'Active',
                createdBy: user._id
            },
            {
                name: 'Royal Gardens',
                description: 'Premium gated community offering world-class amenities and serene living environment.',
                shortDescription: 'Premium gated community with world-class amenities',
                location: {
                    address: '789 Royal Road',
                    city: 'Surat',
                    state: 'Gujarat',
                    zipCode: '395007',
                    coordinates: { lat: 21.1702, lng: 72.8311 }
                },
                isFeatured: true,
                highlights: ['Luxury Villas', 'Private Gardens', 'Concierge Service', 'Pet Friendly'],
                amenityIds: amenities.map(a => a._id),
                totalUnits: 100,
                occupiedUnits: 85,
                establishedYear: 2019,
                status: 'Active',
                createdBy: user._id
            }
        ];

        console.log('📝 Inserting communities...');
        const communities = await CommunitiesModel.insertMany(communitiesData);
        console.log(`✅ Inserted ${communities.length} communities`);

        // Sample events
        const eventsData = [
            {
                title: 'Annual Sports Day',
                description: 'Join us for a day filled with sports activities, competitions, and fun for all ages!',
                communityId: communities[0]._id,
                eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                startTime: '09:00 AM',
                endTime: '05:00 PM',
                location: 'Community Sports Complex',
                eventType: 'Sports',
                maxParticipants: 100,
                status: 'Upcoming',
                createdBy: user._id
            },
            {
                title: 'Diwali Celebration',
                description: 'Celebrate the festival of lights with your community. Cultural programs, food, and fireworks!',
                communityId: communities[1]._id,
                eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
                startTime: '06:00 PM',
                endTime: '10:00 PM',
                location: 'Club House',
                eventType: 'Festival',
                maxParticipants: 200,
                status: 'Upcoming',
                createdBy: user._id
            },
            {
                title: 'Health & Wellness Workshop',
                description: 'Learn about healthy living, yoga, and meditation from expert instructors.',
                communityId: communities[2]._id,
                eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
                startTime: '07:00 AM',
                endTime: '09:00 AM',
                location: 'Yoga Center',
                eventType: 'Educational',
                maxParticipants: 50,
                status: 'Upcoming',
                createdBy: user._id
            }
        ];

        console.log('📝 Inserting events...');
        const events = await EventsModel.insertMany(eventsData);
        console.log(`✅ Inserted ${events.length} events`);

        // Sample announcements
        const announcementsData = [
            {
                title: 'Water Supply Maintenance',
                content: 'Water supply will be temporarily suspended on Sunday from 10 AM to 2 PM for maintenance work. Please store water accordingly.',
                communityId: communities[0]._id,
                priority: 'High',
                category: 'Maintenance',
                isPinned: true,
                status: 'Published',
                createdBy: user._id
            },
            {
                title: 'New Gym Equipment Installed',
                content: 'We are excited to announce that new state-of-the-art gym equipment has been installed in the fitness center. Come check it out!',
                communityId: communities[1]._id,
                priority: 'Medium',
                category: 'General',
                status: 'Published',
                createdBy: user._id
            },
            {
                title: 'Enhanced Security Measures',
                content: 'For the safety of all residents, we have implemented facial recognition at all entry points. Please register at the security office.',
                communityId: communities[2]._id,
                priority: 'Urgent',
                category: 'Security',
                isPinned: true,
                status: 'Published',
                createdBy: user._id
            }
        ];

        console.log('📝 Inserting announcements...');
        const announcements = await AnnouncementsModel.insertMany(announcementsData);
        console.log(`✅ Inserted ${announcements.length} announcements`);

        console.log('\n✅ Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Amenities: ${amenities.length}`);
        console.log(`   - Communities: ${communities.length}`);
        console.log(`   - Events: ${events.length}`);
        console.log(`   - Announcements: ${announcements.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

// Run the seeding function
seedDatabase();
