# Use Python 3.9 slim image as base
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONPATH=/app/src

# Install system dependencies in one layer
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies with specific versions for compatibility
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir --no-deps scikit-learn==1.1.1 && \
    pip install --no-cache-dir --no-deps numpy==1.24.3 && \
    pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/
COPY setup.py .
COPY versioneer.py .

# Create necessary directories
RUN mkdir -p /app/outputs /app/models /app/data_raw

# Expose port (Render will set PORT environment variable)
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Run the FastAPI application with dynamic port
CMD ["sh", "-c", "python -c \"import sys, os; sys.path.insert(0, 'src'); import uvicorn; uvicorn.run('stepcount.api:app', host='0.0.0.0', port=int(os.environ.get('PORT', 8000)))\""]