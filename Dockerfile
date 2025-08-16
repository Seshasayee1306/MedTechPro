# Use Node image
FROM node:20-alpine

WORKDIR /app
COPY package.json ./
RUN npm install
COPY . ./
RUN npm run build

# Serve the build
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]
EXPOSE 3000
