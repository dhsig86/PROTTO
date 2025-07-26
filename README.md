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
- `dataset_original/`, `dataset_augmented/`, `modelo_teachable/`, `validacao/`

**Resultados esperados:**
- Métricas objetivas por classe
- Rastreabilidade de erros
- Melhoria contínua por augmentação dirigida

### Organização dos Dados

Cada pasta de dataset deve conter subpastas correspondentes às seis classes
clínicas listadas acima. Por exemplo:

```
dataset_original/
├── Normal/
├── Obstrução do Canal/
├── Otite Média Aguda (OMA)/
├── Otite Externa Aguda (OEA)/
├── Otite Média Crônica (OMC)/
└── Não é uma imagem otoscópica/
```

`dataset_augmented/` segue a mesma estrutura e armazena as imagens após
processos de aumento de dados. Já `validacao/` contém o conjunto utilizado para
avaliar o modelo.

### Executando o Treinamento e a Validação

1. Coloque as imagens nas pastas acima seguindo a estrutura por classes.
2. Execute `python treinar_modelo.py` para treinar e salvar o modelo em
   `modelo_teachable/`.
3. Após o treinamento, rode `python avaliar_modelo.py` para gerar os relatórios
   em `validacao/` (arquivos CSV e matriz de confusão).
