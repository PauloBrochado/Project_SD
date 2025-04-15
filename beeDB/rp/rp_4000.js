const proxy = require('express-http-proxy');

const app = require('express')();

const request = require('request');

const start_at = new Date();

// Check if we're running in Docker or locally
const isDocker = process.env.DOCKER_ENV === 'true';

//const getHost = (prefix, port) => `http://${prefix}-${Math.floor(port / 1000)}: ${port}`;

function f1(req,resp, next){
  console.log( "f1 => name:", next.name, ", url:", req.url );
  next(  );
}


function f2(req,resp, next){
  console.log( "f2 => url:", req.url, ", path:",  req.path, ", params:", req.params, ", query:", req.query );
  next( );
}

// Define servers configuration based on environment
let servers = {};

if (isDocker) {
  // Docker environment configuration
  servers = {
    "dn0_3000": {
      id: "dn0_3000",
      host: 'http://dn0-0:3000',
      proxy: proxy('http://dn1-0:3100'),
      usage: 0
    },
    "dn0_3010": {
      id: "dn0_3010",
      host: 'http://dn0-1:3010',
      proxy: proxy('http://dn1-1:3110'),
      usage: 0
    },
    "dn0_3020": {
      id: "dn0_3020",
      host: 'http://dn0-2:3020',
      proxy: proxy('http://dn1-2:3120'),
      usage: 0
    },
    "dn1_3100": {
      id: "dn1_3100",
      host: 'http://dn1-0:3100',
      proxy: proxy('http://dn0-0:3000'),
      usage: 0
    },
    "dn1_3110": {
      id: "dn1_3110",
      host: 'http://dn1-1:3110',
      proxy: proxy('http://dn0-1:3010'),
      usage: 0
    },
    "dn1_3120": {
      id: "dn1_3120",
      host: 'http://dn1-2:3120',
      proxy: proxy('http://dn0-2:3020'),
      usage: 0
    }
  };
} else {
  // Local development configuration
  servers = {
    "dn0_3000": {
      id: "dn0_3000",
      host: 'http://localhost:3000',
      proxy: proxy('http://localhost:3100'),
      usage: 0
    },
    "dn0_3010": {
      id: "dn0_3010",
      host: 'http://localhost:3010',
      proxy: proxy('http://localhost:3110'),
      usage: 0
    },
    "dn0_3020": {
      id: "dn0_3020",
      host: 'http://localhost:3020',
      proxy: proxy('http://localhost:3120'),
      usage: 0
    },
    "dn1_3100": {
      id: "dn1_3100",
      host: 'http://localhost:3100',
      proxy: proxy('http://localhost:3000'),
      usage: 0
    },
    "dn1_3110": {
      id: "dn1_3110",
      host: 'http://localhost:3110',
      proxy: proxy('http://localhost:3010'),
      usage: 0
    },
    "dn1_3120": {
      id: "dn1_3120",
      host: 'http://localhost:3120',
      proxy: proxy('http://localhost:3020'),
      usage: 0
    }
  };
}

console.log(`Running in ${isDocker ? 'Docker' : 'local'} environment`);

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
  // Usar Map para garantir que cada servidor só seja contado uma vez (por ID)
  let uniqueServersMap = new Map();
  
  // Agrupar por ID do servidor
  Object.values(servers).forEach(server => {
    uniqueServersMap.set(server.id, server);
  });
  
  let servers_a = Array.from(uniqueServersMap.values());
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

  console.log("RP service running on port " + 4000);
  // test if servers are reachable from proxy server
  request( servers.dn0_3000.host, function (err, res, body) {
   if(err === null){
        console.log('frontend is reachable from proxy server')
   }
   else{
    console.log('frontend is NOT reachable from proxy server')

   }

  });

});


/* __________________________________________________________________________

Configuração do servidor

Colocar portas dos 6 servers e ver se os nodes estão a funcionar
____________________________________________________________________________
Perceber código 

Melhorar Interface dos servers DN




Não, você não precisa alterar mais nada no código. O sistema já está configurado para funcionar corretamente com os servidores que adicionamos.
O código está projetado de forma inteligente para que:
A função reDirect já busca automaticamente o servidor correto pelo ID
A rota /stat já mostra estatísticas de todos os servidores disponíveis
O teste de conectividade já foi atualizado para usar o novo servidor dn0_3000
Você pode usar o sistema assim:
Para acessar um servidor: http://localhost:4000/api?id=dn0_3000 (ou qualquer outro ID)
Para ver estatísticas: http://localhost:4000/stat
Tudo está pronto para funcionar!
____________________________________________________________________________*/