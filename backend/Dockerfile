FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

COPY entrypoint.sh /app/

RUN chmod +x /app/entrypoint.sh && \
    # Ensure the script uses Unix line endings
    sed -i 's/\r$//' /app/entrypoint.sh && \
    # Double check permissions
    ls -la /app/entrypoint.sh

# Expose port
EXPOSE 8000

# Use entrypoint script
CMD ["/bin/bash", "/app/entrypoint.sh"]