const express = require("express");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");

const {
  getUserByEmail,
  generateRandomString,
  urlsForUser,
} = require("./helpers");

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(morgan("dev"));
app.use(
  cookieSession({
    name: "session",
    keys: ["apple"], //could be anything else as well
  })
);

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("321", 10),
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
  aJ48lW: {
    id: "aJ48lW",
    email: "123@123",
    password: bcrypt.hashSync("123", 10),
  },
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
  u6et7r: {
    longURL: "https://www.yahoo.com",
    userID: "userRandomID",
  },
};

//home page (GET)
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  res.redirect("/login");
});

//main page (GET & POST)
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    const templateVars = {
      user: users[userID],
      urls: urlsForUser(userID, urlDatabase),
    };
    res.render("urls_index", templateVars);
    return;
  }
  const templateVars = {
    user: null,
    urls: null,
  };
  res.render("urls_index", templateVars);
});

//login page (GET)
app.get("/login", (req, res) => {
  if (!req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id],
      error: null,
    };
    res.render("urls_login", templateVars);
    return;
  }
  res.redirect("/urls");
});

//login page (POST)
app.post("/login", (req, res) => {
  const userID = getUserByEmail(req.body.email, users);

  //already logged in
  if (req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id],
      error: "Error: You are currently logged in",
    };
    res.status(403).render("urls_login", templateVars);
    return;
  }
  //email cannot be found
  if (!userID) {
    const templateVars = {
      user: users[req.session.user_id],
      error: "Error: Email cannot be found",
    };
    res.status(403).render("urls_login", templateVars);
    return;
  }
  //happy path
  if (bcrypt.compareSync(req.body.password, users[userID].password)) {
    req.session.user_id = userID;
    res.redirect("/urls");
    return;
  }
  //email found but password incorrect
  const templateVars = {
    user: users[req.session.user_id],
    error: "Error: Password is incorrect",
  };
  res.status(403).render("urls_login", templateVars);
});

//logout (POST)
app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.clearCookie("session.sig");
  res.redirect("/urls");
});

//register page (GET)
app.get("/register", (req, res) => {
  if (!req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id],
      error: null,
    };
    res.render("urls_register", templateVars);
    return;
  }
  res.redirect("/urls");
});

//register page (POST)
app.post("/register", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(userPassword, 10);

  //error message - already logged in
  if (req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id],
      error: "Error: You are currently logged in",
    };
    res.status(400).render("urls_register", templateVars);
    return;
  }
  //error message - if one of the register input field is empty
  if (!userEmail || !userPassword) {
    const templateVars = {
      user: users[req.session.user_id],
      error: "Error: One of the fields is empty",
    };
    res.status(400).render("urls_register", templateVars);
    return;
  }
  //error message - if email has already been registered
  if (getUserByEmail(userEmail, users)) {
    const templateVars = {
      user: users[req.session.user_id],
      error: "Error: This email has already been registered",
    };
    res.status(400).render("urls_register", templateVars);
    return;
  }

  const id = generateRandomString();
  users[id] = {
    id: id,
    email: userEmail,
    password: hashedPassword,
  };
  req.session.user_id = id;
  res.redirect("/urls");
});

//new url (POST)
app.post("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const key = generateRandomString();
    //stretch: check if key doesn't exist then proceed below
    urlDatabase[key] = {};
    urlDatabase[key].longURL = req.body.longURL;
    urlDatabase[key].userID = req.session.user_id;
    res.redirect(`/urls/${key}`);
    return;
  }
  res.status(401).end("Error: Need to login to access TinyApp"); //error for curl POST attempt
});

//new url (GET)
app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const templateVars = { user: users[req.session.user_id] };
    res.render("urls_new", templateVars);
    return;
  }
  res.redirect("/login");
});

//shortURL page (GET)
app.get("/urls/:shortURL", (req, res) => {
  const keyShortURL = urlDatabase[req.params.shortURL];
  const templateVars = {
    user: users[req.session.user_id],
    shortURL:
      keyShortURL && req.session.user_id === keyShortURL.userID
        ? req.params.shortURL
        : null,
    longURL: keyShortURL ? keyShortURL.longURL : null,
  };
  res.render("urls_show", templateVars);
});

//redirect to longURL (GET)
app.get("/u/:shortURL", (req, res) => {
  const shortLink = req.params.shortURL;
  if (urlDatabase[shortLink]) {
    const longURL = urlDatabase[shortLink].longURL;
    res.redirect(longURL);
    return;
  }
  const templateVars = {
    user: users[req.session.user_id],
    shortURL: shortLink,
    longURL: urlDatabase[shortLink] ? urlDatabase[shortLink].longURL : null,
  };
  res.status(400).render("urls_show", templateVars);
});

//delete (POST)
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID === req.session.user_id) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
    return;
  }
  res.status(400).end("Error: Need to login to access TinyApp"); //error for curl POST attempt
});

//edit (POST)
app.post("/urls/:shortURL/edit", (req, res) => {
  const longURL = req.body.textbox;
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID === req.session.user_id) {
    urlDatabase[shortURL].longURL = longURL;
    res.redirect("/urls");
    return;
  }
  res.status(400).end("Error: Need to login to access TinyApp"); //error for curl POST attempt
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
