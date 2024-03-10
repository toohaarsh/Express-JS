var express = require('express');
var router = express.Router();
var userModel = require('./users')
var postModel = require('./posts')
var passport = require('passport')
var upload = require('./multer')


var localstrategy = require('passport-local')
passport.use(new localstrategy(userModel.authenticate()))


router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' })
});

router.get('/login', function (req, res, next) {
  res.render('login', { error: req.flash('error') })
});

router.get('/profile', isLoggedIn, async function (req, res, next) {
  let user = await userModel.findOne({
    username: req.session.passport.user
  })
    .populate('posts')
    console.log(user)
  res.render('profile', { user })
})

router.post("/register", function (req, res) {
  const userData = new userModel({
    username: req.body.username,
    fullname: req.body.fullname,
    email: req.body.email
  })
  userModel.register(userData, req.body.password)
    .then(function () {
      passport.authenticate("local")(req, res, function () {
        res.redirect('/profile')
      })
    })
})

router.post("/login", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash: true
}), function (req, res) {
})

router.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) { return next(err) }
    res.redirect('/login')
  })
})

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next()
  res.redirect('/')
}

router.get('/feed', function (req, res, next) {
  res.render('feed')
});

// router.post('/upload', isLoggedIn, upload.single('file'), async function (req, res, next) {
//   if (!req.file) {
//     return res.status(404).send('No file found');
//   }
//   const user = await userModel.findOne({ username: req.session.passport.user })
//   const post = await postModel.create({
//     image: req.file.filename,
//     imageText: req.body.filecaption,
//     user: user._id
//   })

//   user.posts.push(post._id)
//   await user.save()
//   res.redirect('/profile')
// });

router.post('/fileupload', isLoggedIn, upload.single('image'), async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user })
  user.profileImage = req.file.filename
  await user.save()
  res.redirect('/profile')
})

router.get('/add', isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user })
  res.render("add")
})

router.post('/createpost', isLoggedIn, upload.single("image"), async function (req, res, next) {
  let user = await userModel.findOne({
    username: req.session.passport.user
  })
  const post = await postModel.create({
    image: req.file.filename,
    title: req.body.title,
    description: req.body.description ,
    user: user._id
  })
  console.log(post._id)
  user.posts.push(post._id)
  await user.save()
  console.log(post.image)
  res.redirect('/profile')
})

router.get('/show/posts', isLoggedIn, async function (req, res, next) {
  let user = await userModel.findOne({
    username: req.session.passport.user
  })
    .populate('posts')
    
  res.render('show', { user })
})

module.exports = router;