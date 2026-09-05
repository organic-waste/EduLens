// Stable public boundary for the Learning domain.
module.exports = {
  router: require("./api/router"),
  ...require("./application/agent"),
  ...require("./application/summary"),
  ...require("./application/supplement"),
  ...require("./persistence/memory"),
};
