/**
 PUT ./1/post/:postId/pay
**/

var events = require('events');
var express = require('express');
var router = express.Router();

// Paypal
var paypal_api = require('paypal-rest-sdk');

var config_opts = {
	'host': 'api.sandbox.paypal.com',
	'port': '',
	'client_id': 'AVzvdxDZOS-z4hRR01b_ObkUUmwFkeqDNxi-UenBwY3_HIH-MJNIX68XZENx',
	'client_secret': 'EGWUYRAuWXbs5EdtM9cMhNol6bsmaagGorBI0bVQp3g5-n8hdMZKEQ6SzTwZ'
};

router.put('/1/post/:postId/pay', function(req, res, next){
	var workflow = new events.EventEmitter();
	var postId = req.params.postId;
	var posts = req.app.db.model.Post;
	var payerId = req.query.PayerID;
	var paymentId;


	workflow.outcome = {
		success: false
	};

	workflow.on('validate', function(){
		posts
		.findOne({ _id: postId})
		.exec(function(err, post){
			if (err) {
				workflow.outcome.data = { error_description: err };
				return workflow.emit('response');
			}

			if (!post) {
				// product not exist
				workflow.outcome.data = { error_description: 'product does not exist' };
				return workflow.emit('response');
			}

			workflow.paymentId = post.order[0].paypal.id;

			workfolw.emit('executePayment');
		});
	});

	workflow.on('executePayment', function(){
		paypal_api.configure(config_opts);

		paypal_api.payment.execute(workflow.paymentId, { payer_id: payerId}, function(err, payment){
			if(err) {
				workflow.outcome.data = { error_description: err };
				return workflow.outcome.emit('response');
			}

			workflow.outcome.data = payment;
			workflow.outcome.emit('updatePost');
		});
	});
	
	workflow.on('updatePost', function(){

		posts
		.findByIdAndUpdate(postId, { $addToSet: { customers: req.user._id } }, function(err, post){
			workflow.outcome.success = true;
			workflow.emit('response');
		});
	});

	workflow.on('response', function(){
		return res.send(workflow.outcome);
	});
	
	return workflow.emit('validate');
});

module.exports = router;



