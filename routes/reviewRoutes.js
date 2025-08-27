const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');
const setTourUserIds = require('../middlewares/setTourUserIds');

const router = express.Router({ mergeParams: true });

// router.param('id', tourController.checkID);

router
  .route('/')
  .get(reviewController.getAllreviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    setTourUserIds,
    reviewController.createReview,
  );

router
  .route('/:id')
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview)
  .get(reviewController.getReview);

module.exports = router;
