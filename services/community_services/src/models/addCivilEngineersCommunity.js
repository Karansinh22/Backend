require('dotenv').config({ path: require('path').resolve(__dirname, '../../../../.env') });
const mongoose = require('mongoose');
const CommunitiesModel = require('./Communities');
const PulsesModel = require('./Pulses');
const MarketplaceListingsModel = require('./MarketplaceListings');
const EventsModel = require('./Events');
const DirectoryEntriesModel = require('./DirectoryEntries');
const UsersModel = require('./Users');
const { DBConnect } = require('./index.js');

async function addCivilEngineersCommunity() {
    try {
        console.log('Connecting to database...');
        // Wait for connection
        await new Promise((resolve) => {
            if (DBConnect.readyState === 1) {
                resolve();
            } else {
                DBConnect.once('connected', resolve);
            }
        });

        console.log('Database connected. Creating Civil Engineers Group Ahmedabad...');

        // Find or create manager
        let manager = await UsersModel.findOne({ email: 'manager@community.com' });
        if (!manager) {
            const bcrypt = require('bcryptjs');
            manager = await UsersModel.create({
                name: 'Community Manager',
                email: 'manager@community.com',
                mobileNumber: '9876543210',
                password: await bcrypt.hash('Manager@123', 10),
                role: 'Admin',
                status: 'Active',
                isEmailVerified: true
            });
        }

        // Find or create test users
        const bcrypt = require('bcryptjs');
        let user1 = await UsersModel.findOne({ email: 'user1@community.com' });
        if (!user1) {
            user1 = await UsersModel.create({
                name: 'John Doe',
                email: 'user1@community.com',
                mobileNumber: '9876543211',
                password: await bcrypt.hash('User@123', 10),
                role: 'User',
                status: 'Active',
                isEmailVerified: true
            });
        }

        let user2 = await UsersModel.findOne({ email: 'user2@community.com' });
        if (!user2) {
            user2 = await UsersModel.create({
                name: 'Jane Smith',
                email: 'user2@community.com',
                mobileNumber: '9876543212',
                password: await bcrypt.hash('User@123', 10),
                role: 'User',
                status: 'Active',
                isEmailVerified: true
            });
        }

        let user3 = await UsersModel.findOne({ email: 'user3@community.com' });
        if (!user3) {
            user3 = await UsersModel.create({
                name: 'Rajesh Kumar',
                email: 'user3@community.com',
                mobileNumber: '9876543213',
                password: await bcrypt.hash('User@123', 10),
                role: 'User',
                status: 'Active',
                isEmailVerified: true
            });
        }

        // Check if community already exists
        let community = await CommunitiesModel.findOne({ name: 'Civil Engineers Group Ahmedabad' });
        
        if (!community) {
            // Create community
            community = await CommunitiesModel.create({
                name: 'Civil Engineers Group Ahmedabad',
                description: 'A professional community for civil engineers in Ahmedabad. Connect with fellow engineers, share knowledge, discuss projects, and grow your professional network. This community brings together experienced professionals, fresh graduates, and students in the field of civil engineering.',
                shortDescription: 'Professional network for civil engineers',
                image: 'https://images.unsplash.com/photo-1581092160562-40aa28e2ea6e?w=800',
                bannerImage: 'https://images.unsplash.com/photo-1581092160562-40aa28e2ea6e?w=1200',
                logo: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
                managerId: manager._id,
                members: [user1._id, user2._id, user3._id],
                pendingRequests: [],
                pulses: [],
                marketplaceListings: [],
                events: [],
                territory: 'Ahmedabad - Professional Network',
                location: {
                    address: 'Engineering Hub, Science City Road',
                    city: 'Ahmedabad',
                    state: 'Gujarat',
                    zipCode: '380060',
                    country: 'India',
                    coordinates: {
                        lat: 23.0225,
                        lng: 72.5714
                    }
                },
                isFeatured: true,
                highlights: [
                    'Professional Networking Events',
                    'Technical Workshops & Seminars',
                    'Project Collaboration Platform',
                    'Job Opportunities & Career Growth',
                    'Knowledge Sharing Sessions',
                    'Industry Expert Talks',
                    'Study Groups & Mentorship',
                    'Latest Industry Updates'
                ],
                amenityIds: [],
                totalUnits: 500,
                occupiedUnits: 0,
                establishedYear: 2024,
                contactInfo: {
                    email: 'info@civilengineersahmedabad.com',
                    phone: '+91-9876543250',
                    website: 'https://civilengineersahmedabad.com'
                },
                status: 'active',
                createdBy: manager._id
            });
            console.log('✓ Community created:', community._id);
        } else {
            console.log('✓ Community already exists:', community._id);
        }

        // Create pulses
        const pulse1 = await PulsesModel.create({
            title: 'Welcome to Civil Engineers Group Ahmedabad!',
            description: 'Welcome to our professional community! This is a space for civil engineers to connect, share knowledge, and collaborate on projects. Feel free to post about job opportunities, technical discussions, or upcoming events.',
            territory: 'General',
            communityId: community._id,
            userId: manager._id,
            attachment: 'https://images.unsplash.com/photo-1581092160562-40aa28e2ea6e?w=800',
            status: 'approved',
            likes: [user1._id, user2._id, user3._id],
            comments: [
                { userId: user1._id, text: 'Excited to be part of this community!', createdAt: new Date() },
                { userId: user2._id, text: 'Looking forward to networking with fellow engineers.', createdAt: new Date() }
            ]
        });

        const pulse2 = await PulsesModel.create({
            title: 'Upcoming Technical Workshop: Modern Construction Techniques',
            description: 'Join us for a technical workshop on modern construction techniques and sustainable building practices. Date: Next Saturday, 10 AM at Engineering Hub. Free for all members!',
            territory: 'Events',
            communityId: community._id,
            userId: manager._id,
            status: 'approved',
            likes: [user1._id, user3._id],
            comments: []
        });

        await CommunitiesModel.findByIdAndUpdate(community._id, {
            $push: { pulses: { $each: [pulse1._id, pulse2._id] } }
        });
        console.log('✓ Created 2 pulses');

        // Create marketplace listings
        const listing1 = await MarketplaceListingsModel.create({
            type: 'sell',
            title: 'Engineering Books Collection for Sale',
            description: 'Selling my complete collection of civil engineering books including RCC Design, Structural Analysis, Surveying, and more. All books in excellent condition. Perfect for students and professionals.',
            price: 5000,
            attachment: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
            communityId: community._id,
            userId: user1._id,
            status: 'approved'
        });

        const listing2 = await MarketplaceListingsModel.create({
            type: 'buy',
            title: 'Looking for AutoCAD Drafter for Project',
            description: 'Need an experienced AutoCAD drafter for a residential building project. Part-time work, flexible hours. Good pay. Contact for details.',
            price: 15000,
            communityId: community._id,
            userId: user2._id,
            status: 'approved'
        });

        await CommunitiesModel.findByIdAndUpdate(community._id, {
            $push: { marketplaceListings: { $each: [listing1._id, listing2._id] } }
        });
        console.log('✓ Created 2 marketplace listings');

        // Create events
        const event1 = await EventsModel.create({
            title: 'Technical Workshop: Modern Construction Techniques',
            description: 'Join us for an interactive workshop on modern construction techniques, sustainable building practices, and latest industry trends. Expert speakers and networking opportunities.',
            communityId: community._id,
            eventDate: new Date('2025-02-15'),
            startTime: '10:00 AM',
            endTime: '4:00 PM',
            location: 'Engineering Hub, Science City Road, Ahmedabad',
            images: ['https://images.unsplash.com/photo-1581092160562-40aa28e2ea6e?w=800'],
            maxParticipants: 100,
            participants: [
                { userId: user1._id, status: 'confirmed', registeredAt: new Date() },
                { userId: user2._id, status: 'confirmed', registeredAt: new Date() }
            ],
            attendance: [],
            eventType: 'Educational',
            status: 'Upcoming',
            createdBy: manager._id
        });

        const event2 = await EventsModel.create({
            title: 'Networking Meetup: Industry Professionals',
            description: 'Monthly networking meetup for civil engineers. Share experiences, discuss projects, and build professional connections. Refreshments provided.',
            communityId: community._id,
            eventDate: new Date('2025-01-25'),
            startTime: '6:00 PM',
            endTime: '8:00 PM',
            location: 'Community Center, Ahmedabad',
            maxParticipants: 50,
            participants: [
                { userId: user3._id, status: 'confirmed', registeredAt: new Date() }
            ],
            attendance: [],
            eventType: 'Social',
            status: 'Upcoming',
            createdBy: manager._id
        });

        await CommunitiesModel.findByIdAndUpdate(community._id, {
            $push: { events: { $each: [event1._id, event2._id] } }
        });
        console.log('✓ Created 2 events');

        // Create directory entries
        const directory1 = await DirectoryEntriesModel.create({
            name: 'Rajesh Construction Services',
            serviceType: 'Construction',
            contactNumber: '+91-9876543210',
            email: 'rajesh@construction.com',
            address: '123 Construction Lane, Ahmedabad',
            availabilityHours: 'Mon-Sat: 9 AM - 6 PM',
            verified: true,
            communityId: community._id,
            userId: manager._id
        });

        const directory2 = await DirectoryEntriesModel.create({
            name: 'Ahmedabad Structural Consultants',
            serviceType: 'Consulting',
            contactNumber: '+91-9876543211',
            email: 'info@structuralconsultants.com',
            address: '456 Engineering Plaza, Ahmedabad',
            availabilityHours: 'Mon-Fri: 10 AM - 7 PM',
            verified: true,
            communityId: community._id,
            userId: manager._id
        });

        const directory3 = await DirectoryEntriesModel.create({
            name: 'Gujarat Material Suppliers',
            serviceType: 'Supplies',
            contactNumber: '+91-9876543212',
            email: 'sales@materialsuppliers.com',
            address: '789 Supply Street, Ahmedabad',
            availabilityHours: 'Mon-Sat: 8 AM - 8 PM',
            verified: true,
            communityId: community._id,
            userId: manager._id
        });

        console.log('✓ Created 3 directory entries');

        console.log('\n✅ Civil Engineers Group Ahmedabad community created successfully!');
        console.log(`Community ID: ${community._id}`);
        console.log(`\nYou can now access it at: /community/${community._id}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating community:', error);
        process.exit(1);
    }
}

// Run the script
addCivilEngineersCommunity();

