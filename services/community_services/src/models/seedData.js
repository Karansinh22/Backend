require('dotenv').config();
const mongoose = require('mongoose');
const CommunitiesModel = require('./Communities');
const PulsesModel = require('./Pulses');
const MarketplaceListingsModel = require('./MarketplaceListings');
const EventsModel = require('./Events');
const UsersModel = require('./Users');

async function insertDummyData() {
    try {
        console.log('Starting dummy data insertion...');

        // Create a dummy manager user
        const manager = await UsersModel.findOne({ email: 'manager@community.com' }) || await UsersModel.create({
            name: 'Community Manager',
            email: 'manager@community.com',
            mobileNumber: '9876543210',
            password: 'Manager@123',
            role: 'Admin',
            status: 'Active',
            isEmailVerified: true
        });

        console.log('Manager user created:', manager._id);

        // Create dummy users
        const user1 = await UsersModel.findOne({ email: 'user1@community.com' }) || await UsersModel.create({
            name: 'John Doe',
            email: 'user1@community.com',
            mobileNumber: '9876543211',
            password: 'User@123',
            role: 'User',
            status: 'Active',
            isEmailVerified: true
        });

        const user2 = await UsersModel.findOne({ email: 'user2@community.com' }) || await UsersModel.create({
            name: 'Jane Smith',
            email: 'user2@community.com',
            mobileNumber: '9876543212',
            password: 'User@123',
            role: 'User',
            status: 'Active',
            isEmailVerified: true
        });

        console.log('Users created');

        // Create more diverse users
        const user3 = await UsersModel.findOne({ email: 'user3@community.com' }) || await UsersModel.create({
            name: 'Rajesh Kumar',
            email: 'user3@community.com',
            mobileNumber: '9876543213',
            password: 'User@123',
            role: 'User',
            status: 'Active',
            isEmailVerified: true
        });

        const user4 = await UsersModel.findOne({ email: 'user4@community.com' }) || await UsersModel.create({
            name: 'Priya Sharma',
            email: 'user4@community.com',
            mobileNumber: '9876543214',
            password: 'User@123',
            role: 'User',
            status: 'Active',
            isEmailVerified: true
        });

        const user5 = await UsersModel.findOne({ email: 'user5@community.com' }) || await UsersModel.create({
            name: 'Amit Patel',
            email: 'user5@community.com',
            mobileNumber: '9876543215',
            password: 'User@123',
            role: 'User',
            status: 'Pending',
            isEmailVerified: false
        });

        console.log('Additional users created');

        // Create comprehensive community data
        const communities = [
            {
                name: 'Sunrise Valley Residency',
                description: 'A peaceful residential community with modern amenities and green spaces. Located in the heart of Dehradun, Sunrise Valley offers a perfect blend of luxury and nature. Our gated community features 24/7 security, world-class amenities, and a vibrant community life.',
                shortDescription: 'Modern living with nature',
                image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
                bannerImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
                logo: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400',
                managerId: manager._id,
                members: [user1._id, user2._id, user3._id],
                pendingRequests: [user5._id],
                pulses: [],
                marketplaceListings: [],
                events: [],
                territory: 'North Zone - Sector A',
                location: {
                    address: '123 Valley Road, Rajpur Road',
                    city: 'Dehradun',
                    state: 'Uttarakhand',
                    zipCode: '248001',
                    country: 'India',
                    coordinates: {
                        lat: 30.3165,
                        lng: 78.0322
                    }
                },
                isFeatured: true,
                highlights: [
                    'Olympic Size Swimming Pool',
                    '24/7 CCTV Surveillance & Security',
                    'Modern Gymnasium with Trainers',
                    'Children Play Area & Park',
                    'Community Clubhouse',
                    'Power Backup',
                    'Rainwater Harvesting',
                    'Visitor Parking'
                ],
                amenityIds: [],
                totalUnits: 250,
                occupiedUnits: 198,
                establishedYear: 2018,
                contactInfo: {
                    email: 'info@sunrisevalley.com',
                    phone: '+91-9876543210',
                    website: 'https://sunrisevalley.com'
                },
                status: 'active',
                createdBy: manager._id
            },
            {
                name: 'Green Meadows Eco Park',
                description: 'Eco-friendly community with sustainable living practices. Green Meadows is India\'s first platinum-rated green community featuring solar panels, organic gardens, and zero-waste initiatives. Experience sustainable luxury at its finest.',
                shortDescription: 'Sustainable luxury living',
                image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
                bannerImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
                logo: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
                managerId: manager._id,
                members: [user1._id, user4._id],
                pendingRequests: [user2._id],
                pulses: [],
                marketplaceListings: [],
                events: [],
                territory: 'South Zone - Eco Corridor',
                location: {
                    address: '456 Green Lane, Mussoorie Road',
                    city: 'Dehradun',
                    state: 'Uttarakhand',
                    zipCode: '248002',
                    country: 'India',
                    coordinates: {
                        lat: 30.2849,
                        lng: 78.0422
                    }
                },
                isFeatured: true,
                highlights: [
                    'Solar Panel Installation on All Roofs',
                    'Rainwater Harvesting System',
                    'Organic Vegetable Garden',
                    'EV Charging Stations',
                    'Waste Segregation & Composting',
                    'Green Building Certification',
                    'Cycling & Walking Tracks',
                    'Butterfly Garden'
                ],
                amenityIds: [],
                totalUnits: 180,
                occupiedUnits: 165,
                establishedYear: 2020,
                contactInfo: {
                    email: 'contact@greenmeadows.com',
                    phone: '+91-9876543220',
                    website: 'https://greenmeadows.in'
                },
                status: 'active',
                createdBy: manager._id
            },
            {
                name: 'Palm Springs Luxury Villas',
                description: 'Luxury residential community with premium facilities and world-class amenities. Palm Springs offers an exclusive lifestyle with private villas, concierge services, and resort-style living in the lap of nature.',
                shortDescription: 'Premium luxury homes',
                image: 'https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?w=800',
                bannerImage: 'https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?w=1200',
                logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
                managerId: manager._id,
                members: [user2._id, user3._id],
                pendingRequests: [],
                pulses: [],
                marketplaceListings: [],
                events: [],
                territory: 'Central Zone - Premium Sector',
                location: {
                    address: '789 Palm Avenue, GMS Road',
                    city: 'Dehradun',
                    state: 'Uttarakhand',
                    zipCode: '248003',
                    country: 'India',
                    coordinates: {
                        lat: 30.3255,
                        lng: 78.0455
                    }
                },
                isFeatured: false,
                highlights: [
                    'Private Swimming Pools in Villas',
                    'World-Class Clubhouse',
                    'Tennis & Badminton Courts',
                    'Spa & Wellness Center',
                    'Concierge Service 24/7',
                    'Home Automation',
                    'Private Gardens',
                    'Valet Parking',
                    'Multi-Cuisine Restaurant',
                    'Mini Theatre'
                ],
                amenityIds: [],
                totalUnits: 120,
                occupiedUnits: 95,
                establishedYear: 2019,
                contactInfo: {
                    email: 'info@palmsprings.com',
                    phone: '+91-9876543230',
                    website: 'https://palmspringsvillas.com'
                },
                status: 'active',
                createdBy: manager._id
            },
            {
                name: 'Hill View Apartments',
                description: 'Affordable housing community with excellent connectivity and basic amenities. Hill View provides comfortable living spaces for families with easy access to schools, hospitals, and shopping centers.',
                shortDescription: 'Comfortable & affordable',
                image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
                bannerImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
                logo: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
                managerId: manager._id,
                members: [user4._id],
                pendingRequests: [user1._id],
                pulses: [],
                marketplaceListings: [],
                events: [],
                territory: 'East Zone - Budget Housing',
                location: {
                    address: '12 Hill View Road, Clement Town',
                    city: 'Dehradun',
                    state: 'Uttarakhand',
                    zipCode: '248004',
                    country: 'India',
                    coordinates: {
                        lat: 30.2645,
                        lng: 78.0145
                    }
                },
                isFeatured: false,
                highlights: [
                    'Covered Parking',
                    'Children Play Area',
                    'Security Guards',
                    'Power Backup for Common Areas',
                    'Lift Facility',
                    'Water Supply 24/7'
                ],
                amenityIds: [],
                totalUnits: 300,
                occupiedUnits: 285,
                establishedYear: 2015,
                contactInfo: {
                    email: 'info@hillviewapts.com',
                    phone: '+91-9876543240'
                },
                status: 'active',
                createdBy: manager._id
            },
            {
                name: 'River Valley Heights',
                description: 'Upcoming luxury project near riverside. River Valley Heights is under development and promises to be the most sought-after address in the city with river-facing apartments and premium amenities.',
                shortDescription: 'Riverside luxury - Coming Soon',
                image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
                bannerImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
                logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
                managerId: manager._id,
                members: [],
                pendingRequests: [user3._id, user4._id],
                pulses: [],
                marketplaceListings: [],
                events: [],
                territory: 'West Zone - Riverside',
                location: {
                    address: 'Riverside Road, ISBT Area',
                    city: 'Dehradun',
                    state: 'Uttarakhand',
                    zipCode: '248005',
                    country: 'India',
                    coordinates: {
                        lat: 30.3155,
                        lng: 78.0255
                    }
                },
                isFeatured: true,
                highlights: [
                    'River View Apartments',
                    'Infinity Pool',
                    'Rooftop Restaurant',
                    'Sky Garden',
                    'Smart Home Features',
                    'Helipad'
                ],
                amenityIds: [],
                totalUnits: 150,
                occupiedUnits: 0,
                establishedYear: 2025,
                contactInfo: {
                    email: 'sales@rivervalleyheights.com',
                    phone: '+91-9876543250',
                    website: 'https://rivervalleyheights.com'
                },
                status: 'pending',
                createdBy: manager._id
            },
            {
                name: 'Mountain View Estates',
                description: 'Currently inactive community undergoing renovation. Mountain View was established in 2012 and is temporarily closed for major infrastructure upgrades and modernization.',
                shortDescription: 'Under renovation',
                image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
                bannerImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200',
                logo: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
                managerId: manager._id,
                members: [user5._id],
                pendingRequests: [],
                pulses: [],
                marketplaceListings: [],
                events: [],
                territory: 'North Zone - Sector B',
                location: {
                    address: '88 Mountain Road, Sahastradhara Road',
                    city: 'Dehradun',
                    state: 'Uttarakhand',
                    zipCode: '248006',
                    country: 'India',
                    coordinates: {
                        lat: 30.3455,
                        lng: 78.0722
                    }
                },
                isFeatured: false,
                highlights: [
                    'Mountain Views',
                    'Large Green Spaces',
                    'Community Center'
                ],
                amenityIds: [],
                totalUnits: 200,
                occupiedUnits: 150,
                establishedYear: 2012,
                contactInfo: {
                    email: 'info@mountainview.com',
                    phone: '+91-9876543260'
                },
                status: 'inactive',
                createdBy: manager._id
            }
        ];

        // Insert communities
        const insertedCommunities = [];
        for (const communityData of communities) {
            const existingCommunity = await CommunitiesModel.findOne({ name: communityData.name });
            if (!existingCommunity) {
                const community = await CommunitiesModel.create(communityData);
                insertedCommunities.push(community);
                console.log(`Community created: ${community.name}`);
            } else {
                insertedCommunities.push(existingCommunity);
                console.log(`Community already exists: ${existingCommunity.name}`);
            }
        }

        // Create sample pulses, marketplace listings, and events
        if (insertedCommunities.length > 0) {
            console.log('\nCreating pulses, marketplace listings, and events...');

            // Pulses for Sunrise Valley Residency
            const pulse1 = await PulsesModel.create({
                title: 'Welcome to Sunrise Valley!',
                description: 'Excited to share our new community amenities! Check out the newly renovated clubhouse with state-of-the-art facilities. Join us this weekend for the grand opening!',
                territory: 'General Announcement',
                communityId: insertedCommunities[0]._id,
                userId: manager._id,
                attachment: 'https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=800',
                status: 'approved',
                likes: [user1._id, user2._id],
                comments: [
                    { userId: user1._id, text: 'Looking forward to it!', createdAt: new Date() }
                ]
            });

            const pulse2 = await PulsesModel.create({
                title: 'Maintenance Notice',
                description: 'Water supply will be interrupted on Sunday between 10 AM - 2 PM for pipeline maintenance. Please store water accordingly.',
                territory: 'Maintenance',
                communityId: insertedCommunities[0]._id,
                userId: manager._id,
                status: 'approved',
                likes: [user3._id],
                comments: []
            });

            const pulse3 = await PulsesModel.create({
                title: 'Lost and Found - Keys',
                description: 'Found a set of car keys near the swimming pool. Please contact the security office to claim.',
                territory: 'Lost & Found',
                communityId: insertedCommunities[0]._id,
                userId: user1._id,
                status: 'pending',
                likes: [],
                comments: []
            });

            // Pulse for Green Meadows
            const pulse4 = await PulsesModel.create({
                title: 'Organic Garden Harvest',
                description: 'Our community organic garden has produced fresh vegetables! All members can collect their share from the community center tomorrow.',
                territory: 'Community Events',
                communityId: insertedCommunities[1]._id,
                userId: manager._id,
                attachment: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800',
                status: 'approved',
                likes: [user1._id, user4._id],
                comments: []
            });

            // Add pulses to communities
            await CommunitiesModel.findByIdAndUpdate(
                insertedCommunities[0]._id,
                { $push: { pulses: { $each: [pulse1._id, pulse2._id, pulse3._id] } } }
            );

            await CommunitiesModel.findByIdAndUpdate(
                insertedCommunities[1]._id,
                { $push: { pulses: pulse4._id } }
            );

            console.log('✓ Created 4 pulses');

            // Marketplace Listings
            const listing1 = await MarketplaceListingsModel.create({
                type: 'offer',
                title: 'Furniture for Sale - Complete Living Room Set',
                description: 'Moving out sale - Premium 3-seater sofa set, center table, dining table with 6 chairs in excellent condition. Barely used for 1 year. Original price ₹80,000.',
                price: 25000,
                attachment: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
                communityId: insertedCommunities[0]._id,
                userId: user1._id,
                status: 'approved'
            });

            const listing2 = await MarketplaceListingsModel.create({
                type: 'want',
                title: 'Looking for Carpool to IT Park',
                description: 'Need carpool partner from Sunrise Valley to IT Park Sahastradhara. Office timings 9 AM to 6 PM. Can share fuel costs.',
                price: 0,
                communityId: insertedCommunities[0]._id,
                userId: user2._id,
                status: 'approved'
            });

            const listing3 = await MarketplaceListingsModel.create({
                type: 'offer',
                title: 'Kids Bicycle for Sale',
                description: 'Selling kids bicycle (age 5-8 years) in good condition. Hero brand with training wheels included.',
                price: 3500,
                attachment: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800',
                communityId: insertedCommunities[0]._id,
                userId: user3._id,
                status: 'pending'
            });

            const listing4 = await MarketplaceListingsModel.create({
                type: 'want',
                title: 'Looking for Tutor for Class 10 Math',
                description: 'Need experienced tutor for CBSE Class 10 Mathematics. Prefer female tutor. Budget ₹500 per hour.',
                price: 500,
                communityId: insertedCommunities[1]._id,
                userId: user4._id,
                status: 'approved'
            });

            const listing5 = await MarketplaceListingsModel.create({
                type: 'offer',
                title: 'Washing Machine - Samsung 6.5kg',
                description: 'Samsung fully automatic washing machine. 3 years old, working perfectly. Selling due to upgrade.',
                price: 8000,
                attachment: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800',
                communityId: insertedCommunities[2]._id,
                userId: user2._id,
                status: 'approved'
            });

            // Add listings to communities
            await CommunitiesModel.findByIdAndUpdate(
                insertedCommunities[0]._id,
                { $push: { marketplaceListings: { $each: [listing1._id, listing2._id, listing3._id] } } }
            );

            await CommunitiesModel.findByIdAndUpdate(
                insertedCommunities[1]._id,
                { $push: { marketplaceListings: listing4._id } }
            );

            await CommunitiesModel.findByIdAndUpdate(
                insertedCommunities[2]._id,
                { $push: { marketplaceListings: listing5._id } }
            );

            console.log('✓ Created 5 marketplace listings');

            // Events
            const event1 = await EventsModel.create({
                title: 'Community Holi Celebration 2025',
                description: 'Join us for a grand Holi celebration with music, dance, and traditional food. DJ night, rain dance, and special performances by kids. Organic colors will be provided.',
                communityId: insertedCommunities[0]._id,
                eventDate: new Date('2025-03-15'),
                startTime: '10:00 AM',
                endTime: '2:00 PM',
                location: 'Community Clubhouse & Main Lawn',
                images: ['https://images.unsplash.com/photo-1583241800698-5b0e9b1fe0f5?w=800'],
                maxParticipants: 150,
                participants: [
                    { userId: user1._id, status: 'confirmed', registeredAt: new Date() },
                    { userId: user2._id, status: 'pending', registeredAt: new Date() },
                    { userId: user3._id, status: 'confirmed', registeredAt: new Date() }
                ],
                attendance: [],
                eventType: 'Festival',
                status: 'Upcoming',
                createdBy: manager._id
            });

            const event2 = await EventsModel.create({
                title: 'Yoga & Meditation Workshop',
                description: 'Free yoga and meditation workshop by certified instructor. Open to all age groups. Bring your yoga mats.',
                communityId: insertedCommunities[0]._id,
                eventDate: new Date('2025-02-20'),
                startTime: '6:00 AM',
                endTime: '7:30 AM',
                location: 'Rooftop Garden',
                maxParticipants: 30,
                participants: [
                    { userId: user1._id, status: 'confirmed', registeredAt: new Date() },
                    { userId: user4._id, status: 'confirmed', registeredAt: new Date() }
                ],
                attendance: [],
                eventType: 'Social',
                status: 'Upcoming',
                createdBy: manager._id
            });

            const event3 = await EventsModel.create({
                title: 'Monthly Maintenance Meeting',
                description: 'Discuss upcoming maintenance work, budget allocation, and address resident concerns.',
                communityId: insertedCommunities[0]._id,
                eventDate: new Date('2025-02-10'),
                startTime: '6:00 PM',
                endTime: '8:00 PM',
                location: 'Conference Hall, Clubhouse',
                maxParticipants: null,
                participants: [
                    { userId: user1._id, status: 'confirmed', registeredAt: new Date() },
                    { userId: user2._id, status: 'confirmed', registeredAt: new Date() },
                    { userId: user3._id, status: 'rejected', registeredAt: new Date() }
                ],
                attendance: [],
                eventType: 'Meeting',
                status: 'Upcoming',
                createdBy: manager._id
            });

            const event4 = await EventsModel.create({
                title: 'Eco Awareness Seminar',
                description: 'Learn about sustainable living practices, waste management, and energy conservation. Expert speakers and interactive sessions.',
                communityId: insertedCommunities[1]._id,
                eventDate: new Date('2025-02-25'),
                startTime: '4:00 PM',
                endTime: '6:00 PM',
                location: 'Community Center',
                images: ['https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800'],
                maxParticipants: 50,
                participants: [
                    { userId: user1._id, status: 'confirmed', registeredAt: new Date() },
                    { userId: user4._id, status: 'pending', registeredAt: new Date() }
                ],
                attendance: [],
                eventType: 'Educational',
                status: 'Upcoming',
                createdBy: manager._id
            });

            const event5 = await EventsModel.create({
                title: 'Annual Sports Day',
                description: 'Annual sports tournament including cricket, badminton, table tennis, and swimming competitions. Prizes for winners!',
                communityId: insertedCommunities[2]._id,
                eventDate: new Date('2025-03-30'),
                startTime: '8:00 AM',
                endTime: '5:00 PM',
                location: 'Sports Complex',
                images: [
                    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
                    'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800'
                ],
                maxParticipants: 200,
                participants: [
                    { userId: user2._id, status: 'confirmed', registeredAt: new Date() },
                    { userId: user3._id, status: 'confirmed', registeredAt: new Date() }
                ],
                attendance: [],
                eventType: 'Sports',
                status: 'Upcoming',
                createdBy: manager._id
            });

            const event6 = await EventsModel.create({
                title: 'Diwali Celebration 2024',
                description: 'Last year\'s Diwali celebration with fireworks, rangoli competition, and festive dinner.',
                communityId: insertedCommunities[0]._id,
                eventDate: new Date('2024-11-12'),
                startTime: '6:00 PM',
                endTime: '10:00 PM',
                location: 'Main Lawn',
                maxParticipants: 200,
                participants: [
                    { userId: user1._id, status: 'confirmed', registeredAt: new Date('2024-11-10') },
                    { userId: user2._id, status: 'confirmed', registeredAt: new Date('2024-11-09') },
                    { userId: user3._id, status: 'confirmed', registeredAt: new Date('2024-11-08') }
                ],
                attendance: [
                    { userId: user1._id, markedAt: new Date('2024-11-12T18:30:00'), verified: true },
                    { userId: user2._id, markedAt: new Date('2024-11-12T18:45:00'), verified: true },
                    { userId: user3._id, markedAt: new Date('2024-11-12T19:00:00'), verified: true }
                ],
                eventType: 'Festival',
                status: 'Completed',
                createdBy: manager._id
            });

            // Add events to communities
            await CommunitiesModel.findByIdAndUpdate(
                insertedCommunities[0]._id,
                { $push: { events: { $each: [event1._id, event2._id, event3._id, event6._id] } } }
            );

            await CommunitiesModel.findByIdAndUpdate(
                insertedCommunities[1]._id,
                { $push: { events: event4._id } }
            );

            await CommunitiesModel.findByIdAndUpdate(
                insertedCommunities[2]._id,
                { $push: { events: event5._id } }
            );

            console.log('✓ Created 6 events');
        }

        console.log('\n✅ Dummy data insertion completed successfully!');
        console.log(`Total communities created: ${insertedCommunities.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error inserting dummy data:', error);
        process.exit(1);
    }
}

// Run the script
insertDummyData();
