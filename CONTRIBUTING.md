# Contribuição

## Labels obrigatórios para observability

Sempre que fizeres um Pull Request relacionado com observability (healthchecks, logging, métricas, tracing, Dockerfile HEALTHCHECK, docs de SLO/SLI, etc.), adiciona a label:

```
category:observability
```

Se a label não existir, cria-a com uma cor distinta (ex: azul claro).

## Exemplos de PRs que devem ser etiquetados
- Adição ou alteração de endpoints `/health`
- Mudanças em logging estruturado
- Configuração de métricas/tracing/OpenTelemetry
- Atualização de documentação de SLO/SLI
- Alterações em Dockerfile ou docker-compose relacionadas com healthcheck

## Boas práticas
- Explica no PR como a alteração melhora a observability.
- Refere os serviços afetados.
- Atualiza a documentação se necessário.
