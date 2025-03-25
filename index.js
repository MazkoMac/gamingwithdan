const express = require("express");
const log = console.log;
const app = express();
const path = require("path");
const hbs = require("hbs");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const session = require("express-session");
const { request } = require("http");


const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.render("index.hbs");
});

app.use(express.static(__dirname + "/style"));
app.use("/style", express.static("style"));

app.use(express.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);


app.set("view engine", "hbs");
hbs.registerPartials(__dirname + "/views/partials");

var con = mysql.createConnection({
  host: "gamingwithdan.cvsifren0zml.us-west-2.rds.amazonaws.com",
  user: "admin",
  password: "Danisafly1!",
  database: "dansgaming",
});

con.connect(function (err) {
  if (err) throw err;
});

//Paginator Trial
// let paginator = {};
// paginator.limit = 6;
// paginator.defaultPage = "kaizo-hacks";

// let pages = (req, res, next) => {
//   let currentPage = parseInt(req.params.page) || 1;

//   let sql = "SELECT COUNT(id) AS total from kaizo";
//   con.query(sql, function(err, result){
//     if (err) next (err);
//     res.locals.currentPage = currentPage;
//     res.locals.totalPages = Math.ceil(parseInt(result[0].total) / paginator.limit);
//     res.locals.totalPosts = result[0].total;

//     paginator.totalPages = res.locals.totalPages;
//     paginator.currentPage = req.params.page;

//     next();

//   })
// }
//

app.get('/games-list', (req, res) => {
  con.query('SELECT name FROM favorites ORDER BY RAND() LIMIT 5', function(err, rows) {
    if (err) {
      console.error('Error retrieving favorites:', err);
      res.status(500).json({ error: 'An error occurred while retrieving favorites' });
    } else {
      var resultArray = Object.values(JSON.parse(JSON.stringify(rows)));
      var gamesList = resultArray.map(game => game.name);
      var gameslist = gamesList.join(' - ');

      console.log('gamesList:', gamesList);
      console.log('gameslist:', gameslist);

      con.query("SELECT name FROM games", function(err, rows) {
        if (err) {
          console.error('Error retrieving games:', err);
          res.status(500).json({ error: 'An error occurred while retrieving games' });
        } else {
          var gamesArray = Object.values(JSON.parse(JSON.stringify(rows))).map(game => game.name);
          
          console.log('gamesArray:', gamesArray);

          res.json({ gameslist: gameslist, games: gamesArray });
        }
      });
    }
  });
});

app.get('/games', (req, res) => {
  res.render('games.hbs');
});










// Routes for Challenge Pages

app.get("/yearly-challenge-2020", (req, res) => {
  con.query("SELECT * FROM challenge", function (err, result, fields) {
    if (err) throw err;
    res.render("challenge.hbs", { result });
    console.log(result);
  });
});

app.get("/yearly-challenge-2021", (req, res) => {
  con.query("SELECT * FROM challenge_2021", function (err, result, fields) {
    if (err) throw err;
    res.render("challenge_2021.hbs", { result });
    console.log(result);
  });
});


app.get("/yearly-challenge-2023", (req, res) => {
  con.query("SELECT * FROM challenge_2023", function (err, result, fields) {
    if (err) throw err;
    res.render("challenge_2023.hbs", { result });
    console.log(result);
  });
});

app.get("/yearly-challenge-2022", (req, res) => {
  con.query("SELECT * FROM challenge_2022", function (err, result, fields) {
    if (err) throw err;
    res.render("challenge_2022.hbs", { result });
    console.log(result);
  });
});

app.get("/yearly-challenge-2024", (req, res) => {
  con.query("SELECT * FROM challenge_2024", function (err, result, fields) {
    if (err) throw err;
    res.render("challenge_2024.hbs", { result });
    console.log(result);
  });
});

app.get("/yearly-challenge-2025", (req, res) => {
  con.query("SELECT * FROM challenge_2025", function (err, result, fields) {
    if (err) throw err;
    res.render("challenge_2025.hbs", { result });
    console.log(result);
  });
});

// Route for Kaizo Page

app.get("/kaizo-hacks", (req, res) => {
  page = 1;
  con.query("SELECT * FROM kaizo", function (err, result, fields) {
    if (err) throw err;
    res.render("kaizo.hbs", { result });
    console.log(result);
  });
});

// Route for Games Page

// app.get("/games-list", (req, res) => {

//   let gameslist = []


//   con.query("SELECT name FROM favorites ORDER BY RAND() LIMIT 5", function(err, rows) {
//     if(err) {
//       throw err;
//     } else {
//       var resultArray = Object.values(JSON.parse(JSON.stringify(rows)))
//       gameslist = (resultArray[0].name + " - " + resultArray[1].name + " - " + resultArray[2].name + " - " + resultArray[3].name + " - " + resultArray[4].name)
    
//       console.log(gameslist)
//     }

//   });



//Route for About Page

app.get("/about", (req, res) => {
  res.render("about.hbs");
});

//Route for Challenge Page


app.get("/challenges", (req, res) => {
  let gamesCount = []

  con.query("SELECT COUNT(*) as gamesCount FROM challenge_2024", function (err, result, fields) {
    if (err) throw err;
    count = JSON.parse(JSON.stringify(result));
    gamesCount = count[0].gamesCount
  });



  con.query("SELECT COUNT(*) as kaizoCount FROM kaizo", function (err, result, fields) {
    if (err) throw err;
    count = JSON.parse(JSON.stringify(result));
    kaizoCount = count[0].kaizoCount + 24 


    res.render("challenges.hbs", { result, gamesCount, kaizoCount }, );
    console.log(kaizoCount)
  });
});



 
// con.query("SELECT * FROM games ORDER BY RAND() LIMIT 1;", function (err, result, fields) {
//   if (err) throw err;
//   res.render("games.hbs", { result });
//   console.log(result);
// })


