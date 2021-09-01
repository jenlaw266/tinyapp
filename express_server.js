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
  return array.join("");
}

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

//main page
app.get("/urls", (req, res) => {
  res.render("urls_index", { urls: urlDatabase });
});

//main page
app.post("/urls", (req, res) => {
  const key = generateRandomString();
  urlDatabase[key] = req.body.longURL;
  res.redirect(`/urls/${key}`);
});

//new url
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//shortURL page
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
  };
  res.render("urls_show", templateVars);
});

//redirect to longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//delete
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

//edit
app.post("/urls/:shortURL/edit", (req, res) => {
  const longURL = req.body.textbox;
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
