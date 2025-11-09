require('dotenv').config();
const path = require('path');

// Try to load .env from multiple possible locations
const envPaths = [
    path.resolve(__dirname, '../../../../.env'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(process.cwd(), '.env')
];

for (const envPath of envPaths) {
    try {
        require('dotenv').config({ path: envPath });
        if (process.env.ENTRYTRACKING_DB_URL) {
            console.log(`Loaded .env from: ${envPath}`);
            break;
        }
    } catch (e) {
        // Continue to next path
    }
}

const mongoose = require('mongoose');
const UsersModel = require('../models/Users');
const { DBConnect } = require('../models/index.js');

async function addManagerUser() {
    try {
        console.log('Connecting to database...');
        
        // Wait for database connection
        await new Promise((resolve) => {
            if (DBConnect.readyState === 1) {
                console.log('Database already connected');
                resolve();
            } else {
                DBConnect.once('connected', () => {
                    console.log('Database connected');
                    resolve();
                });
            }
        });

        console.log('Creating manager user...');

        // Check if user already exists
        const existingUser = await UsersModel.findOne({ email: 'manager@gmail.com' });
        
        if (existingUser) {
            console.log('Manager user already exists with email: manager@gmail.com');
            console.log('Updating password and role...');
            
            // Update password and role
            existingUser.password = '321ewq'; // Will be hashed by pre-save hook
            existingUser.role = 'Manager';
            existingUser.status = 'Active';
            existingUser.isEmailVerified = true;
            await existingUser.save();
            
            console.log('✅ Manager user updated successfully!');
            console.log('Email: manager@gmail.com');
            console.log('Password: 321ewq');
            console.log('Role: Manager');
            console.log('User ID:', existingUser._id);
        } else {
            // Create new manager user
            const manager = await UsersModel.create({
                name: 'Manager User',
                email: 'manager@gmail.com',
                mobileNumber: '9876543210',
                countryCode: '+91',
                password: '321ewq', // Will be hashed by pre-save hook
                role: 'Manager',
                status: 'Active',
                isEmailVerified: true
            });

            console.log('✅ Manager user created successfully!');
            console.log('Email: manager@gmail.com');
            console.log('Password: 321ewq');
            console.log('Role: Manager');
            console.log('User ID:', manager._id);
        }

        // Close database connection
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error creating manager user:', error);
        process.exit(1);
    }
}

// Run the script
addManagerUser();

