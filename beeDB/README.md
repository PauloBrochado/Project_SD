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
    <Para o rp padrão>
        - 4010
    <Para o rp do Professor (Ainda não funcional!)>
        - 4000

**Caso não exista a pasta node_modules**

<1> - Para o install fazer:
  npm install

<2> - para activar o servidor:
  npm start


**Inicializar servers usando Docker**

<0> - Instalar docker no computador

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
