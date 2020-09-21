const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const express = require('express')
const hbs = require('hbs')
const path = require('path')
var admin = require('firebase-admin')
const bodyparser = require("body-parser")

var serviceAc = require('../firebase-key.json')

admin.initializeApp({
    credential: admin.credential.cert(serviceAc),
    databaseURL: "https://home-automation-a274b.firebaseio.com"
})

var firebase = require('firebase/app');
require('firebase/auth');
require('firebase/database');

firebase.initializeApp({
  apiKey: "AIzaSyCWYOfE91eaABu2LeVJogz-j9Y1Qyu6iXM",
  authDomain: "home-automation-a274b.firebaseapp.com",
  databaseURL: "https://home-automation-a274b.firebaseio.com",
  projectId: "home-automation-a274b",
  storageBucket: "home-automation-a274b.appspot.com",
  messagingSenderId: "578331922850",
  appId: "1:578331922850:web:9906cfb1b4a68385de22fb",
  measurementId: "G-495MQ2P0HP"
});

const app = express()
const port = process.env.PORT || 3000

// Define paths for Express config
const publicDirPath = path.join(__dirname, "../public")
const viewPath = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials') 

app.use(bodyparser.urlencoded({extended : false}))
app.use(express.json())
app.use(cookieParser())

// Setup handlebars engine & views location
app.set('view engine', 'hbs')
app.set('views', viewPath)
hbs.registerPartials(partialsPath)

// Setup static directory to serve
app.use(express.static(publicDirPath))
  
app.get("/login", function (req, res) {
  res.render("login");
});
  
app.get("/register", function (req, res) {
  res.render("register");
});

  
app.get("/", function (req, res) {
  res.redirect("/login")
});

app.post('/register', (req, res) => {
  let email= req.body.email;
  let password= req.body.password;
  let confirm_password= req.body.cnfPassword;
  if(password===confirm_password){
      admin.auth().createUser({
          email: email,
          password: password
        })
          .then(function(userRecord) {
            firebase.database().ref('users/' + userRecord.uid).update({
              email : email,
              ledOne : 0,
              ledTwo : 0,
              ldr : 0,
              ultrasonic : {
                valueFirst: 0,
                valueSecond: 0,
                valueThird: 0,
                valueFourth: 0,
                valueFifth: 0
              },
              servo: 45
            })
            res.render('login',{
              message: 'Login with same credentials'
              }); 
          })
          .catch(function(error) {
            console.log('Error creating new user:', error.errorInfo.message);
              res.render('register',{
                  message: error.errorInfo.message
              });
          });
  }
  else{
      res.render('register',{
          message: "Password doesn't match"
      });
  }
});
app.get('/sessionLogin', (req, res) => {
  // Get the ID token passed and the CSRF token.
  const idToken = req.query.token.toString();
  
  const expiresIn = 60 * 60* 24 * 1000 * 5;
  admin.auth().createSessionCookie(idToken, {expiresIn})
    .then((sessionCookie) => {
     const options = {maxAge: expiresIn, httpOnly: true};
     res.cookie('session', sessionCookie, options);

     res.redirect('/dashboard');
    })
    .catch(error => {
     res.status(401).send('UNAUTHORIZED REQUEST!');
    });
});

app.get('/dashboard',(req, res) => {  //Protected route
  //console.log(firebase.auth().currentUser);
  try{
      const sessionCookie= req.cookies.session;
      admin.auth().verifySessionCookie(sessionCookie, true /** checkRevoked */).then((decodedClaims) => {
              res.render('dashboard',{
                  uid: decodedClaims.user_id,
                  email: decodedClaims.email  
              });
          })
          .catch(error => {
            console.log(error);
            res.redirect('/login');
          });    
  }
  catch(err){
      return res.status(401).render('login',{  //401 Unauthorized Accesss
          message: 'Token expired or tampered'
      }); 
  }
  
});

app.get('/logout', function(req, res) {
  res.clearCookie('session');
  res.redirect('/login');
});
app.listen(port, () =>{
    console.log("Server is on port "+ port)
})