const
	express = require('express'),
	bodyParser = require('body-parser'),
	multer = require('multer')({dest:'./uploads'}),
	searchController = require.main.require('./controllers/api/v1/search'),
	articleController = require.main.require('./controllers/api/v1/articles'),
	authRouter = require('./auth'),
	userRouter = require('./user'),
	usersRouter = require('./users');

var router = express.Router();

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/users', usersRouter);

router.get('/search', searchController.index);

router.get('/articles/:id', articleController.getArticle);
router.post('/articles', multer.array('fulltextfile', 10));
router.post('/articles', articleController.postArticle);




module.exports = router;


