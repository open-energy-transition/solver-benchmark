const actions = {
  TOGGLE_NAV: "TOGGLE_NAV",
  SET_NAV_EXPANDED: "SET_NAV_EXPANDED",

  toggleNav: () => {
    return {
      type: actions.TOGGLE_NAV,
    };
  },

  setNavExpanded: (isExpanded: boolean) => {
    return {
      type: actions.SET_NAV_EXPANDED,
      payload: isExpanded,
    };
  },
};

export default actions;
