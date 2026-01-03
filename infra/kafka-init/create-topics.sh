#!/bin/bash

set -e

echo "Creating Kafka topics..."

kafka-topics.sh --bootstrap-server kafka:9092 --create --if-not-exists \
  --topic events.raw --partitions 6 --replication-factor 1

kafka-topics.sh --bootstrap-server kafka:9092 --create --if-not-exists \
  --topic events.dlq --partitions 3 --replication-factor 1

echo "Topics created successfully."

