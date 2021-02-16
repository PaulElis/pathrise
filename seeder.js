const fs = require("fs");
const parse = require("csv-parse");
const mongoose = require("mongoose");
const colors = require("colors");
const dotenv = require("dotenv");
const csvtojson = require("csvtojson");
const csvfilepath = "job_opportunities.csv";

// Load env variables
dotenv.config({ path: "./config/config.env" });

// Load models
const Opportunity = require("./models/Opportunity");

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});

// Create JSON file
const createJsonFile = () => {
  csvtojson()
    .fromFile(csvfilepath)
    .then(jsonObj => {
      console.log("jsonObj: ", jsonObj);

      fs.writeFileSync(
        "output.json",
        JSON.stringify(jsonObj),
        "utf-8",
        function (err) {
          console.log("err: ", err);
        }
      );
    });
};

// Import into DB
const importData = async () => {
  let opportunites = JSON.parse(fs.readFileSync("output.json", "utf-8"));
  opportunites = cleanData(opportunites);

  console.log("parsed opportunites: ", opportunites);
  try {
    await Opportunity.create(opportunites);

    console.log("Data imported...".green.inverse);
    process.exit();
  } catch (error) {
    console.error(error);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await Opportunity.deleteMany();

    console.log("Data destroyed...".red.inverse);
    process.exit();
  } catch (error) {
    console.error(error);
  }
};

// Clean up data keys
const cleanData = data => {
  data.map(obj => {
    if (obj.hasOwnProperty("ID (primary key)")) {
      obj["primary_key"] = obj["ID (primary key)"];
      delete obj["ID (primary key)"];
    }
    if (obj.hasOwnProperty("Job Title")) {
      obj["job_title"] = obj["Job Title"];
      delete obj["Job Title"];
    }
    if (obj.hasOwnProperty("Company Name")) {
      obj["company_name"] = obj["Company Name"];
      delete obj["Company Name"];
    }
    if (obj.hasOwnProperty("Job URL")) {
      obj["job_url"] = obj["Job URL"];
      delete obj["Job URL"];
    }
    obj["job_source"] = "";
  });
  return data;
};

if (process.argv[2] === "-i") {
  importData();
} else if (process.argv[2] === "-d") {
  deleteData();
} else if (process.argv[2] === "-c") {
  createJsonFile();
}
