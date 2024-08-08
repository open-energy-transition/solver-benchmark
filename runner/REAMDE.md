# Measure Benchmark Runtime and Memory Consumption

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

4. **Run Project**
   ```shell
   python pocs/runner/app.py
   ```

The app will save the runtime and memory consumption into a CSV file.