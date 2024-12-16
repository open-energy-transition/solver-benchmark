# Dockerfile for Streamlit Website with Gurobi Results

# Use a lightweight Python base image
FROM python:3.12-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the application and benchmark results into the container
COPY website/ /app/website
COPY results/ /app/results

# Install dependencies from website directory
RUN pip install --no-cache-dir -r /app/website/requirements.txt

# Expose Streamlit's default port
EXPOSE 8501

# Command to run the Streamlit app from the website directory
CMD ["streamlit", "run", "/app/website/app.py", "--server.port=8501", "--server.headless=true"]
