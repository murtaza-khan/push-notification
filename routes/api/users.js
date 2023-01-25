const express = require("express");
const router = express.Router();
const User = require("../../models/user");
router.post("/create", async (req, res, next) => {
  try {
    const { body } = req;
    const response = await User.create(body);
    return res.status("200").send(response);
  } catch (error) {
    return res.status("400").send(error);
  }
});

module.exports = router;
