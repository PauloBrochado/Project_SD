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


