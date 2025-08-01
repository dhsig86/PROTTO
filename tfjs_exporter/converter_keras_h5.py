import os
import glob
from datetime import datetime
from keras.models import load_model

# Caminho para o diretório do modelo
modelo_dir = "../modelo_base"
os.makedirs(modelo_dir, exist_ok=True)

# Busca arquivos .keras disponíveis
arquivos_keras = glob.glob(os.path.join(modelo_dir, "*.keras"))
if not arquivos_keras:
    raise FileNotFoundError("❌ Nenhum arquivo .keras encontrado.")

# Seleciona o mais recente
arquivo_mais_recente = max(arquivos_keras, key=os.path.getmtime)
print(f"📥 Carregando modelo: {os.path.basename(arquivo_mais_recente)}")

# Carrega o modelo no novo formato
model = load_model(arquivo_mais_recente, compile=False)

# Cria nome com timestamp
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
nome_saida = f"modelo_base_{timestamp}.h5"
caminho_saida = os.path.join(modelo_dir, nome_saida)

# Salva como HDF5
model.save(caminho_saida, save_format='h5')
print(f"✅ Modelo salvo como .h5: {nome_saida}")
