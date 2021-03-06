const
	express = require('express'),
	bodyParser = require('body-parser'),
	multer = require('multer')({dest:'./uploads'}),
	searchController = require.main.require('./controllers/api/v1/search'),
	searchPapersController = require.main.require('./controllers/api/v1/searchPapers'),
	articleController = require.main.require('./controllers/api/v1/articles'),
	searchWikiController = require.main.require('./controllers/api/v1/searchWiki'),
	wikiController = require.main.require('./controllers/api/v1/wiki'),
	commentsController = require.main.require('./controllers/api/v1/comments'),
	relatedDocumentsController = require.main.require('./controllers/api/v1/relatedDocs'),
	relatedDocsController = require.main.require('./controllers/api/v1/related-docs'),
	notifyNewDocsController = require.main.require('./controllers/api/v1/notifynewdoc'),
	userHistoryController = require.main.require('./controllers/api/v1/userHistory'),
	userRecommendationsController = require.main.require('./controllers/api/v1/user-recommendations'),
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
router.get('/articles/:id/comments', commentsController.getComments);
router.post('/articles', multer.array('fulltextfile', 10));
router.post('/articles', articleController.postArticle);
router.post('/articles/:id/comments', bodyParser.urlencoded({ extended: true }), commentsController.postComment);

router.post('/notifynewdoc', notifyNewDocsController.newDoc);

router.get('/related-docs', relatedDocsController.relatedDocs);
router.get('/relatedDocs', relatedDocumentsController.relatedDocuments);

router.post('/userHistory', bodyParser.json(), bodyParser.urlencoded({ extended: true }), userHistoryController.userHistory);

router.get('/user-recommendations', userRecommendationsController.userRecommendations);

module.exports = router;