# Como usar 

**Inicializar servers usando Docker**
<1> Usando o terminal e estando no diretório do projeto < .. /PROJECT_SD % > 

  cd beeDB

<2> Se os servers não estiverem criados use o comando 

node dn/generate_servers.js

<3> Caso estejam criados e com o docker instalado usar 

  docker-compose up --build

<4> Parar os servidores usando o comando 

  ctrl + c (no teclado)

**Inicializar servers usando ficheiro beeDBd**

<1> Usando o terminal e estando no diretório do projeto .. PROJECT_SD% 

  cd beeDB

<2> Se os servers não estiverem criados use o comando 

  node dn/generate_servers.js

<3> Inicializar os servidores usando o comando 

  ./beeDBd start

<4> Parar os servidores usando o comando 

  ./beeDBd stop