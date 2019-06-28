const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const nodemailer = require("nodemailer"),
  transporter = nodemailer.createTransport({
    host: "smtp.zoho.in",
    port: 465,
    secure: true,
    auth: {
      user: "hello@cynthesize.co",
      pass: process.env.EMAIL_PASS
    }
  }),
  EmailTemplate = require("email-templates").EmailTemplate,
  path = require("path"),
  Promise = require("bluebird");
app.use(bodyParser.json());

function sendEmail(obj) {
  return transporter.sendMail(obj);
}

function loadTemplate(templateName, contexts) {
  let template = new EmailTemplate(
    path.join(__dirname, "templates", templateName)
  );

  return Promise.all(
    contexts.map(context => {
      return new Promise((resolve, reject) => {
        template.render(context.new, (err, result) => {
          if (err) reject(err);
          else
            resolve({
              email: result,
              context
            });
        });
      });
    })
  );
}

function echo(payload) {

  if (payload.trigger.name === "test") {
    let responseBody = "";

    if (payload.event.op === "INSERT") {
      responseBody = `New user ${payload.event.data.new.id} inserted, with data: ${
        payload.event.data.new.name
        }`;

      loadTemplate("welcome", [payload.event.data])
        .then(results => {
          return Promise.all(
            results.map(result => {
              sendEmail({
                to: result.context.new.email,
                from: "hello@cynthesize.co",
                subject: result.email.subject,
                html: result.email.html,
                text: result.email.text
              });
            })
          );
        })
        .catch(e => {
          console.log("Error Found: ", e);
        });
    } else if (payload.event.op === "UPDATE") {
      responseBody = `User ${payload.event.data.new.id} updated, with data: ${
        payload.event.data.new.name
        }`;
    } else if (payload.event.op === "DELETE") {
      responseBody = `User ${payload.event.data.old.id} deleted, with data: ${
        payload.event.data.old.name
        }`;
    }

    return responseBody;
  }

  else if (payload.trigger.name === "add_project") {
    let responseBody = "";

    if (payload.event.op === "INSERT") {
      responseBody = `New project ${payload.event.data.new.id} inserted, with data: ${
        payload.event.data.new.project_name} with senderEmail: ${payload.event.session_variables['x-hasura-email'] 
        }`;

      loadTemplate("Add_Project", [payload.event])
        .then(results => {
          return Promise.all(
            results.map(result => {
              sendEmail({
                to: result.context.session_variables['x-hasura-email'],
                from: "hello@cynthesize.co",
                subject: result.email.subject,
                html: result.email.html,
                text: result.email.text
              });
            })
          );
        })
        .catch(e => {
          console.log("Error Found: ", e);
        });
    } else if (payload.event.op === "UPDATE") {
      responseBody = `User ${payload.event.data.new.id} updated, with data: ${
        payload.event.data.new.project_name
        }`;
    } else if (event.op === "DELETE") {
      responseBody = `User ${payload.event.data.old.id} deleted, with data: ${
        payload.event.data.old.project_name
        }`;
    }

    return responseBody;
  }

}


app.post("/", function (req, res) {
  try {
    let payload = req.body;
    let result = echo(payload);

    res.json(result);
  } catch (e) {

    console.log(e);
    res.status(500).json(e.toString());
  }
});

app.post("/addproject", function (req, res) {
  try {
    let payload = req.body;
    let result1 = echo(payload);

    res.json(result1);
    // console.log(res);
  } catch (e) {

    console.log(e);
    res.status(500).json(e.toString());
  }
});

app.get("/", function (req, res) {
  res.send("Hello World - For Add User Event Triggers, try a POST request?");
});

app.get("/addproject", function (req, res) {
  res.send("Hello World - For Add Project Event Triggers, try a POST request?");

});

let server = app.listen(process.env.PORT || 5000, function(err) {
  if(!err) {
    console.log("Server Listening on PORT " + server.address().port);
  } else {
    console.log(err);
  }
});
