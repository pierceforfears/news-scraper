// Dependencies
var express = require("express");
var mongoose = require("mongoose");
// Require axios and cheerio. This makes the scraping possible
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;
var MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Initialize Express
var app = express();
// Parse request body as JSON
app.unsubscribe(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://www.npr.org/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $(".story-wrap").each(function(index, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .find("h3.title")
        .text();
      result.summary = $(this)
        .find(".teaser")
        .text();
      result.link = $(this)
        .find("h3.title")
        .parent("a[href]")
        .attr("href");
      result.notes = [];
      // Create a new Article using the `result` object built from scraping
      if (result.title && result.link) {
        db.Article.countDocuments({ link: result.link }, function(err, count) {
          if (err) return console.log(err);
          if (!count) {
            // View the added result in the console
            db.Article.create(result, function(err, dbArticle) {
              // If an error occurred, log it
              if (err) return console.log(err);
              console.log(dbArticle);
            });
          }
        });
      }
    });
    res.sendStatus(204);
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  db.Article.find({}, function(err, dbArticles) {
    if (err) res.json(err);
    else res.json(dbArticles);
  });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .exec(function(err, dbArticle) {
      if (err) res.json(err);
      else res.json(dbArticle);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  db.Note.create({ body: req.body }, function(err, dbNote) {
    if (err) res.json(err);
    db.Article.findOneAndUpdate(
      { _id: req.params.id },
      { $push: { notes: dbNote } },
      { new: true },
      function(err, dbArticle) {
        if (err) res.json(err);
        else res.json(dbArticle);
      }
    );
  });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
