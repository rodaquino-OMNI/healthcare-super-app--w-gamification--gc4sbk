# React Native Development Dockerfile for AUSTA SuperApp
# This Dockerfile creates a development environment for React Native mobile development
# with all necessary dependencies for Android builds and development tools.

FROM reactnativecommunity/react-native-android:latest

LABEL maintainer="AUSTA Development Team"
LABEL description="React Native development environment for AUSTA SuperApp mobile application"

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=18.0.0
ENV REACT_NATIVE_VERSION=0.73.4
ENV TYPESCRIPT_VERSION=5.3.3
ENV YARN_VERSION=1.22.19

# Update and install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    gnupg \
    unzip \
    wget \
    python3 \
    python3-pip \
    openssh-client \
    bash \
    build-essential \
    file \
    fontconfig \
    locales \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set locale to UTF-8
RUN locale-gen en_US.UTF-8
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get update \
    && apt-get install -y nodejs \
    && npm install -g npm@latest

# Install Yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
    && echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
    && apt-get update && apt-get install -y yarn \
    && yarn --version

# Install React Native CLI and other global packages
RUN npm install -g react-native-cli@${REACT_NATIVE_VERSION} \
    typescript@${TYPESCRIPT_VERSION} \
    jest \
    metro-bundler \
    detox-cli \
    react-devtools

# Create a non-root user for development
RUN useradd -ms /bin/bash developer

# Set up permissions for Android SDK
RUN chown -R developer:developer $ANDROID_HOME

# Set up workspace directory
RUN mkdir -p /app
WORKDIR /app
RUN chown -R developer:developer /app

# Set up directory for shared packages
RUN mkdir -p /shared-packages
RUN chown -R developer:developer /shared-packages

# Create directories for the required shared packages
RUN mkdir -p /shared-packages/design-system \
    /shared-packages/primitives \
    /shared-packages/interfaces \
    /shared-packages/journey-context
RUN chown -R developer:developer /shared-packages

# Install additional development tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    vim \
    nano \
    less \
    procps \
    lsof \
    htop \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Configure Metro bundler for hot reloading
ENV REACT_NATIVE_PACKAGER_HOSTNAME="0.0.0.0"

# Expose ports for development server and debugging
EXPOSE 8081 9090 19000 19001 19002 19006

# Switch to non-root user for security
USER developer

# Set up environment for shared packages
ENV PATH="/app/node_modules/.bin:${PATH}"

# Configure Metro bundler to resolve shared packages
RUN echo '{
  "resolver": {
    "extraNodeModules": {
      "@austa/design-system": "/shared-packages/design-system",
      "@design-system/primitives": "/shared-packages/primitives",
      "@austa/interfaces": "/shared-packages/interfaces",
      "@austa/journey-context": "/shared-packages/journey-context"
    }
  }
}' > /app/metro.config.js

# Add note about iOS development
# iOS development requires macOS and cannot be run in Docker
# For iOS builds, use a macOS host with Xcode installed

# Add helper scripts for development
COPY --chown=developer:developer scripts/start-dev.sh /usr/local/bin/start-dev.sh
COPY --chown=developer:developer scripts/setup-project.sh /usr/local/bin/setup-project.sh
RUN chmod +x /usr/local/bin/start-dev.sh /usr/local/bin/setup-project.sh

# Default command to start the development server
CMD ["bash"]

# Usage instructions:
# To build this image:
# docker build -t austa/react-native-dev -f react-native.Dockerfile .
#
# To run with volume mounts for code sharing:
# docker run -it --rm \
#   -v $(pwd)/src/web/mobile:/app \
#   -v $(pwd)/src/web/design-system:/shared-packages/design-system \
#   -v $(pwd)/src/web/primitives:/shared-packages/primitives \
#   -v $(pwd)/src/web/interfaces:/shared-packages/interfaces \
#   -v $(pwd)/src/web/journey-context:/shared-packages/journey-context \
#   -p 8081:8081 -p 9090:9090 \
#   austa/react-native-dev
#
# To start the development server:
# start-dev.sh