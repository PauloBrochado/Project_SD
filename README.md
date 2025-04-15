# Project_SD
 Project of SD

# 🐝 beeDB - Distributed Key:Value Database

**beeDB** é um banco de dados distribuído baseado em pares `key:value`, construído com Node.js e Express. Ele simula uma arquitetura distribuída real, incluindo técnicas de eleição de líder (Raft) e consistência de replicação (Two-Phase Commit), com suporte a sharding e persistência em disco.

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

<0> - Neste momento o servidor tem uma rota:

/stat  => pede a e apresenta estatistica do servidor.

<1> - Para visualizar ir a um navegador e pesquiser por:
  http://localhost:<PORT>/status 

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

<0> - Instalar docker no computador

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


  *Como Funciona BASE DE DADOS*

<TUDO TEM QUE SER USADO NO TERMINAL>

Adicionar à based de dados:
curl -X POST -H "Content-Type: application/json" -d '{"key":"<KEY_NAME>", "value":{"<nome>":"<NAME>", "<idade>":<IDADE>}}' http://localhost:4000/data

Consultar na base de dados:
curl -X GET -H "Content-Type: application/json" "http://localhost:3000/data/<KEY_NAME>" 

Atualizar na base de dados:
curl -X PUT -H "Content-Type: application/json" -d '{"key":"<KEY_NAME>", "value":{"<nome>":"<NAME>", "<idade>":<IDADE>}}' "http://localhost:3000/data/<KEY_NAME>"

Remover da base de dados:
curl -X DELETE -H "Content-Type: application/json" "http://localhost:3000/data<KEY_NAME>"      