FROM python:3.11-slim

# Install system dependencies including GDAL for geopandas
RUN apt-get update && apt-get install -y \
    curl \
    gdal-bin \
    libgdal-dev \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set GDAL environment variables
ENV GDAL_CONFIG=/usr/bin/gdal-config

# Set logging configuration
ENV LOG_LEVEL=INFO
ENV LOG_TO_FILE=false

WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"] 