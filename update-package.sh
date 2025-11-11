#!/bin/bash

# Navigate to firebase-crm directory
cd firebase-crm

# Install new devDependencies
npm install --save-dev \
  prettier \
  eslint-config-prettier \
  eslint-plugin-jsx-a11y \
  vitest \
  @vitest/ui \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jsdom \
  husky \
  lint-staged \
  @sentry/react \
  @sentry/vite-plugin

echo "✅ Dependencies installed successfully!"
