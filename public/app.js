$.getJSON("/articles", function(data) {
  for (var i = 0; i < data.length; i++) {
    $("#articles").append(
      "<p data-id='" +
        data[i]._id +
        "'>" +
        data[i].title +
        "<br /><a href='" +
        data[i].link +
        "'>" +
        data[i].link +
        "</a>" +
        (data[i].summary ? "<br />" + data[i].summary : "") +
        "</p>"
    );
  }
});

$("#scrape").click(function(event) {
  event.preventDefault();
  $.get("/scrape", function(data, textStatus, jqXHR) {
    if (jqXHR.status === 204) {
      location.reload();
    }
  });
});

$(document).on("click", "p", function() {
  $("#notes").empty();
  var thisId = $(this).data("id");

  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  }).then(function(data) {
    console.log(data);
    $("#notes").append("<h2>" + data.title + "</h2>");
    $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
    $("#notes").append(
      "<button data-id='" + data._id + "' id='savenote'>Save Note</button>"
    );

    if (data.notes) {
      for (var i = 0; i < data.notes.length; i++) {
        $("#notes").append(data.notes[i].body + "<br />");
      }
    }
  });
});

$(document).on("click", "#savenote", function() {
  var thisId = $(this).data("id");

  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      body: $("#bodyinput").val()
    }
  }).then(function(data) {
    console.log(data);
    $("#notes").empty();
  });

  $("#bodyinput").val("");
});
