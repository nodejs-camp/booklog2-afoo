/**
 PUT ./1/post/:postId/pay
**/

var events = require('events');
var express = require('express');
var router = express.Router();

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

	workflow.outcome = {
		success: false
	};

	workflow.on('validate', function(){
		workflow.emit('createPayment');
	});

	workflow.on('createPayment', function(){
		paypal_api.configure(config_opts);

		var create_payment_json = {
			intent: 'sale',
			payer: {
				'payment_method': 'paypal'
			},
			transctions: [{
				amount: {
					currency: 'TWD',
					total: 99
				},
				description: '購買教學文章'
			}],
			redirect_urls: {
				// http://localhost:3000/1/post/
				return_url: 'http://localhost:3000/1/post' + postId + '/paid',
				cancel_url: 'http://localhost:3000/1/post' + postId + '/cancel' 
			}
		},

		paypal_api.payment.create(create_payment_json, function(err, payment){
			if(err){
				console.log(err);
			}

			if(payment){
				console.log("Create Payment Response");
				console.log(payment);
			}

			var order = {
				userId: req.user._id,
				paypal: payment
			};

			posts.findByIdAndUpdate(postId, { $addToSet: { orders: order } }, function(err, post){
				workflow.outcome.success = true;
				workflow.outcome.data = post;

				workflow.emit('response');
			});
		});
	});

	workflow.on('response', function(){
		return res.send(workflow.outcome);
	});
	
	return workflow.emit('validate');
});

module.exports = router;