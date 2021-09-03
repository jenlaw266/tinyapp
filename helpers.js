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

//combined emailLookUp and getUserByEmail
function getUserByEmail(inputEmail, database) {
  for (const key in database) {
    if (database[key].email === inputEmail) {
      return key;
    }
  }
  return undefined; //no email match
}

function urlsForUser(id, urlDatabase) {
  const userURL = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURL[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURL;
}

module.exports = {
  getUserByEmail,
  generateRandomString,
  urlsForUser,
};
