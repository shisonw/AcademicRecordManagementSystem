var express = require('express');
var session = require('express-session')
var router = express.Router();
const { connectToDB, ObjectId } = require('../utils/db');

/* GET index page. */
router.get('/', function (req, res, next) {
  res.render('login');
});

/* GET login page. */
router.get('/login', async function (req, res, next) {
  console.log(req.session)
  console.log(req.sessionID)
  res.render('login');
});

/* POST index page. */
router.post('/login', async function (req, res, next) {
  const db = await connectToDB();
  try {
    let result = await db.collection("users").find({ username: req.body.username, password: req.body.password }).toArray();
    if (result.length === 0) {
      res.render('error', { message: 'Incorrect username or password' });
    } else {
      req.session.type = result[0].type;
      req.session.username = result[0].username;
      req.session.id = result[0]._id;
      if (result[0].type == "teacher" || result[0].type == "student") {
        req.session.classname = result[0].classname;
      } else {
        req.session.classname = "";
      }
      if (result[0].type == "student") {
        req.session.sid = result[0].sid;
      }
      res.redirect('/home');
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  } finally {
    await db.client.close();
  }
});

/* GET signup page. */
router.get('/signup', function (req, res, next) {
  res.render('signup');
});

/* POST signup page. */
router.post('/signup', async function (req, res, next) {
  const db = await connectToDB();
  try {
    console.log(req.body);
    let result = await db.collection("users").find({ username: req.body.username }).toArray();
    if (result.length === 0) {
      result = await db.collection("users").insertOne(req.body);
      res.redirect('/login');
    } else {
      res.status(400);
      res.render('error', { message: 'Username already exist' });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  } finally {
    await db.client.close();
  }
});

/* GET change password page. */
router.get('/changePassword', function (req, res, next) {
  res.render('change_password');
});


/* POST change password */
router.post('/changePassword', async function (req, res, next) {
  const db = await connectToDB();
  let result;
  try {
    result = await db.collection("users").find({ username: req.body.username, password: req.body.password }).toArray();
    if (result.length === 0) {
      res.render('error', { message: 'Incorrect username or password' });
    } else {
      result = await db.collection("users").updateOne({ username: req.body.username }, { $set: { password: req.body.newPassword } });
      res.render('home', { popupMessage: "CHANGE_PASSWORD_SUCCESS" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  } finally {
    await db.client.close();
  }
});

/* GET forget password page. */
router.get('/forgetPassword', function (req, res, next) {
  res.render('forget_password');
});

/* POST change password */
router.post('/forgetPassword', async function (req, res, next) {
  const db = await connectToDB();
  let result;
  try {
    result = await db.collection("users").find({ username: req.body.username, hkid: req.body.hkid }).toArray();
    if (result.length === 0) {
      res.render('error', { message: 'Incorrect username or hkid' });
    } else {
      result = await db.collection("users").updateOne({ username: req.body.username }, { $set: { password: req.body.password } });
      res.render('login', { popupMessage: "CHANGE_PASSWORD_SUCCESS" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  } finally {
    await db.client.close();
  }
});

/* GET logout page. */
router.get('/logout', function (req, res, next) {
  req.session.destroy(() => {
    console.log('session destroyed')
  })
  res.render('login');
});

/* GET home page. */
router.get('/home', async function (req, res, next) {
  if (!req.session.username) {
    return res.render('login');
  }
  const db = await connectToDB();
  try {
    let classes = await db.collection("classes").find().toArray();
    console.log(classes[1].students);
    res.render('home', { classes: classes, type: req.session.type, username: req.session.username, classname: req.session.classname, userId: req.session.id, sid: req.session.sid });
  } catch (err) {
    res.status(400).json({ message: err.message });
  } finally {
    await db.client.close();
  }
});


/* GET classes page. */
router.get('/class/:id', async function (req, res, next) {
  if (!req.session.username) {
    return res.render('login');
  }
  const db = await connectToDB();
  try {
    let classes = await db.collection("classes").find().toArray();
    let targetClass = await db.collection("classes").find({ _id: new ObjectId(req.params.id) }).toArray();
    console.log(targetClass);
    let students = null;
    if (req.query.searchText) {
      students = await db.collection("students").find({ sid: { $in: targetClass[0].students }, sname: { $regex: req.query.searchText } }).toArray();
    } else {
      students = await db.collection("students").find({ sid: { $in: targetClass[0].students } }).toArray();
    }
    console.log(students)
    res.render('class', { classes: classes, students: students, targetClass: targetClass[0], type: req.session.type, username: req.session.username, classname: req.session.classname, userId: req.session.id, sid: req.session.sid });
  } catch (err) {
    res.status(400).json({ message: err.message });
  } finally {
    await db.client.close();
  }
});


/* POST classes page. */
router.post('/class/:id', async function (req, res, next) {
  if (!req.session.username) {
    return res.render('login');
  }
  const db = await connectToDB();
  try {
    let result = await db.collection("students").insertOne(req.body);
    console.log(req.body.sid);
    if (result) {
      result = await db.collection("classes").updateOne({ _id: new ObjectId(req.params.id) }, { $push: { students: req.body.sid } });
      console.log(result);
    }
    let classes = await db.collection("classes").find().toArray();
    let targetClass = await db.collection("classes").find({ _id: new ObjectId(req.params.id) }).toArray();
    console.log(targetClass[0].students)
    let students = await db.collection("students").find({ sid: { $in: targetClass[0].students } }).toArray();
    console.log(students)
    res.render('class', { classes: classes, students: students, targetClass: targetClass[0], type: req.session.type, username: req.session.username, classname: req.session.classname, userId: req.session.id, sid: req.session.sid });
  } catch (err) {
    res.status(400).json({ message: err.message });
  } finally {
    await db.client.close();
  }
});


/* GET classes page. */
router.get('/student/:id/:sid', async function (req, res, next) {
  if (!req.session.username) {
    return res.render('login');
  }
  const db = await connectToDB();
  try {
    let classes = await db.collection("classes").find().toArray();
    let targetClass = await db.collection("classes").find({ _id: new ObjectId(req.params.id) }).toArray();
    let students = await db.collection("students").find({ sid: { $in: targetClass[0].students } }).toArray();
    let student = await db.collection("students").find({ _id: new ObjectId(req.params.sid) }).limit(1).toArray();
    if (student) {
      res.render('student', { classes: classes, students: students, targetStudent: student, classid: req.params.id, type: req.session.type, username: req.session.username, classname: req.session.classname, userId: req.session.id, sid: req.session.sid });
    } else {
      res.status(404).json({ message: "Event not found" });
    }

  } catch (err) {
    res.status(400).json({ message: err.message });
  } finally {
    await db.client.close();
  }
});

/* POST student page. */
router.post('/student/:id/:sid', async function (req, res, next) {
  if (!req.session.username) {
    return res.render('login');
  }
  const db = await connectToDB();
  try {

    let classes = await db.collection("classes").find().toArray();
    let targetClass = await db.collection("classes").find({ _id: new ObjectId(req.params.id) }).toArray();
    let students = await db.collection("students").find({ sid: { $in: targetClass[0].students } }).toArray();
    result = await db.collection("students").updateOne({ _id: new ObjectId(req.params.sid) }, { $push: { tests: req.body } });
    let student = await db.collection("students").find({ _id: new ObjectId(req.params.sid) }).limit(1).toArray();
    if (student) {
      res.render('student', { classes: classes, students: students, targetStudent: student, classid: req.params.id, type: req.session.type, username: req.session.username, classname: req.session.classname, userId: req.session.id, sid: req.session.sid });
    } else {
      res.status(404).json({ message: "Event not found" });
    }

  } catch (err) {
    res.status(400).json({ message: err.message });
  } finally {
    await db.client.close();
  }
});

router.get('/teacher', async function (req, res, next) {
  if (!req.session.username) {
    return res.render('login');
  }
  const db = await connectToDB();
  try {
    let classes = await db.collection("classes").find().toArray();
    let teachers = await db.collection("users").find({ type: "teacher" }).toArray();
    console.log(teachers);
    res.render('teacher', { teachers: teachers, classes: classes, type: req.session.type, username: req.session.username, classname: req.session.classname, userId: req.session.id, sid: req.session.sid });
  } catch (err) {
    res.status(400).json({ message: err.message });
  } finally {
    await db.client.close();
  }
});

router.post('/teacher', async function (req, res, next) {
  if (!req.session.username) {
    return res.render('login');
  }
  console.log(req.body);
  const db = await connectToDB();
  try {
    let result = await db.collection("users").updateOne({ username: req.body.username }, { $set: { classname: req.body.class } });
    let classes = await db.collection("classes").find().toArray();
    let teachers = await db.collection("users").find({ type: "teacher" }).toArray();
    console.log(teachers);
    res.render('teacher', { teachers: teachers, classes: classes, type: req.session.type, username: req.session.username, classname: req.session.classname, userId: req.session.id, sid: req.session.sid });
  } catch (err) {
    res.status(400).json({ message: err.message });
  } finally {
    await db.client.close();
  }
});



module.exports = router;
