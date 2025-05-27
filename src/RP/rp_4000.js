const proxy = require('express-http-proxy');
const axios = require('axios');

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

// Mapeamento de shard para servidores
const shardMap = {
  'dn0': ['dn0_3000', 'dn0_3010', 'dn0_3020'],
  'dn1': ['dn1_3100', 'dn1_3110', 'dn1_3120']
};
// Cache de líderes
let leaderCache = {};

// Atualiza o cache de líderes periodicamente
async function updateLeaders() {
  for (const [shard, ids] of Object.entries(shardMap)) {
    for (const id of ids) {
      try {
        const res = await axios.get(servers[id].host + '/status', { timeout: 500 });
        if (res.data.state === 'leader') {
          leaderCache[shard] = id;
          break;
        }
      } catch (e) { /* ignora erro */ }
    }
  }
}
setInterval(updateLeaders, 2000);
updateLeaders();

function getShardFromId(id) {
  return id.split('_')[0];
}

function getRandomReplica(shard) {
  const ids = shardMap[shard];
  return ids[Math.floor(Math.random() * ids.length)];
}

async function smartRedirect(req, resp, next) {
  let id = req.query.id;
  if (!id) return next({ error: 'missing id' });
  const shard = getShardFromId(id);
  const method = req.method.toUpperCase();
  await updateLeaders(); // garantir cache atualizado
  const leaderId = leaderCache[shard];
  if (!leaderId) return resp.status(503).json({ error: 'No leader available for shard ' + shard });
  // Escrita: só o líder aceita
  if (['PUT', 'DELETE', 'POST'].includes(method)) {
    if (id !== leaderId) {
      // Redireciona para o líder
      return resp.status(307).json({ error: 'Not leader', leader: leaderId, leaderHost: servers[leaderId].host });
    }
    servers[leaderId].usage++;
    return servers[leaderId].proxy(req, resp, next);
  }
  // Leitura: pode ir para qualquer réplica
  const replicaId = getRandomReplica(shard);
  servers[replicaId].usage++;
  return servers[replicaId].proxy(req, resp, next);
}

//app.use('/api', f1,reDirect, f2);
app.use('/api', smartRedirect);

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
