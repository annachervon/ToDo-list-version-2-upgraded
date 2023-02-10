//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require('dotenv').config()


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
//where we are connecting to: our db will be stored locally on post 27017 and a db name is: todolistDB

mongoose.connect(process.env.PASSWORD, {useNewUrlParser: true});

//mongoose.connect("mongodb://localhost:27017/test?authSource=admin", {user: '', pass: ''});
//or locally
//mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});


const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Why no name?']
  }
})


//mongoose model is capitalized
const Item = mongoose.model('Item', itemsSchema);


const task1= new Item({
  name: "Complete the current block"
//  description: "Finalize"
});

const task2 = new Item({
  name: "Review asynchronous functions in js"
//  description: "Update"
});

const task3 = new Item({
  name: "Review passport middleware documentation"
//  description: "Update"
});
const defaultItems = [task1, task2, task3];
const customItems = [];
const listSchema = {
  name: String,
  items: [itemsSchema]
};

 const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if (err){
          console.log("Couldn't add to the database");
        } else {
          console.log("Successfully added to the db");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

List.findOne({name: customListName}, function(err, foundList){
  if(!err){
    if(!foundList){
      const list = new List({
        name: customListName,
        items: customItems
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  }
});

});

app.post("/", function(req, res){
    //title of the ToDo list:
  const listName = req.body.list;
  const itemName = req.body.newItem;
//create new document
  const item  = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName );
    });
  }
});

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;

  const listName = req.body.listName;
  if(listName === "Today"){
  Item.findByIdAndRemove(checkedItemId, function(err){
    if(!err){
      console.log("Successfully deleted from the list");
      res.redirect("/");
    }
  });
} else {
   List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
     if(!err){
       res.redirect("/" + listName);
     }
   });
}

})


// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
