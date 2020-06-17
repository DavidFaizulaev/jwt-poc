FROM node:12-alpine

# Create migration directory
RUN mkdir -p /usr/src/mgr
WORKDIR /usr/src/mgr

# Copy files for migration
COPY cassandra-scripts /usr/src/mgr

# Install dependencies
RUN npm install

# Run the js script
CMD ["sh", "./do-migration.sh"]
