const
	express = require('express'),
	bodyParser = require('body-parser'),
	multer = require('multer')({dest:'./uploads'}),
	searchController = require.main.require('./controllers/api/v1/search'),
	searchPapersController = require.main.require('./controllers/api/v1/searchPapers');
	articleController = require.main.require('./controllers/api/v1/articles'),
	searchWikiController = require.main.require('./controllers/api/v1/searchWiki'),
	wikiController = require.main.require('./controllers/api/v1/wiki'),
	commentsController = require.main.require('./controllers/api/v1/comments'),
	authRouter = require('./auth'),
	userRouter = require('./user'),
	usersRouter = require('./users');

var router = express.Router();

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/users', usersRouter);

router.get('/search', searchController.index);
router.get('/searchPapers', searchPapersController.searchPapers);
router.get('/searcWiki', searchWikiController.searchWiki);
router.get('/wiki/:id', wikiController.getWiki);

router.get('/articles/:id', articleController.getArticle);
router.get('/articles/:id/:version(v\\d+)', articleController.getArticle);
router.post('/articles', multer.array('fulltextfile', 10));
router.post('/articles', articleController.postArticle);

router.get('/comments/:id', commentsController.getComments);
router.post('/comments', commentsController.postComments);

module.exports = router;