//Pagination Experimentation with Kaizo Page

// app.get('/kaizo-hacks', pages, function(req, res, next) {
//   let limit = paginator.limit;
//   let offset = res.locals.totalPosts - (paginator.limit * res.locals.currentPage);

//   let sql = "SELECT * FROM kaizo ORDER BY id DESC LIMIT ? OFFSET ? ";

//   con.query(sql, [limit, offset], function(err, rows) {
//       if (err) next(err);
//       res.render('kaizo.hbs', {
//           posts: rows,
//           paginator: paginator
//       })
//   });
// });


// app.get('/kaizo-hacks:page', pages, function(req, res, next) {
 
//   // Only render pages that do have posts.
//   if (res.locals.currentPage > res.locals.totalPages)
//       return res.redirect('/kaizo-hacks');

//   // If there are 100 posts. Page two will query post 90 to 81. Page three: 71 to 80.
//   let limit = paginator.limit;
//   let offset = res.locals.totalPosts - (paginator.limit * res.locals.currentPage);
  
//   if (offset < 0) {
//       limit += offset; // Algebraic double negative
//       offset = 0;
//   }

//   let sql = "SELECT * FROM kaizo ORDER BY id DESC LIMIT ? OFFSET ? ";

//   con.query(sql, [limit, offset], function(err, rows) {
//       if (err) next(err);
//       res.render('kaizo.hbs', {
//           posts: rows,
//           paginator: paginator
//       })
//   });
// });





//Login

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/login", (req, res) => {
  res.render("login.hbs");
});

app.post("/auth", function (request, response) {
  var username = request.body.username;
  var password = request.body.password;
  if (username && password) {
    con.query(
      "SELECT * FROM users WHERE username = ? AND password = ?",
      [username, password],
      function (error, results, fields) {
        if (results.length > 0) {
          request.session.loggedin = true;
          request.session.username = username;
          response.redirect("/update");
          console.log(request.session);
        } else {
          response.send("Incorrect Username and/or Password!");
          console.log(request.session);
        }
        response.end();
      }
    );
  } else {
    response.send("Please enter Username and Password!");
    response.end();
  }
});

// Update Data Home Page Route
app.get("/update", (req, res) => {
  if (req.session.loggedin) {
    res.render("update.hbs");
  } else {
    res.send("Please login to view this page!");
  }
});

//Update Challenge Routes

app.get("/update-challenge", (req, res) => {
  con.query("SELECT * FROM challenge", function (err, result, fields) {
    if (req.session.loggedin) {
      res.render("update_challenge.hbs", { result });
    } else {
      res.send("Please login to view this page!");
    }
  });
});

app.post("/update-challenge/:id", (req, res) => {
  con.query("DELETE FROM challenge WHERE id = ?", [req.params.id], function (
    err,
    result,
    fields
  ) {
    if (req.session.loggedin) {
      res.redirect("/update-challenge");
    } else {
      res.send("Please login to view this page!");
    }
  });
});

app.post("/update_challenge", (req, res) => {
  console.log(req.body);

  var sql =
    "insert into challenge values (null, '" +
    req.body.name +
    "', '" +
    req.body.rating +
    "', '" +
    req.body.description +
    "', '" +
    req.body.image +
    "')";

  con.query(sql, function (err, result, fields) {
    if (err) throw err;
    res.redirect("/update-challenge");
  });
});

//Update Kaizo Routes

app.get("/update-kaizo", (req, res) => {
  con.query("SELECT * FROM kaizo", function (err, result, fields) {
    if (req.session.loggedin) {
      res.render("update_kaizo.hbs", { result });
    } else {
      res.send("Please login to view this page!");
    }
  });
});

app.post("/update-kaizo/:id", (req, res) => {
  con.query("DELETE FROM kaizo WHERE id = ?", [req.params.id], function (
    err,
    result,
    fields
  ) {
    if (req.session.loggedin) {
      res.redirect("/update-kaizo");
    } else {
      res.send("Please login to view this page!");
    }
  });
});

app.post("/update_kaizo", (req, res) => {
  console.log(req.body);

  var sql =
    "insert into kaizo values (null, '" + 
    req.body.name +
    "', '" +
    req.body.description +
    "', '" +
    req.body.difficutly +
    "', '" +
    req.body.rating +
    "', '" +
    req.body.time +
    "', '" +
    req.body.image +
    "')";

  con.query(sql, function (err, result, fields) {
    if (err) throw err;
    res.redirect("/update-kaizo");
  });
});

//Edit Challenge Routes

// app.get("/edit-challenge", (req, res) => {
//   if (req.session.loggedin) {
//     res.render("edit_challenge.hbs");
//   } else {
//     res.send("Please login to view this page!");
//   }
// });

app.post("/edit-challenge/:id", (req, res) => {
  con.query("SELECT * FROM challenge WHERE id = ?", [req.body.id], function (
    err,
    result,
    fields
  ) {
    if (req.session.loggedin) {
      var name = result[0].name;
      var rating = result[0].rating;
      var description = result[0].description;
      var image = result[0].image;
      res.render("edit_challenge.hbs", { name, rating, description, image });
    } else {
      res.send("Please login to view this page!");
    }
  });
});

//Listening Port

app.listen(PORT, () => console.log(`Server is starting on PORT ${PORT}`));
