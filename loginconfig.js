const localst=require("passport-local").Strategy;
const {authenticate}=require("passport");
const{pool}=require('./dbconfig');
const bcrypt=require("bcrypt");
function initialize(passport){
    const authenticateuser=(email,password,done)=>{
        pool.query(
            `SELECT * FROM users WHERE email = $1 `,[email],(err,result)=>{
                if(err){throw err};
                console.log(result.rows);
                if(result.rows.length>0){
                    const user=result.rows[0];
                    bcrypt.compare(password,user.password,(err,ismatch)=>{
                        if(err){throw err}
                        if(ismatch){return done(null,user)}
                        else{return done(null,false,{message:"Password is Incorrect"})}
                    })
                }
                else{
                    return done(null,false,{message:"Email is not registered"})
                }
            }
        )
    }
    passport.use(new localst({
        usernameField:"email",
        passwordField:"password"
    }, authenticateuser
))
passport.serializeUser((user,done)=>done(null,user.id));
passport.deserializeUser((id,done)=>{
    pool.query(
        `SELECT * FROM users WHERE id = $1`,[id],(err,result)=>{
            if(err){throw err}
            return done(null,result.rows[0]);
        }
    )
})
}
module.exports=initialize