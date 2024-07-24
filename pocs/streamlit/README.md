# solver-benchmark
A benchmark of (MI)LP solvers on energy modelling problems

## Initial setup

Before you begin, make sure your development environment includes [Python](https://www.python.org/).

Preferred use:
- python: 3.12.4
- pip: 24.1.2

## Run Project
   1. Create folder "venv"
      ```shell
      python -m venv venv
      ```  
   2. Open terminal
      - Windows
         ```shell
         .\venv\Scripts\activate
         ```
      - Linux/Macos
         ```shell
         source venv/bin/activate
         ```
   3. Install 
      ```shell
      pip install streamlit
      pip install streamlit_shadcn_ui
      pip install streamlit-aggrid
      ```
   4. Run project
         ```shell
         streamlit run pocs\streamlit\app.py
         ```
      
The app will be running on the host: [http://localhost:8501](http://localhost:8501)
