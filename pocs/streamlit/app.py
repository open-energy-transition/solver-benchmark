import streamlit as st

pages = [
  st.Page("raw-results.py", title="Raw Results"),
  st.Page("compare.py", title="Compare solvers"),
  st.Page("history.py", title="Solver performance history")
]

pg = st.navigation(pages)
pg.run()
