require('dotenv').config();
const CommunitiesModel = require('./Communities');
const PulsesModel = require('./Pulses');
const MarketplaceListingsModel = require('./MarketplaceListings');
const EventsModel = require('./Events');
const UsersModel = require('./Users');

async function verifyData() {
    try {
        console.log('\n🔍 Verifying Community Data in Database...\n');

        // Fetch all users
        const users = await UsersModel.find({ isDeleted: false }).select('name email role status');
        console.log(`📊 Total Users: ${users.length}`);
        users.forEach(user => {
            console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}, Status: ${user.status}`);
        });

        // Fetch all communities with populated fields
        const communities = await CommunitiesModel.find({ isDeleted: false })
            .populate('managerId', 'name email')
            .populate('members', 'name email')
            .populate('pendingRequests', 'name email')
            .populate('pulses')
            .populate('marketplaceListings')
            .populate('events');

        console.log(`\n📊 Total Communities: ${communities.length}\n`);

        communities.forEach((community, index) => {
            console.log(`\n${index + 1}. Community: ${community.name}`);
            console.log(`   Description: ${community.description}`);
            console.log(`   Territory: ${community.territory || 'N/A'}`);
            console.log(`   Status: ${community.status}`);
            console.log(`   Location: ${community.location?.city}, ${community.location?.state}`);
            console.log(`   Manager: ${community.managerId?.name || 'N/A'} (${community.managerId?.email || 'N/A'})`);
            console.log(`   Total Units: ${community.totalUnits}, Occupied: ${community.occupiedUnits}`);
            console.log(`   Featured: ${community.isFeatured ? 'Yes' : 'No'}`);
            
            console.log(`\n   👥 Members (${community.members.length}):`);
            community.members.forEach(member => {
                console.log(`      - ${member.name} (${member.email})`);
            });

            console.log(`\n   ⏳ Pending Requests (${community.pendingRequests.length}):`);
            community.pendingRequests.forEach(request => {
                console.log(`      - ${request.name} (${request.email})`);
            });

            console.log(`\n   📢 Pulses (${community.pulses.length}):`);
            community.pulses.forEach(pulse => {
                console.log(`      - ${pulse.title} (Status: ${pulse.status})`);
            });

            console.log(`\n   🛒 Marketplace Listings (${community.marketplaceListings.length}):`);
            community.marketplaceListings.forEach(listing => {
                console.log(`      - ${listing.title} (${listing.type}) - ₹${listing.price} (Status: ${listing.status})`);
            });

            console.log(`\n   📅 Events (${community.events.length}):`);
            community.events.forEach(event => {
                console.log(`      - ${event.title} on ${new Date(event.eventDate).toLocaleDateString()}`);
                console.log(`        Time: ${event.startTime} - ${event.endTime || 'N/A'}`);
                console.log(`        Max Participants: ${event.maxParticipants || 'Unlimited'}`);
                console.log(`        Registered: ${event.participants?.length || 0}, Status: ${event.status}`);
            });
        });

        // Fetch all pulses
        const allPulses = await PulsesModel.find({ isDeleted: false })
            .populate('userId', 'name email')
            .populate('communityId', 'name');
        
        console.log(`\n\n📢 All Pulses (${allPulses.length}):`);
        allPulses.forEach(pulse => {
            console.log(`   - "${pulse.title}" by ${pulse.userId?.name || 'Unknown'}`);
            console.log(`     Community: ${pulse.communityId?.name || 'N/A'}, Territory: ${pulse.territory}`);
            console.log(`     Status: ${pulse.status}, Likes: ${pulse.likes?.length || 0}`);
        });

        // Fetch all marketplace listings
        const allListings = await MarketplaceListingsModel.find({ isDeleted: false })
            .populate('userId', 'name email')
            .populate('communityId', 'name');
        
        console.log(`\n\n🛒 All Marketplace Listings (${allListings.length}):`);
        allListings.forEach(listing => {
            console.log(`   - "${listing.title}" (${listing.type.toUpperCase()})`);
            console.log(`     Posted by: ${listing.userId?.name || 'Unknown'}, Price: ₹${listing.price}`);
            console.log(`     Community: ${listing.communityId?.name || 'N/A'}, Status: ${listing.status}`);
        });

        // Fetch all events
        const allEvents = await EventsModel.find({ isDeleted: false })
            .populate('createdBy', 'name email')
            .populate('communityId', 'name');
        
        console.log(`\n\n📅 All Events (${allEvents.length}):`);
        allEvents.forEach(event => {
            console.log(`   - "${event.title}"`);
            console.log(`     Date: ${new Date(event.eventDate).toLocaleDateString()}, Time: ${event.startTime}`);
            console.log(`     Community: ${event.communityId?.name || 'N/A'}`);
            console.log(`     Created by: ${event.createdBy?.name || 'Unknown'}`);
            console.log(`     Status: ${event.status}, Participants: ${event.participants?.length || 0}/${event.maxParticipants || 'Unlimited'}`);
        });

        console.log('\n\n✅ Data verification completed!\n');
        
        process.exit(0);
    } catch (error) {
        console.error('Error verifying data:', error);
        process.exit(1);
    }
}

// Run the verification
verifyData();

