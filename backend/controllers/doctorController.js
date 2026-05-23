const Doctor = require("../models/Doctor");

const getDoctors = async (req, res) => {
   try {
      const doctors = await Doctor.find();
      res.json(doctors);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

module.exports = { getDoctors };