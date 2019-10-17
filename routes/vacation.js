const express = require("express");
const Users = require("../helpers/sequelizeInit").Users;
const Vacation = require("../helpers/sequelizeInit").Vacation;
const differenceInBusinessDays = require('date-fns/differenceInBusinessDays');

const router = express.Router();

const base = 10;
const fullYears = 2;

router.get("/:id", (req, res) => {
  Users.findByPk(req.params.id).then(user => {
    if (user !== null) {
      const date = new Date();
      const joinedAt = new Date(user.joinedAt);
      res.json(calculateVacation(base, date, fullYears, joinedAt));
    } else {
      res.status(422).send("No user found.");
    }
  });
});

calculateVacation = (base = 10, date, fullYears, joinedAt) => {
  if (!joinedAt) {
    return null;
  }
  const diffTime = Math.abs(joinedAt - date);
  const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) / 365;
  const daysAdded = diffYears - fullYears > 0 ? Math.ceil(diffYears) - fullYears : 0;

  return base + daysAdded;
};

router.post("/", (req, res) => {
  const date = new Date();
  const joinedAt = new Date(req.user.joinedAt);
  const total = calculateVacation(base, date, fullYears, joinedAt);
  if (total !== null) {
    const result = differenceInBusinessDays(
        new Date(req.body.toDate),
        new Date(req.body.fromDate)
    );
    if (result <= total && result > 0){
      Vacation.create(
          {
            userId: req.user.id,
            fromDate: req.body.fromDate,
            toDate: req.body.toDate
          }
      )
          .then(()=>{
            res.status(200).send("Vacation created successfully")
          })
          .catch(err => {
            res.status(400).send(err)
          })
    } else {
      res.status(400).send("Invalid")
    }
  } else {
    res.status(422).send("Error during vacation calculation");
  }
});


module.exports = router;