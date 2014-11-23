var post = 
[{
	"title": "Hello",
	"content": "Today is Sunday"
},
{
	"title": "您好",
	"content": "今天是星期天"
}];


exposts.list = function(req, res){
	res.send(post);
};

exposts.create = function(req, res){

};
