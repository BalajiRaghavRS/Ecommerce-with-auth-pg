const express=require('express');
const app=express();
const bcrypt=require("bcrypt")
const {pool} =require("./dbconfig")
const session=require("express-session")
const flash=require("express-flash")
const passport=require("passport");
app.use(express.static(__dirname + '/public'));
const port=process.env.port|| 3000;
app.set('view engine',"ejs");
app.use(session({secret:'secret',resave:false,saveUninitialized:false}))
app.use(flash());
app.use(express.urlencoded({extended:false}))
app.use(passport.session())
app.use(passport.initialize())
const initializepassport=require('./loginconfig')
initializepassport(passport);
app.get("/",(req,res)=>{
    res.render("index");
})


app.get("/user/products", (req, res) => {
    const products = [
        { name: 'Watch', price: 50 },
        { name: 'Flask', price: 20 },
        { name: 'Shoes', price: 75 },
        { name: 'Tees', price: 30 },
    ];
    res.render("products", { products });
});
app.get("/user/payment",notauth ,(req, res) => {
    const { name, price } = req.query;
    res.render("payment", { name, price });
});
app.post('/completepayment', (req, res) => {
    res.send('Payment completed successfully');
});


app.get("/user/register",checkauthen,(req,res)=>{
    res.render("register")
})
app.get("/user/login",checkauthen,(req,res)=>{
    res.render("login")
})
app.get("/user/home",notauth,(req,res)=>{
    res.render("home",{user:req.user.name})
})
app.get("/user/logout",(req,res,next)=>{
    req.logOut(function(err){
        if(err){
            return next(err)
        }
        req.flash("success_msg","You have logged out")
        res.redirect("/")
    })   
})
app.post("/user/register",async (req,res)=>{
    let {name,email,password,password2}=req.body
    console.log(name,email,password,password2);
    let errors=[];
    if(!name||!email||!password||!password2){
        errors.push({message:"Please enter all fields"});
    }
    if(password.length<6){
        errors.push({message:"Password should be atleast 6 characters"})
    }
    if(password!=password2){
        errors.push({message:"Passwords do not match"})
    }
    if(errors.length>0){
        res.render("register",{errors});
    }
    else{
        let hashedpass=await bcrypt.hash(password,10);
        console.log(hashedpass);
        pool.query(
            `SELECT * FROM users WHERE email=$1`,[email],(err,result)=>{
                if(err){throw err}
                console.log(result.rows);
                if(result.rows.length>0){
                    errors.push({message: "Email already there"})
                    res.render("register",{errors})
                }
                else{
                    pool.query(`INSERT INTO users(name,email,password) VALUES ($1,$2,$3) RETURNING id,password`,
                        [name,email,hashedpass],(err,result)=>{
                            if(err){throw err}
                            console.log(result.rows);
                            req.flash("success_msg","You are registered,please log in")
                            res.redirect("/user/login")
                        }
                    )
                }
            }
        )
    }
})
app.post("/user/login",passport.authenticate("local",{
    successRedirect:"/user/home",
    failureRedirect:"/user/login",
    failureFlash:true
}))
function checkauthen(req,res,next){
    if(req.isAuthenticated()){
        return res.redirect("/user/home")
    }
    next();
}

function notauth(req,res,next){
    if(req.isAuthenticated()){
        return next()
    }
    res.redirect("/user/login")
}

app.listen(port,()=>{
    console.log(`server is on ${port}`);    
})