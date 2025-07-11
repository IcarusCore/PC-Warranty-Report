FROM python:3.11-slim

# Set metadata
LABEL org.opencontainers.image.source="https://github.com/yourusername/computer-inventory-analytics"
LABEL org.opencontainers.image.description="Computer Inventory Analytics - Warranty Management Dashboard"
LABEL org.opencontainers.image.licenses="MIT"

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory with proper permissions
RUN mkdir -p uploads && \
    chown -R appuser:appuser uploads && \
    chmod 755 uploads

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 5003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5003 || exit 1

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:5003", "--workers", "2", "--timeout", "300", "app:app"]