# from pypdf import PdfReader, PdfWriter

# # --- Configuração OBRIGATÓRIA pelo usuário ---
# # Substitua os valores None pelos números corretos das páginas do SEU ARQUIVO PDF.
# # Lembre-se que a indexação é baseada em zero (subtraia 1 do número da página do visualizador PDF).

# # Seção de Referências
# # Esta é a mais variável. Localize o início e o fim da seção de bibliografia/referências no seu PDF.
# ref_inicio_pdf_idx = 397  # Ex: 397
# ref_fim_pdf_idx = 514     # Ex: 514

# # --- Nomes dos arquivos ---
# input_pdf_path = "TRATADO DE MEDICINA ENDOCANABINOIDES_compressed.pdf"
# output_pdf_path = "Tratado_Selecionado_Ref.pdf"

# # --- Lógica do Script ---
# def extrair_paginas_pdf(input_path, output_path, ranges_idx):
#     """
#     Extrai páginas específicas de um PDF e salva em um novo arquivo.

#     :param input_path: Caminho para o arquivo PDF de entrada.
#     :param output_path: Caminho para salvar o novo arquivo PDF.
#     :param ranges_idx: Lista de tuplas, onde cada tupla contém
#                        (indice_pagina_inicio, indice_pagina_fim)
#                        para as seções a serem extraídas.
#                        Os índices são baseados em zero.
#     """
#     try:
#         reader = PdfReader(input_path)
#         writer = PdfWriter()

#         paginas_adicionadas = 0
#         for secao_idx, (inicio_idx, fim_idx) in enumerate(ranges_idx):
#             if inicio_idx is None or fim_idx is None:
#                 print(f"AVISO: Intervalo para a seção {secao_idx + 1} não foi definido. Pulando esta seção.")
#                 continue

#             if inicio_idx > fim_idx:
#                 print(f"AVISO: Índice de início ({inicio_idx}) é maior que o índice de fim ({fim_idx}) para a seção {secao_idx + 1}. Pulando.")
#                 continue

#             if inicio_idx >= len(reader.pages) or fim_idx >= len(reader.pages):
#                 print(f"AVISO: Intervalo de páginas ({inicio_idx}-{fim_idx}) para a seção {secao_idx + 1} está fora dos limites do PDF ({len(reader.pages)} páginas). Pulando.")
#                 continue

#             print(f"Adicionando seção {secao_idx + 1}: páginas PDF (0-indexado) {inicio_idx} a {fim_idx}")
#             for i in range(inicio_idx, fim_idx + 1):
#                 writer.add_page(reader.pages[i])
#                 paginas_adicionadas +=1

#         if paginas_adicionadas > 0:
#             with open(output_path, "wb") as f_output:
#                 writer.write(f_output)
#             print(f"\nPDF '{output_path}' criado com sucesso com {paginas_adicionadas} páginas.")
#         else:
#             print("\nNenhuma página foi adicionada. O PDF de saída não foi criado.")

#     except FileNotFoundError:
#         print(f"ERRO: O arquivo de entrada '{input_path}' não foi encontrado.")
#     except Exception as e:
#         print(f"Ocorreu um erro inesperado: {e}")

# if __name__ == "__main__":
#     # Verifique se todos os índices de página foram definidos antes de prosseguir.
#     ranges_para_extrair = [
#         (ref_inicio_pdf_idx, ref_fim_pdf_idx),
#     ]

#     # Filtra ranges que não foram completamente definidos para evitar erros
#     ranges_validos = [(s, e) for s, e in ranges_para_extrair if s is not None and e is not None]

#     if not ranges_validos:
#         print("ERRO: Nenhum intervalo de páginas foi definido corretamente. "
#               "Por favor, edite o script e defina os valores para "
#               "'ref_inicio_pdf_idx' e 'ref_fim_pdf_idx'.")
#     else:
#         print("Iniciando a extração de páginas do PDF...")
#         print("Lembre-se: os números de página são 0-indexados (Número do visualizador PDF - 1).")
#         print("----------------------------------------------------------------------")
#         print(f"Intervalos configurados (0-indexado):")
#         if ref_inicio_pdf_idx is not None: print(f"  Referências: {ref_inicio_pdf_idx} - {ref_fim_pdf_idx}")
#         print("----------------------------------------------------------------------")
#         extrair_paginas_pdf(input_pdf_path, output_pdf_path, ranges_validos)



