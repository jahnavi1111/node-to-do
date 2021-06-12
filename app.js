//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs'); //to use EJS templates

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public")); //to render static files from the public folder

mongoose.connect("mongodb+srv://admin-jahnavi:test123@cluster0.wcyk6.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your To-Do list "
});

const item2 = new Item({
  name: "The + button is to add an item"
});

const item3 = new Item({
  name: "<-- To delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){
    if(err){
      console.log(err);
    }else if(foundItems.length === 0){
      Item.insertMany( defaultItems, function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Successfully saved default items to DB");
        }
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });


  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+ listName);
    });
  }


});

app.post("/delete", function(req, res){

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){ //to remove, have to provide callback
      if(err){
        console.log(err);
      }else{
        console.log("Successfully deleted checked item");
      }
    });
    res.redirect("/");
  }else{
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/"+ listName);
      }else{
        console.log(err);
      }
    });
  }
});

app.get('/:customListName', function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
       if(!foundList){
      //creating a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    }else{
      //show an existing list
      res.render("list", {listTitle: customListName, newListItems: foundList.items});
    }}else{
      console.log(err);
    }
  });
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
