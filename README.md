### Projeto: Classificador Otoscópico + Sistema de Validação (Teachable Images)

**Objetivo:** Criar um sistema de classificação de imagens otoscópicas com 6 classes clínicas e sistema de validação automatizado para avaliar erros e ajustar o treinamento.

**Classes:**
1. Normal
2. Obstrução do Canal
3. Otite Média Aguda (OMA)
4. Otite Externa Aguda (OEA)
5. Otite Média Crônica (OMC)
6. Não é uma imagem otoscópica

**Componentes do Projeto:**
- Dataset original e aumentado organizado por classes
- Treinamento com Teachable Images (modelo exportado `.keras`)
- Script `avaliar_modelo.py` para validação (gera CSV e matriz de confusão)
- Estrutura para retraining baseada em feedback (erros marcados no CSV)
- Fase futura: App de revisão com Streamlit

**Pasta principal:**
- `dataset/original/`, `dataset/augmented/`, `modelo_teachable/`, `backend_validation/`

**Resultados esperados:**
- Métricas objetivas por classe
- Rastreabilidade de erros
- Melhoria contínua por augmentação dirigida

### Organização dos Dados

Cada pasta de dataset deve conter subpastas correspondentes às seis classes
clínicas listadas acima. Por exemplo:

```
dataset/original/
├── Normal/
├── Obstrução do Canal/
├── Otite Média Aguda (OMA)/
├── Otite Externa Aguda (OEA)/
├── Otite Média Crônica (OMC)/
└── Não é uma imagem otoscópica/
```

`dataset/augmented/` segue a mesma estrutura e armazena as imagens após
processos de aumento de dados. Já `backend_validation/` contém o conjunto
utilizado para avaliar o modelo e guardar arquivos intermediários.
Os relatórios finais (CSV de validação e matriz de confusão) são gerados em
`docs/`.

### Executando o Treinamento e a Validação

1. Coloque as imagens nas pastas acima seguindo a estrutura por classes.
2. Execute `python treinar_modelo.py` para treinar e salvar o modelo em
   `backend_validation/`.
3. Após o treinamento, rode `python avaliar_modelo.py` para gerar os relatórios
   em `docs/` (arquivos CSV e matriz de confusão). O arquivo `predicoes.csv`
   permanece em `backend_validation/` para consulta detalhada.

### Web Front-end
Consulte `frontend_web/README.md` para executar a interface web que carrega o modelo TensorFlow.js e permite classificar imagens diretamente no navegador.
