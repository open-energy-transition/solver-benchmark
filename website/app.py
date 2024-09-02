import streamlit as st

st.markdown(
    """
  <style>
    .banner-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      padding: 10px 15px;
      text-align: center;
      border-radius: 4px;
      height: 56px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 18px;
    }

    .appview-container {
      margin-top: 56px;
    }

    header.st-emotion-cache-12fmjuu {
      top: 56px;
    }
  </style>
  <div class="banner-container">
      <strong>This website is under development. All content is for testing purposes, and is subject to change.</strong>
  </div>
  """,
    unsafe_allow_html=True,
)

pages = [
    st.Page("home.py", title="Home"),
    st.Page("raw-results.py", title="Raw Results"),
    st.Page("compare.py", title="Compare solvers"),
    st.Page("history.py", title="Solver performance history"),
]

pg = st.navigation(pages)
pg.run()
