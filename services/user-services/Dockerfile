FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Bundle app source
COPY . .

# Create necessary directories
RUN mkdir -p logs

# Expose the port the app runs on
EXPOSE 11001

# Command to run migrations and then start the application
CMD ["npm", "start"]
