const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const bcrypt = require("bcryptjs");
// const password = "purple-monkey-dinosaur"; // found in the req.params object
// const hashedPassword = bcrypt.hashSync(password, 10);
// console.log(bcrypt.compareSync("purple-monkey-dinosaur", hashedPassword));

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
app.use(morgan("dev"));

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
  aJ48lW: {
    id: "aJ48lW",
    email: "123@123",
    password: "123",
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
function urlsForUser(id) {
  const userURL = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURL[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURL;
}

//main page (GET)
app.get("/urls", (req, res) => {
  const userID = req.cookies["user_id"];
  if (userID) {
    const templateVars = {
      user: users[userID],
      urls: urlsForUser(userID),
    };
    res.render("urls_index", templateVars);
  } else {
    const templateVars = {
      user: null,
      urls: null,
    };
    res.render("urls_index", templateVars);
  }
});

//login page (GET)
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    error: null,
  };
  res.render("urls_login", templateVars);
});

//login page (POST)
app.post("/login", (req, res) => {
  //happy path
  if (users[emailLookUp(req.body.email)].password === req.body.password) {
    res.cookie("user_id", emailLookUp(req.body.email));
    res.redirect("/urls");
  }
  //email cannot be found
  if (!emailLookUp(req.body.email)) {
    const templateVars = {
      user: users[req.cookies["user_id"]],
      error: "email cannot be found",
    };
    res.status(403).render("urls_login", templateVars);
  } else {
    //email found but password incorrect
    const templateVars = {
      user: users[req.cookies["user_id"]],
      error: "password is incorrect",
    };
    res.status(403).render("urls_login", templateVars);
  }
});

//logout (POST)
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

//register page (GET)
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    error: null,
  };
  res.render("urls_register", templateVars);
});

//register page (POST)
app.post("/register", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(userPassword, 10);

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

//new url (POST)
app.post("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
    const key = generateRandomString();
    //stretch: if key doesn't exist then proceed below
    urlDatabase[key] = {};
    urlDatabase[key].longURL = req.body.longURL;
    urlDatabase[key].userID = req.cookies["user_id"];
    res.redirect(`/urls/${key}`);
  } else {
    res.status(401).end("error: need to login to access tinyapp"); //error for curl POST attempt
  }
});

//new url (GET)
app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
    const templateVars = { user: users[req.cookies["user_id"]] };
    res.render("urls_new", templateVars);
  }
  res.redirect("/login");
});

//shortURL page (GET)
app.get("/urls/:shortURL", (req, res) => {
  const urlDatabaseKey = urlDatabase[req.params.shortURL];

  const templateVars = {
    user: users[req.cookies["user_id"]],
    shortURL:
      urlDatabaseKey && req.cookies["user_id"] === urlDatabaseKey.userID
        ? req.params.shortURL
        : null,
    longURL: urlDatabaseKey ? urlDatabaseKey.longURL : null,
  };
  res.render("urls_show", templateVars);
});

//redirect to longURL (GET)
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    const templateVars = {
      user: users[req.cookies["user_id"]],
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL]
        ? urlDatabase[req.params.shortURL].longURL
        : null,
    };
    res.status(400).render("urls_show", templateVars);
  }
});

//delete (POST)
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID === req.cookies["user_id"]) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    res.status(400).end("error: need to login to access tinyapp"); //error for curl POST attempt
  }
});

//edit (POST)
app.post("/urls/:shortURL/edit", (req, res) => {
  const longURL = req.body.textbox;
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID === req.cookies["user_id"]) {
    urlDatabase[shortURL].longURL = longURL;
    res.redirect("/urls");
  } else {
    res.status(400).end("error: need to login to access tinyapp"); //error for curl POST attempt
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
