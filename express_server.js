const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
app.use(cookieParser());
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

function emailLookUp(inputEmail) {
  for (const key in users) {
    if (users[key].email === inputEmail) {
      return key;
    }
  }
  return false; //no email match
}

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

//main page
app.get("/urls", (req, res) => {
  const userID = req.cookies["user_id"];

  const templateVars = {
    user: users[userID],
    urls: urlDatabase,
  };

  res.render("urls_index", templateVars);
});

//login page
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_login", templateVars);
});

//login cookie
app.post("/login", (req, res) => {
  if (!emailLookUp(req.body.email)) {
    res.redirect("/register");
  }
  res.cookie("user_id", emailLookUp(req.body.email));
  res.redirect("/urls");
});

//logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

//register page
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    error: null,
  };
  res.render("urls_register", templateVars);
});

//register page - form
app.post("/register", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;

  //error message - if one of the register input field is empty
  if (!userEmail || !userPassword) {
    const templateVars = {
      user: users[req.cookies["user_id"]],
      error: "one of the field is empty",
    };
    res.status(400).render("urls_register", templateVars);
  }

  //error message - if email has already been registered
  if (emailLookUp(userEmail)) {
    const templateVars = {
      user: users[req.cookies["user_id"]],
      error: "this email has already been registered",
    };
    res.status(400).render("urls_register", templateVars);
  }

  //error message - already logged in
  if (req.cookies["user_id"]) {
    const templateVars = {
      user: users[req.cookies["user_id"]],
      error: "You are currently logged in",
    };
    res.status(400).render("urls_register", templateVars);
  }

  const id = generateRandomString();
  users[id] = {
    id: id,
    email: userEmail,
    password: userPassword,
  };
  res.cookie("user_id", id);
  res.redirect("/urls");
});

//new url generator
app.post("/urls/new", (req, res) => {
  const key = generateRandomString();
  urlDatabase[key] = req.body.longURL;
  res.redirect(`/urls/${key}`);
});

//page for adding new url
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

//shortURL page
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
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
