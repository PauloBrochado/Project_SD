# Project_SD
 Project of SD

# 🐝 beeDB - Distributed Key:Value Database

beeDB é um banco de dados distribuído baseado em pares key:value, com:
- Consenso Raft (eleição de líder, replicação, failover)
- Sharding e replicação
- Persistência em disco
- APIs RESTful para CRUD
- Reverse Proxy inteligente
- Monitoramento e logs estruturados

## 🔧 Arquitetura

O sistema é composto por dois tipos de servidores:

- **Reverse Proxy (RP)**  
  Entrada pública da beeDB. Recebe requisições externas e as distribui entre os Data Nodes conforme o algoritmo de sharding.

- **Data Nodes (DNs)**  
  Responsáveis pelo armazenamento e replicação dos dados. Organizados em grupos com mestre e réplicas. Os DNs usam Raft para eleição de líder e Two-Phase Commit para consistência.

## 📦 Funcionalidades

- Armazenamento de pares `key:value` (valores podem ser strings, números ou JSON de um nível).
- Suporte a rotas RESTful para CRUD.
- Eleição de mestre entre DNs (Raft).
- Replicação consistente (2PC).
- Persistência em disco.
- Logs com Winston.
- Configuração centralizada via `configure.json`.
- Orquestração com Docker e Docker Compose.

# Como usar 

**AVISO**

<0> - Instalar docker no computador

<1> - ObeeDB está configurado para funcionar com 9 servers sendo 3 masters e 6 slaves. Cada master tem 2 slaves associadas a ele. A configuração pode ser alterada no arquivo configure.json.

RP is available at: http://localhost:4000
To access servers, use: http://localhost:4000/api?id=dn0_<port>
To see statistics, use: http://localhost:4000/stat

<2> - Para visualizar status de cada server, abrir a um navegador e pesquiser por:
  http://localhost:<PORT>/status 

<3> - Para visualizar status do Reverse-Proxy, abrir a um navegador e pesquiser por:
  http://localhost:<PORT>/stat

<4> - Para aceder ao servidor através do reverse-proxy, abrir a um navegador e pesquiser por:
  http://localhost:<PORT>/api?id=<server_id>

PORTS podes ser:
 DNs:
    <Node 1>
        - 3000
        - 3010
        - 3020
    <Node 2>
        - 3100
        - 3110
        - 3120
 RP:
    <Para o rp>
        - 4000

**Caso não exista a pasta node_modules**

<1> - Para o install fazer:
  npm install

<2> - para activar o servidor:
  npm start


**Inicializar servers usando Docker**

<1> - Usando o terminal e estando no diretório do projeto < .. /PROJECT_SD % >:
  cd beeDB

<2> - Se os servers não estiverem criados use o comando: 
node dn/generate_servers.js

<3> - Caso estejam criados e com o docker instalado usar: 
  docker-compose up --build

<4> - Parar os servidores usando o comando: 
  ctrl + c (no teclado)

**Inicializar servers usando ficheiro beeDBd**

<1> Usando o terminal e estando no diretório do projeto < .. PROJECT_SD% >:
  cd beeDB

<2> - Se os servers não estiverem criados use o comando: 
  node dn/generate_servers.js

<3> - Para reiniciar os servidores usar comando:
  node dn/reboot_servers.js

<4> - Inicializar os servidores usando o comando: 
  ./beeDBd start

<5> - Parar os servidores usando o comando: 
  ./beeDBd stop

<6> - É possivel também usar os comandos:
  ./beeDBd [start|stop|restart|status|stats]

## Endpoints principais

- **CRUD:**
  - `PUT /api/:key?id=<server_id>` `{ value: ... }`  
  - `GET /api/:key?id=<server_id>`
  - `DELETE /api/:key?id=<server_id>`
- **Status:**
  - `/status` (em cada DN)
  - `/stat` (no RP e nos DNs)

## Exemplo de uso

```sh
curl -X PUT 'http://localhost:4000/api/mykey?id=dn0_3000' -H 'Content-Type: application/json' -d '{"value":123}'
curl 'http://localhost:4000/api/mykey?id=dn0_3000'
curl -X DELETE 'http://localhost:4000/api/mykey?id=dn0_3000'
```

## Monitoramento
- Logs estruturados em `beedb.log`
- `/stat` mostra uso dos servidores
- `/status` mostra estado do nó (líder, follower, etc)

## Testes automatizados
Veja `test/api.test.js` para exemplos de testes automatizados com Jest e Supertest.

## Observações
- Apenas o líder aceita escrita. Followers retornam o endereço do líder.
- O RP descobre automaticamente o líder de cada shard.
- Dados e logs são persistidos em disco.

---