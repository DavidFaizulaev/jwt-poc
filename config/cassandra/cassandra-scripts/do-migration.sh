#!/bin/bash -e

echo "do-migration.sh script"
echo
echo "Starting migration - create KEYSPACE if needed"
node cassandra-migration.js
echo "Finished cassandra migrations"
