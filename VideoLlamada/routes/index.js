
/*
 * GET home page.
 */

exports.index = function(req, res){
	var error=false;
	var token=req.params.token;
	//console.log(token);
	var sToken=new Buffer(token, 'base64').toString();
	//console.log(sToken);
	
	try {
		var obj = JSON.parse(sToken);
    } catch(e) {
    	error=true;
        console.log("error al crear el objeto json")
    }
    if(error){
    	res.render('error', {mensaje:""});
    }else{
    	res.render('index', obj);
    }
  
};

exports.error = function(req, res){

	res.render('error', {mensaje:""});
    
  
};