var post = 
[{
	"title": "Hello",
	"content": "Today is Sunday"
},
{
	"title": "您好",
	"content": "今天是星期天"
}];


exports.list = function(req, res){
	res.send(post);
};

exports.create = function(req, res){

};
