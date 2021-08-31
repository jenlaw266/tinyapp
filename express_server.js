const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

function generateRandomString() {
  const array = [];
  const random = (x) => {
    return Math.floor(Math.random() * x);
  };
  for (let i = 0; i < 6; i++) {
    if (random(2)) {
      array.push(random(10));
    } else {
      if (random(2)) {
        array.push(String.fromCharCode(random(26) + 97));
      } else {
        array.push(String.fromCharCode(random(26) + 65));
      }
    }
  }
  console.log(array.join(""));
  return array.join("");
}
generateRandomString();
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  res.send("Ok"); // Respond with 'Ok' (we will replace this)
});

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls", (req, res) => {
  res.render("urls_index", { urls: urlDatabase });
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
  };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
