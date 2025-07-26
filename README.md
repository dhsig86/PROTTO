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

### Instalação

1. Clone este repositório.
   ```bash
   git clone <url-do-repo>
   cd PROTTO
   ```
2. Crie um ambiente virtual e ative-o.
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Instale as dependências do projeto.
   ```bash
   pip install tensorflow pandas scikit-learn pillow matplotlib
   ```

### Requisitos de Python

- Python >= 3.8
- `tensorflow`
- `pandas`
- `scikit-learn`
- `pillow`
- `matplotlib`

### Exemplos de Comandos

Treinamento do modelo:
```bash
python treinar_modelo.py --dataset dataset_augmented --output modelo_teachable/modelo.keras
```

Validação do modelo com o script de avaliação:
```bash
python avaliar_modelo.py --model modelo_teachable/modelo.keras --dataset validacao --csv resultados.csv
```

Retraining aproveitando os erros mapeados:
```bash
python treinar_modelo.py --dataset dataset_augmented --pesos modelo_teachable/modelo.keras \
    --retrain --output modelo_teachable/modelo_retrain.keras
```
