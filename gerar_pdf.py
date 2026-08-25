#!/usr/bin/env python3
"""
====================================================================
  FLEET CONTROL - GERADOR AUTOMATIZADO DE DOCUMENTAÇÃO TÉCNICA PDF
====================================================================
Este script converte o arquivo DOCUMENTACAO_TECNICA.md em um arquivo HTML
com renderização de diagramas Mermaid em vetores SVG e gera um documento
PDF corporativo de alta qualidade técnica via Playwright.
"""

import os
import sys
import asyncio
from playwright.async_api import async_playwright

MD_FILE = "DOCUMENTACAO_TECNICA.md"
PDF_FILE = "DOCUMENTACAO_TECNICA_EXECUTIVA.pdf"

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Documentação Técnica Executiva - Fleet Control</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  
  <!-- Marked.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/marked@12.0.0/marked.min.js"></script>
  <!-- Mermaid.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js"></script>

  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      margin: 0;
      padding: 30px 40px;
      background: #ffffff;
      -webkit-font-smoothing: antialiased;
    }

    /* Estilização Executiva de Títulos */
    h1 {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 3px solid #1e3a8a;
      padding-bottom: 10px;
      margin-top: 35px;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      page-break-after: avoid;
    }
    h2 {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 6px;
      margin-top: 28px;
      margin-bottom: 14px;
      page-break-after: avoid;
    }
    h3 {
      font-size: 15px;
      font-weight: 600;
      color: #334155;
      margin-top: 20px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }

    p, li {
      font-size: 13px;
      color: #334155;
      text-align: justify;
    }
    ul, ol {
      padding-left: 22px;
      margin-bottom: 16px;
    }
    li {
      margin-bottom: 6px;
    }

    /* Tabelas Corporativas */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 22px 0;
      font-size: 12px;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    th {
      background-color: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 10px 12px;
      border: 1px solid #0f172a;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    td {
      padding: 9px 12px;
      border: 1px solid #cbd5e1;
      color: #334155;
      vertical-align: top;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    /* Blocos de Código e Configurações */
    pre, code {
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    }
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      font-size: 11.5px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
      border: 1px solid #1e293b;
      margin: 18px 0;
    }
    code {
      background: #f1f5f9;
      color: #0f172a;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
    }
    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }

    /* Estilização Avançada dos Diagramas Mermaid */
    .mermaid-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 25px 0;
      padding: 20px 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      page-break-inside: avoid;
    }
    .mermaid-container svg {
      max-width: 100% !important;
      height: auto !important;
    }
    .mermaid-container svg text {
      font-size: 15px !important;
      font-family: 'Inter', sans-serif !important;
    }
    .mermaid-container svg .nodeLabel {
      font-size: 15px !important;
      font-weight: 500 !important;
    }
    .mermaid-container svg .edgeLabel {
      font-size: 13.5px !important;
      font-weight: 600 !important;
      background: #ffffff !important;
    }
    .mermaid-container svg .actor text {
      font-size: 16px !important;
      font-weight: 700 !important;
    }

    hr {
      border: 0;
      height: 1px;
      background: #e2e8f0;
      margin: 40px 0;
    }
  </style>
</head>
<body>
  <div id="content"></div>

  <script>
    const markdownContent = __MARKDOWN_RAW_CONTENT__;

    // Configuração do Renderer do Marked.js
    const renderer = new marked.Renderer();
    renderer.code = function({ text, lang }) {
      if (lang === 'mermaid') {
        return `<div class="mermaid-container"><pre class="mermaid">${text}</pre></div>`;
      }
      return `<pre><code class="language-${lang}">${text}</code></pre>`;
    };

    marked.setOptions({
      renderer: renderer,
      gfm: true,
      breaks: true
    });

    // Injeção do Conteúdo HTML Renderizado
    document.getElementById('content').innerHTML = marked.parse(markdownContent);

    // Inicialização e Renderização Assíncrona do Mermaid.js
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    });

    window.renderMermaidDiagrams = async function() {
      await mermaid.run();
    };
  </script>
</body>
</html>
"""

async def generate_pdf():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    md_path = os.path.join(base_dir, MD_FILE)
    pdf_path = os.path.join(base_dir, PDF_FILE)

    if not os.path.exists(md_path):
        print(f"❌ Erro: Arquivo {MD_FILE} não foi encontrado.")
        sys.exit(1)

    with open(md_path, "r", encoding="utf-8") as f:
        md_text = f.read()

    # Escapar conteúdo markdown em JS de forma segura
    import json
    md_json = json.dumps(md_text)

    full_html = HTML_TEMPLATE.replace("__MARKDOWN_RAW_CONTENT__", md_json)

    print("🔄 Iniciando navegador headless via Playwright...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Carregar HTML na página
        await page.set_content(full_html, wait_until="networkidle")

        # Executar renderização assíncrona dos diagramas Mermaid
        print("📐 Renderizando diagramas Mermaid em vetores SVG...")
        await page.evaluate("window.renderMermaidDiagrams()")

        # Aguardar um momento para estabilização de fontes e SVG
        await page.wait_for_timeout(2000)

        # Configuração de Cabeçalho e Rodapé Formais
        header_template = """
        <div style="font-family: 'Inter', sans-serif; font-size: 8px; color: #64748b; width: 100%; padding: 0 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            <span style="font-weight: 700; text-transform: uppercase;">FLEET CONTROL - DOCUMENTAÇÃO TÉCNICA EXECUTIVA</span>
            <span>CONFIDENCIAL / USO CORPORATIVO</span>
        </div>
        """

        footer_template = """
        <div style="font-family: 'Inter', sans-serif; font-size: 8px; color: #64748b; width: 100%; padding: 0 40px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            <span>Sistema Integrado de Gestão de Frota, Rondas e Controle Patrimonial</span>
            <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
        </div>
        """

        print(f"📄 Gerando arquivo PDF ({PDF_FILE})...")
        await page.pdf(
            path=pdf_path,
            format="A4",
            print_background=True,
            display_header_footer=True,
            header_template=header_template,
            footer_template=footer_template,
            margin={
                "top": "60px",
                "bottom": "60px",
                "left": "40px",
                "right": "40px"
            }
        )

        await browser.close()
        print(f"✅ PDF corporativo gerado com sucesso em: {pdf_path}")

if __name__ == "__main__":
    asyncio.run(generate_pdf())
