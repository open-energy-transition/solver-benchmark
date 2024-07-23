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
   2. Install 
      ```shell
      pip install streamlit
      pip install streamlit_shadcn_ui
      pip install dash
      pip install pandas
      ```
   3. Open terminal
      ```shell
      .\venv\Scripts\activate
      ```
   4. Run project
      - streamlit
         ```shell
         streamlit run pocs\streamlit\app.py
         ```
      - plotly/dash
         ```shell
         py pocs\dash\app.py
         ```
The streamlit app will be running on the host: [http://localhost:8501](http://localhost:8501) and the dash app will be running on the host: [http://localhost:8050](http://localhost:8050)
