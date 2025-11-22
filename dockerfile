# Use Node.js official image
FROM node:18

# Create app directory
WORKDIR /app

# Copy package.json first
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy entire project
COPY . .

# Expose port
ENV PORT=8080
EXPOSE 8080

# Start the app
CMD ["npm", "start"]
