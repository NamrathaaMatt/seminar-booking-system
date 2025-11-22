# Use Node.js official image
FROM node:18

# Create app directory
WORKDIR /app

# Copy package.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy entire project
COPY . .

# Expose port
EXPOSE 8080

# Start the app
CMD ["npm", "start"]
