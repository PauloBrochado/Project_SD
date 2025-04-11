const proxy = require('express-http-proxy');

const app = require('express')();

const request = require('request');

const start_at = new Date();

function f1(req,resp, next){
  console.log( "f1 => name:", next.name, ", url:", req.url );
  next(  );
}


function f2(req,resp, next){
  console.log( "f2 => url:", req.url, ", path:",  req.path, ", params:", req.params, ", query:", req.query );
  next( );
}

// Defining backend servers
let servers = {
  "abc": {
    id: "abc",
    host: 'http://localhost:3100',
    proxy: proxy('http://localhost:3100'),
    usage: 0
  },
  "cde": {
    id: "cde",
    host: 'http://localhost:3200',
    proxy: proxy('http://localhost:3200'),
    usage: 0
  }
    };
function reDirect( req, resp, next ){

  //console.log( req ); 

  let id = req.query.id;
	
	console.log( "id:", id, "reDirect => url:", req.url, ", id:", id, ", path:",  req.path, ", params:", req.params, ", query:", req.query );

  let server = servers[ id ];

  if( ! server ){
  console.log( `Server with id "${id}" does not exist.` )
    return next( { error: "wrong server id" } );
  }
  else{
    server.usage++;
    //server.proxy( req, resp, next );
    server.proxy( req, resp, function( req, resp){
	  console.log( "************* resp *************" );
	  console.log( resp );
	  next( req, resp);
	});
  }
}

//app.use('/api', f1,reDirect, f2);
app.use('/api', reDirect);

app.use('/stat', function( req, resp, next ){
  let servers_a = Object.values( servers );
	let servers_n = servers_a.length;
	//console.log( servers_n, servers_a );
	let living_time_in_secs = Math.round( ( Date.now() - start_at.getTime() ) * 0.001 );
	let i= 0;
	let stat = [];
	for( i=0; i<servers_n; ++i ){
	  let server = servers_a[ i ];
	  stat.push( {
	    id: server.id,
	    host: server.host,
	    usage: server.usage
	    });
	}
	  console.table( stat );

	  resp.status(200).send( {
	    success: true,
            start_at: start_at.toISOString(),
            now: (new Date()).toISOString(),
	    living_time_in_secs,
	    stat } );
});

app.use(function(req, res, next) {
console.log('IN not found :', { url: req.url, query: req.query} );
  res.status(404).send( { error:404, message: 'not found' } );
});

app.listen(4000, () => {

  // test if servers are reachable from proxy server
  request( servers.abc.host, function (err, res, body) {
   if(err === null){
        console.log('frontend is reachable from proxy server')
   }
   else{
    console.log('frontend is NOT reachable from proxy server')

   }

  });

});
