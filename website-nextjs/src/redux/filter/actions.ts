const actions = {
  TOGGLE_FILTER: "TOGGLE_FILTER",

  toggleFilter: (category: string, value: string) => {
    return {
      type: actions.TOGGLE_FILTER,
      payload: { category, value },
    }
  },
}

export default actions
