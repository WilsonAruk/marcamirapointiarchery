PointIArchery · Marcações de Mira
Módulo de marcações de mira por distância. É feito em HTML, CSS e JavaScript puro, sem dependências e sem build.
Como publicar no GitHub Pages
Crie um repositório no GitHub, por exemplo `pointiarchery-mira`.
Envie todos os arquivos desta pasta para a raiz do repositório: `index.html`, `styles.css`, `app.js` e a pasta `assets/`.
No repositório, abra Settings › Pages.
Em Source, escolha Deploy from a branch. Depois selecione a branch `main` e a pasta `/ (root)` e clique em Save.
Depois de 1 a 2 minutos, o site fica disponível em `https://SEU-USUARIO.github.io/pointiarchery-mira/`.
Para testar no computador, basta abrir o `index.html` no navegador.
Funcionalidades
Arco: Recurvo, Composto ou Barebow. Cada arco tem suas próprias marcações.
Categoria:
Convencional: Adulto, Sub-21, Sub-18 e Master 50+.
PCD: Para Aberto, W1, VI 1 e VI 2/3.
Flecha: tubo fino ou largo. Cada combinação de arco e flecha tem suas próprias marcações.
Sexo: Masculino ou Feminino, que muda as distâncias do round 1440.
Marcações medidas e estimadas: as estimadas são calculadas por interpolação linear entre as distâncias medidas.
Ajuste: botões −/+ com passo de 0,05, 0,1 ou 0,25, além de digitação direta do valor.
Salvamento automático no navegador (localStorage).
Impressão da tabela, pelo ícone de impressora.
Distâncias (World Archery)
Categoria	Indoor	Outdoor
Recurvo Adulto/Sub-21 M	18, 25 m	90, 70, 50, 30 m (principal: 70 m)
Recurvo Adulto/Sub-21 F	18, 25 m	70, 60, 50, 30 m (principal: 70 m)
Recurvo Sub-18 / Master M	18, 25 m	70, 60, 50, 30 m (principal: 60 m)
Recurvo Sub-18 / Master F	18, 25 m	60, 50, 40, 30 m (principal: 60 m)
Composto (todas)	18, 25 m	1440 da categoria + 50 m (principal)
Barebow	18, 25 m	50 m
Para Aberto Recurvo	18 m	70 m
Para Aberto Composto	18 m	50 m
Para W1	18 m	50 m (alvo de 80 cm)
Para VI 1 e VI 2/3	18 m	30 m (alvo de 80 cm)
As distâncias ficam na função `buildDistances()` do arquivo `app.js`. Se precisar ajustar alguma regra, a mudança é feita só ali.
Integração com o sistema
Hoje os dados ficam no `localStorage`, na chave `pointiarchery.sightmarks.v1`. Para salvar no banco do PointIArchery, troque as funções `load()` e `persist()` do `app.js` por chamadas à sua API.
O formato dos dados é este:
```json
{ "arrow": "fina", "marks": { "R|fina": { "18": 2.1, "70": 7.2 }, "R|larga": { "18": 2.4 }, "C|fina": {} } }
```
