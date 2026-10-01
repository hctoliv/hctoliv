// Catálogo de exemplo da InoveLabor.
// Para adicionar um produto, inclua um objeto nesta lista: { sku, nome, categoria, sub, desc }.
// "categoria" deve existir em CATEGORIAS.
window.CATEGORIAS = [
  { id: "equipamentos", nome: "Equipamentos", icone: "⚙️", desc: "pHmetros, centrífugas, espectrofotômetros, agitadores e mais." },
  { id: "vidrarias", nome: "Vidrarias", icone: "🧪", desc: "Vidro borossilicato 3.3: béqueres, erlenmeyers, provetas e balões." },
  { id: "reagentes", nome: "Reagentes", icone: "⚗️", desc: "Solventes, ácidos, bases, sais e soluções padrão." },
  { id: "kits", nome: "Kits Didáticos", icone: "🎒", desc: "Laboratórios portáteis para ensino fundamental e médio." },
  { id: "acessorios", nome: "Acessórios", icone: "🧰", desc: "Micropipetas, ponteiras, suportes, pinças e EPIs." }
];

window.PRODUTOS = [
  // Equipamentos
  { sku: "IL-EQ-001", nome: "pHmetro de Bancada Digital", categoria: "equipamentos", sub: "Medição", desc: "Faixa 0–14 pH, compensação automática de temperatura e calibração em até 3 pontos." },
  { sku: "IL-EQ-002", nome: "Eletrodo de pH Combinado", categoria: "equipamentos", sub: "Medição", desc: "Corpo em epóxi, conector BNC, para uso geral em soluções aquosas." },
  { sku: "IL-EQ-003", nome: "Espectrofotômetro UV-VIS", categoria: "equipamentos", sub: "Análise", desc: "Faixa 190–1100 nm, varredura e software para análises quantitativas." },
  { sku: "IL-EQ-004", nome: "Turbidímetro Microprocessado", categoria: "equipamentos", sub: "Análise", desc: "Leitura em NTU, ideal para controle de qualidade de água." },
  { sku: "IL-EQ-005", nome: "Medidor de Oxigênio Dissolvido", categoria: "equipamentos", sub: "Medição", desc: "Leitura em mg/L e % de saturação, sensor polarográfico." },
  { sku: "IL-EQ-006", nome: "Contador de Colônias", categoria: "equipamentos", sub: "Microbiologia", desc: "Iluminação uniforme, lente de aumento e contador digital." },
  { sku: "IL-EQ-007", nome: "Destilador de Água tipo Pilsen", categoria: "equipamentos", sub: "Preparo", desc: "Produção de água destilada com caldeira em aço inox." },
  { sku: "IL-EQ-008", nome: "Centrífuga Microprocessada", categoria: "equipamentos", sub: "Preparo", desc: "Rotor para tubos de 15 mL, controle de tempo e velocidade." },
  { sku: "IL-EQ-009", nome: "Chapa Aquecedora com Agitação", categoria: "equipamentos", sub: "Preparo", desc: "Plataforma cerâmica, aquecimento até 340 °C e agitação magnética." },
  { sku: "IL-EQ-010", nome: "Microscópio Biológico Binocular", categoria: "equipamentos", sub: "Microscopia", desc: "Objetivas acromáticas 4x a 100x, iluminação LED." },
  { sku: "IL-EQ-011", nome: "Balança Analítica 0,0001 g", categoria: "equipamentos", sub: "Pesagem", desc: "Capela de vidro, calibração interna e saída de dados." },
  { sku: "IL-EQ-012", nome: "Condutivímetro de Bancada", categoria: "equipamentos", sub: "Medição", desc: "Condutividade, TDS e salinidade com compensação de temperatura." },

  // Vidrarias
  { sku: "IL-VD-001", nome: "Béquer de Vidro Forma Baixa", categoria: "vidrarias", sub: "Béqueres", desc: "Borossilicato 3.3, graduado, de 50 mL a 2000 mL." },
  { sku: "IL-VD-002", nome: "Erlenmeyer de Vidro 3.3 Boca Larga", categoria: "vidrarias", sub: "Frascos", desc: "Resistente a choque térmico, de 125 mL a 1000 mL." },
  { sku: "IL-VD-003", nome: "Proveta Graduada Base Hexagonal", categoria: "vidrarias", sub: "Volumetria", desc: "Classe B, de 10 mL a 1000 mL." },
  { sku: "IL-VD-004", nome: "Balão Volumétrico com Rolha", categoria: "vidrarias", sub: "Volumetria", desc: "Classe A, rolha em polietileno, de 25 mL a 1000 mL." },
  { sku: "IL-VD-005", nome: "Tubo de Ensaio sem Borda", categoria: "vidrarias", sub: "Tubos", desc: "Diversos diâmetros, pacote com 100 unidades." },
  { sku: "IL-VD-006", nome: "Pipeta Graduada", categoria: "vidrarias", sub: "Volumetria", desc: "Esgotamento total, de 1 mL a 25 mL." },
  { sku: "IL-VD-007", nome: "Placa de Petri de Vidro", categoria: "vidrarias", sub: "Microbiologia", desc: "90 x 15 mm, reutilizável e autoclavável." },
  { sku: "IL-VD-008", nome: "Bureta com Torneira de PTFE", categoria: "vidrarias", sub: "Volumetria", desc: "Classe A, 25 mL e 50 mL, para titulações." },

  // Reagentes
  { sku: "IL-RG-001", nome: "Álcool Etílico Absoluto P.A.", categoria: "reagentes", sub: "Solventes", desc: "Pureza mínima 99,5%, frascos de 1 L." },
  { sku: "IL-RG-002", nome: "Acetona P.A.", categoria: "reagentes", sub: "Solventes", desc: "Grau analítico, frascos de 1 L." },
  { sku: "IL-RG-003", nome: "Ácido Clorídrico P.A. 37%", categoria: "reagentes", sub: "Ácidos", desc: "Produto controlado, venda mediante documentação." },
  { sku: "IL-RG-004", nome: "Hidróxido de Sódio Micropérolas P.A.", categoria: "reagentes", sub: "Bases", desc: "Embalagens de 500 g e 1 kg." },
  { sku: "IL-RG-005", nome: "Cloreto de Sódio P.A.", categoria: "reagentes", sub: "Sais", desc: "Grau analítico, embalagem de 500 g." },
  { sku: "IL-RG-006", nome: "Solução Tampão pH 4, 7 e 10", categoria: "reagentes", sub: "Soluções padrão", desc: "Para calibração de pHmetros, frascos de 500 mL." },
  { sku: "IL-RG-007", nome: "Solução Padrão de Condutividade", categoria: "reagentes", sub: "Soluções padrão", desc: "146,9 µS/cm e 1413 µS/cm, rastreável." },
  { sku: "IL-RG-008", nome: "Ágar Nutriente", categoria: "reagentes", sub: "Meios de cultura", desc: "Meio de cultura desidratado, frasco de 500 g." },

  // Kits
  { sku: "IL-KT-001", nome: "Laboratório Portátil de Ciências (Ensino Fundamental)", categoria: "kits", sub: "Ensino", desc: "Maleta com vidrarias, reagentes seguros e roteiro de experimentos." },
  { sku: "IL-KT-002", nome: "Laboratório Portátil de Biologia (Ensino Médio)", categoria: "kits", sub: "Ensino", desc: "Microscópio, lâminas, corantes e manual do professor." },
  { sku: "IL-KT-003", nome: "Laboratório Portátil de Química (Ensino Médio)", categoria: "kits", sub: "Ensino", desc: "Vidrarias, indicadores e experimentos de estequiometria e pH." },
  { sku: "IL-KT-004", nome: "Laboratório Portátil de Física", categoria: "kits", sub: "Ensino", desc: "Experimentos de mecânica, óptica e eletricidade." },

  // Acessórios
  { sku: "IL-AC-001", nome: "Micropipeta Monocanal Volume Variável", categoria: "acessorios", sub: "Pipetagem", desc: "Faixas de 0,5 µL a 10 mL, autoclavável." },
  { sku: "IL-AC-002", nome: "Ponteiras Universais", categoria: "acessorios", sub: "Pipetagem", desc: "10 µL, 200 µL e 1000 µL, pacote com 1000 unidades." },
  { sku: "IL-AC-003", nome: "Suporte Universal com Garra", categoria: "acessorios", sub: "Suportes", desc: "Base em ferro pintado e haste de 70 cm." },
  { sku: "IL-AC-004", nome: "Pisseta Graduada", categoria: "acessorios", sub: "Plásticos", desc: "Polietileno, 250 mL e 500 mL." },
  { sku: "IL-AC-005", nome: "Óculos de Proteção Ampla Visão", categoria: "acessorios", sub: "EPI", desc: "Lente em policarbonato antiembaçante." },
  { sku: "IL-AC-006", nome: "Barra Magnética Revestida em PTFE", categoria: "acessorios", sub: "Agitação", desc: "Diversos tamanhos para agitadores magnéticos." }
];
