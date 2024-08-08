# Measure Benchmark Runtime and Memory Consumption

## Initial setup

Before you begin, make sure your development environment includes [Python](https://www.python.org/).

Preferred use:
- python: 3.12.4
- pip: 24.1.2

## Run Project

1. **Create Virtual Environment**
   ```shell
   python -m venv venv
   ```

2. **Activate Virtual Environment**
   - **Windows**
     ```shell
     .\venv\Scripts\activate
     ```
   - **Linux/MacOS**
     ```shell
     source venv/bin/activate
     ```

3. **Install Dependencies**
   ```shell
   pip install -r requirements.txt
   ```

4. **Run website**
   ```shell
   streamlit run website/app.py
   ```
   The website will be running on the host: [http://localhost:8501](http://localhost:8501)


5. **Run runner**
   ```shell
   python runner/app.py
   ```

The app will save the runtime and memory consumption into a CSV file.