# Gamification Engine Scripts

This directory contains utility scripts for the gamification-engine service.

## Available Scripts

- `kafka-setup.sh` - Sets up Kafka topics for the gamification-engine
- `entrypoint.sh` - Docker entrypoint script that runs Kafka setup before starting the application
- `kafka-setup-job.yaml` - Kubernetes job manifest for setting up Kafka topics during deployment

## Kafka Setup Script

### Overview

The `kafka-setup.sh` script automates the configuration of Kafka topics required by the gamification-engine service. It creates and configures topics for health events, care events, plan events, user events, and gamification events with appropriate partition counts, replication factors, and retention policies.

### Features

- Creates all required Kafka topics if they don't exist
- Configures appropriate partitions, replication factor, and retention policies
- Validates Kafka cluster connectivity before attempting operations
- Provides detailed error messages and status updates
- Supports configuration via environment variables or .env file

### Prerequisites

- Kafka command-line tools (`kafka-topics.sh`, `kafka-configs.sh`) must be available in your PATH
- Network access to the Kafka brokers

### Usage

```bash
# Make the script executable
chmod +x kafka-setup.sh

# Run with default settings (connects to localhost:9092)
./kafka-setup.sh

# Run with custom Kafka brokers
KAFKA_BROKERS=kafka1:9092,kafka2:9092 ./kafka-setup.sh

# Run with custom topic configuration
KAFKA_PARTITIONS=5 KAFKA_REPLICATION_FACTOR=3 KAFKA_RETENTION_MS=1209600000 ./kafka-setup.sh
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|--------|
| `KAFKA_BROKERS` | Comma-separated list of Kafka brokers | `localhost:9092` |
| `KAFKA_PARTITIONS` | Number of partitions for each topic | `3` |
| `KAFKA_REPLICATION_FACTOR` | Replication factor for each topic | `1` |
| `KAFKA_RETENTION_MS` | Retention period in milliseconds | `604800000` (7 days) |
| `KAFKA_TOPIC_HEALTH_EVENTS` | Topic name for health events | `health.events` |
| `KAFKA_TOPIC_CARE_EVENTS` | Topic name for care events | `care.events` |
| `KAFKA_TOPIC_PLAN_EVENTS` | Topic name for plan events | `plan.events` |
| `KAFKA_TOPIC_USER_EVENTS` | Topic name for user events | `user.events` |
| `KAFKA_TOPIC_GAME_EVENTS` | Topic name for gamification events | `game.events` |

### Integration with Deployment

This script is designed to be run during service initialization or deployment to ensure all required Kafka topics exist with correct configurations before the gamification engine begins processing events.

Example integration with Docker entrypoint:

```bash
#!/bin/bash
# entrypoint.sh

# Set up Kafka topics
./scripts/kafka-setup.sh

# Start the application
exec node dist/main.js
```

Example integration with Kubernetes init container:

```yaml
initContainers:
  - name: kafka-setup
    image: ${GAMIFICATION_ENGINE_IMAGE}
    command: ["./scripts/kafka-setup.sh"]
    env:
      - name: KAFKA_BROKERS
        value: "kafka-service:9092"
```

### Troubleshooting

- **Error: kafka-topics.sh command not found**: Ensure Kafka binaries are in your PATH or provide the full path to kafka-topics.sh
- **Error: Cannot connect to Kafka brokers**: Check that Kafka is running and the broker addresses are correct
- **Failed to create topic**: Check Kafka broker logs for more details on the failure reason

## Docker Entrypoint Script

### Overview

The `entrypoint.sh` script serves as the Docker container entrypoint for the gamification-engine service. It runs the Kafka setup script before starting the application to ensure all required Kafka topics exist with the correct configuration.

### Features

- Runs the Kafka setup script to configure required topics
- Provides option to skip Kafka setup using environment variable
- Handles errors from Kafka setup and provides clear error messages
- Starts the application after successful setup

### Usage

```bash
# Make the script executable
chmod +x entrypoint.sh

# Use as Docker entrypoint
DOCKERFILE:
COPY scripts/entrypoint.sh /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]

# Skip Kafka setup (useful for development)
SKIP_KAFKA_SETUP=true ./entrypoint.sh
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|--------|
| `SKIP_KAFKA_SETUP` | Skip Kafka topic setup | `false` |

## Kubernetes Job Manifest

### Overview

The `kafka-setup-job.yaml` file provides a Kubernetes Job manifest for setting up Kafka topics during deployment. This job runs the Kafka setup script as a separate pod before the main application is deployed.

### Features

- Runs as a Kubernetes Job with retry logic
- Configurable via ConfigMap
- Automatically cleans up after completion
- Resource limits to prevent excessive resource usage

### Usage

```bash
# Apply the manifest to your Kubernetes cluster
kubectl apply -f kafka-setup-job.yaml

# Check job status
kubectl get jobs -l app=gamification-engine,component=kafka-setup

# View job logs
kubectl logs job/gamification-kafka-setup
```

### Configuration

The job is configured via a ConfigMap named `gamification-engine-config`. You can modify the ConfigMap to customize the Kafka configuration.