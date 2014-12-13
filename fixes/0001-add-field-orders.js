{
	var db = connect('localhost/booklog2');

	db.posts.find().forEach(function(post) {
		print("Fixing..." + post._id);
		post.orders = [];
		db.posts.save(post);
	});

	print("Info: 0001-add-field-orders finished.");
}