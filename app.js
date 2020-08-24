const express = require('express');
const bodyParser = require('body-parser');
const date = require(__dirname+'/date.js');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

mongoose.connect("mongodb://localhost:27017/todolistDB",{
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const itemsSchema = new mongoose.Schema({
    name: String
});

const Items = mongoose.model("Item", itemsSchema);

const item1 = new Items({
    name: "Get Vegetables"
});

const item2 = new Items({
    name: "Cook Food"
});

const item3 = new Items({
    name: "Eat Food"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/",function(req,res){
    const day = date.getDate();

    Items.find(function(err,data){
        if(data.length === 0){
            Items.insertMany(defaultItems, function(err){
                if(err){
                    console.log(err);
                }
                else{
                    console.log("Items added successfully!");
                }
            });
            res.redirect("/");
        }
        else{
            res.render('list',{
                listTitle: day,
                newListItems: data
            });
        }
    });
});

app.post("/",function(req,res){
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const addItem = new Items({
        name: itemName
    });

    const day = date.getDate();

    if(listName === day){
        addItem.save();
        res.redirect("/");
    }
    else{
        List.findOne({name: listName}, function(err,data){
            if(!err){
                data.items.push(addItem);
                data.save();
                res.redirect("/" + listName);
            }
        })
    }
});

app.post("/delete", function(req,res){
    const checkItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === date.getDate()){
        Items.findByIdAndRemove(checkItemId, function(err){
            if(!err){
                console.log("Successfully deleted checked item!");
                res.redirect("/");
            }
        });
    }
    else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkItemId}}}, function(err, data){
            if(!err){
                res.redirect("/" + listName);
            }
        });
    }
});

app.get("/:pageName",function(req,res){
    const customListName = _.capitalize(req.params.pageName);

    List.findOne({name: customListName},function(err,data){
        if(!err){
            if(data){
                res.render("list",{
                    listTitle: data.name,
                    newListItems: data.items
                });
            }
            else{
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();

                res.redirect("/" + customListName);
            }
        }
    });
});

app.get("/about",function(req,res){
    res.render("about");
});

app.listen(3000,function(){
    console.log("Server is running on port 3000");
});