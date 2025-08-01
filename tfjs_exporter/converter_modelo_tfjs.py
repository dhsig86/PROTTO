import os
import glob
import subprocess
from datetime import datetime

# Caminhos relativos
modelo_dir = "../modelo_base"
saida_dir = "./model_tfjs"

# Garantir que a pasta de saída existe
os.makedirs(saida_dir, exist_ok=True)

# Buscar arquivos .h5 na pasta modelo_base
arquivos_h5 = glob.glob(os.path.join(modelo_dir, "*.h5"))

# Verificar se encontrou arquivos
if not arquivos_h5:
    raise FileNotFoundError("❌ Nenhum arquivo .h5 encontrado na pasta modelo_base.")

# Selecionar o mais recente pelo timestamp do arquivo
arquivo_mais_recente = max(arquivos_h5, key=os.path.getmtime)

# Comando para conversão para TF.js
cmd = [
    "tensorflowjs_converter",
    "--input_format", "keras",
    "--output_format", "tfjs_graph_model",
    arquivo_mais_recente,
    saida_dir
]

print(f"🔍 Modelo mais recente encontrado: {os.path.basename(arquivo_mais_recente)}")
print("🔁 Executando conversão para TF.js...")
try:
    subprocess.run(cmd, check=True)
    print("✅ Conversão concluída com sucesso!")
except subprocess.CalledProcessError as e:
    print("❌ Erro ao converter modelo para TensorFlow.js.")
    print(f"Detalhes: {e}")