from pypdf import PdfReader, PdfWriter
import os

# --- Configuração OBRIGATÓRIA pelo usuário ---
# Substitua os valores None pelos números corretos das páginas do SEU ARQUIVO PDF.
# Lembre-se que a indexação é baseada em zero (subtraia 1 do número da página do visualizador PDF).

# Seção de Referências
ref_inicio_pdf_idx = 350  # Ex: 397
ref_fim_pdf_idx = 397     # Ex: 514

# Tamanho de cada PDF (em páginas)
paginas_por_pdf = 30

# --- Nomes dos arquivos ---
input_pdf_path = "TRATADO DE MEDICINA ENDOCANABINOIDES_compressed.pdf"
output_pdf_base = "Tratado_Selecionado_RefF"

# --- Lógica do Script ---
def extrair_paginas_pdf_em_partes(input_path, output_base, inicio_idx, fim_idx, paginas_por_arquivo):
    """
    Extrai páginas específicas de um PDF e salva em múltiplos arquivos com número fixo de páginas.

    :param input_path: Caminho para o arquivo PDF de entrada.
    :param output_base: Nome base para os arquivos de saída (será adicionado um sufixo numérico).
    :param inicio_idx: Índice da primeira página a ser extraída (0-indexado).
    :param fim_idx: Índice da última página a ser extraída (0-indexado).
    :param paginas_por_arquivo: Número de páginas por arquivo de saída.
    """
    try:
        reader = PdfReader(input_path)
        
        # Verificar limites do PDF
        if inicio_idx >= len(reader.pages) or fim_idx >= len(reader.pages):
            print(f"ERRO: Intervalo de páginas ({inicio_idx}-{fim_idx}) está fora dos limites do PDF ({len(reader.pages)} páginas).")
            return
        
        total_paginas = fim_idx - inicio_idx + 1
        num_arquivos = (total_paginas + paginas_por_arquivo - 1) // paginas_por_arquivo
        
        print(f"Extraindo {total_paginas} páginas em {num_arquivos} arquivos PDF...")
        
        for i in range(num_arquivos):
            writer = PdfWriter()
            
            # Calcular intervalo para este arquivo
            parte_inicio = inicio_idx + (i * paginas_por_arquivo)
            parte_fim = min(inicio_idx + ((i + 1) * paginas_por_arquivo) - 1, fim_idx)
            
            # Nome do arquivo de saída
            output_path = f"{output_base}_{i+1}.pdf"
            
            print(f"Criando arquivo {i+1}/{num_arquivos}: {output_path}")
            print(f"  Adicionando páginas {parte_inicio} a {parte_fim}")
            
            # Adicionar páginas para este arquivo
            for page_idx in range(parte_inicio, parte_fim + 1):
                writer.add_page(reader.pages[page_idx])
            
            # Salvar o arquivo
            with open(output_path, "wb") as f_output:
                writer.write(f_output)
            
            print(f"  Arquivo salvo com {parte_fim - parte_inicio + 1} páginas.")
        
        print(f"\nProcesso concluído. {num_arquivos} arquivos PDF foram criados.")

    except FileNotFoundError:
        print(f"ERRO: O arquivo de entrada '{input_path}' não foi encontrado.")
    except Exception as e:
        print(f"Ocorreu um erro inesperado: {e}")

if __name__ == "__main__":
    if ref_inicio_pdf_idx is None or ref_fim_pdf_idx is None:
        print("ERRO: Os índices das páginas de referência não foram definidos corretamente.")
    else:
        print("Iniciando a extração de páginas do PDF em arquivos de 30 páginas...")
        print("Lembre-se: os números de página são 0-indexados (Número do visualizador PDF - 1).")
        print("----------------------------------------------------------------------")
        print(f"Intervalo total: {ref_inicio_pdf_idx} - {ref_fim_pdf_idx}")
        print(f"Páginas por arquivo: {paginas_por_pdf}")
        print("----------------------------------------------------------------------")
        
        extrair_paginas_pdf_em_partes(
            input_path=input_pdf_path,
            output_base=output_pdf_base,
            inicio_idx=ref_inicio_pdf_idx,
            fim_idx=ref_fim_pdf_idx,
            paginas_por_arquivo=paginas_por_pdf
        )